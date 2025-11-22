import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BowTieGraph from './components/BowTieGraph';
import ChatInterface from './components/ChatInterface';
import { INITIAL_REACTFLOW_NODES, INITIAL_REACTFLOW_EDGES } from './constants';
import { ChatMessage, ContentType, MessageRole, NodeType } from './types';
import { generateProcessResponse } from './services/geminiService';
import { 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  MarkerType 
} from 'reactflow';

const App: React.FC = () => {
  // State for React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_REACTFLOW_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_REACTFLOW_EDGES);

  // State for Chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: MessageRole.MODEL,
      content: "Welcome to ProcessFlow AI. \n\nYou can upload procedures or describe a process, and I'll visualize it for you.",
      type: ContentType.TEXT,
      timestamp: Date.now()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // File Input Ref for Import (Project Level)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Graph Manipulation Handlers ---

  // Defined first so it can be passed to nodes
  const handleUpdateNode = useCallback((id: string, title: string, description: string) => {
    setNodes((nds) => nds.map(node => {
      if (node.id === id) {
        // Create a new data object to ensure React Flow detects change
        return { ...node, data: { ...node.data, title, description } };
      }
      return node;
    }));
  }, [setNodes]);

  // Inject handleUpdateNode into nodes that don't have it (e.g. initial nodes)
  useEffect(() => {
    setNodes((nds) => nds.map(node => {
      if (!node.data.onEdit) {
        return { ...node, data: { ...node.data, onEdit: handleUpdateNode } };
      }
      return node;
    }));
  }, [handleUpdateNode, setNodes]);

  const handleAddNode = (type: NodeType, title?: string, description?: string, desiredId?: string) => {
    // Simple auto-layout logic for manual adds
    const xPos = 100 + (nodes.length * 50); 
    const yPos = 100 + (nodes.length * 50);

    const newNodeId = desiredId || `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const newNode: Node = {
      id: newNodeId,
      type: 'processNode',
      position: { x: xPos, y: yPos },
      data: {
        id: newNodeId,
        type: NodeType.PROCESS_STEP,
        title: title || `New Step`,
        description: description || '',
        onEdit: handleUpdateNode // Pass the handler explicitly
      },
    };
    setNodes((nds) => [...nds, newNode]);
    return newNodeId;
  };

  const handleDeleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  const handleConnect = useCallback((params: Connection) => {
     const newEdge = { 
      ...params, 
      id: `e-${Date.now()}`,
      style: { strokeWidth: 2, stroke: '#64748b' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' }
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  const handleUpdateEdge = (id: string, label: string) => {
    setEdges((eds) => eds.map(e => {
      if (e.id === id) {
        return { ...e, label };
      }
      return e;
    }));
  };

  const handleDeleteEdge = (id: string) => {
    setEdges((eds) => eds.filter(e => e.id !== id));
  };

  // --- Chat Operations ---

  const addMessage = (role: MessageRole, content: string, type: ContentType = ContentType.TEXT, extra?: Partial<ChatMessage>) => {
    const newMsg: ChatMessage = {
      id: uuidv4(),
      role,
      content,
      type,
      timestamp: Date.now(),
      ...extra
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'init-1',
        role: MessageRole.MODEL,
        content: "Welcome to ProcessFlow AI. \n\nYou can upload procedures or describe a process, and I'll visualize it for you.",
        type: ContentType.TEXT,
        timestamp: Date.now()
      }
    ]);
  };

  const handleSendMessage = async (text: string, fileContent?: string) => {
    const userDisplayMessage = text || (fileContent ? "Attached document for analysis." : "...");
    addMessage(MessageRole.USER, userDisplayMessage, ContentType.TEXT, { attachedFileName: fileContent ? "Attached Document" : undefined });
    setIsTyping(true);

    // API Call
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content + (m.attachedFileName ? "\n[User attached a file in this turn]" : "") }]
    }));
    
    // Serialize full graph state 
    const graphContext = JSON.stringify({
      nodes: nodes.map(n => ({ id: n.id, label: n.data.title, description: n.data.description })),
      edges: edges.map(e => ({ source: e.source, target: e.target, label: e.label }))
    });

    const response = await generateProcessResponse(history, text, graphContext, fileContent);
    
    // Execute Tools if present
    if (response.toolCalls && response.toolCalls.length > 0) {
      let changeLog = "";
      
      let localNodes = [...nodes];
      let localEdges = [...edges];

      // Helper for AI adding nodes
      const addNodeLocally = (title?: string, description?: string, desiredId?: string) => {
         // Naive auto-layout for AI generation (staggered)
         const count = localNodes.length;
         const xPos = (count % 3) * 300;
         const yPos = Math.floor(count / 3) * 150;
         
         const newNodeId = desiredId || `n-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

         const newNode: Node = {
          id: newNodeId,
          type: 'processNode',
          position: { x: xPos, y: yPos },
          data: {
            id: newNodeId,
            type: NodeType.PROCESS_STEP,
            title: title || `Step`,
            description: description || '',
            onEdit: handleUpdateNode // Ensure AI nodes also get the handler
          },
        };
        localNodes.push(newNode);
        return newNodeId;
      };

      response.toolCalls.forEach(tool => {
        if (tool.name === 'clear_graph') {
          localNodes = [];
          localEdges = [];
          changeLog += "• Cleared canvas\n";
        }
        else if (tool.name === 'add_node') {
          const { title, description, id } = tool.args;
          addNodeLocally(title, description, id);
          changeLog += `• Added: ${title}\n`;
        } 
        else if (tool.name === 'connect_nodes') {
          const { sourceId, targetId, label } = tool.args;
          const newEdge = {
            id: `e-ai-${Date.now()}-${Math.random()}`,
            source: sourceId,
            target: targetId,
            label: label || '',
            style: { strokeWidth: 2, stroke: '#64748b' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' }
          };
          localEdges = addEdge(newEdge, localEdges);
          changeLog += `• Connected ${sourceId} -> ${targetId}\n`;
        }
        else if (tool.name === 'update_node') {
           const { id, title, description } = tool.args;
           const nodeIndex = localNodes.findIndex(n => n.id === id);
           if (nodeIndex !== -1) {
              const n = localNodes[nodeIndex];
              localNodes[nodeIndex] = {
                 ...n,
                 data: { ...n.data, title: title || n.data.title, description: description !== undefined ? description : n.data.description }
              };
              changeLog += `• Updated: ${title || n.data.title}\n`;
           }
        }
      });

      setNodes(localNodes);
      setEdges(localEdges);

      if (changeLog) {
        response.text = (response.text || "") + "\n\n**Changes:**\n" + changeLog;
      }
    }

    addMessage(MessageRole.MODEL, response.text || "Graph updated.");
    setIsTyping(false);
  };

  // --- Import / Export Handlers ---

  const handleSaveModel = () => {
    const modelData = {
      metadata: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        appName: 'ProcessFlow AI'
      },
      nodes,
      edges
    };
    
    const blob = new Blob([JSON.stringify(modelData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `process-flow-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
          // Inject handler into imported nodes
          const importedNodes = data.nodes.map((n: Node) => ({
            ...n,
            data: { ...n.data, onEdit: handleUpdateNode }
          }));
          setNodes(importedNodes);
          setEdges(data.edges);
          addMessage(MessageRole.MODEL, `Imported ${data.nodes.length} steps.`);
        } else {
          addMessage(MessageRole.MODEL, "Invalid file format.");
        }
      } catch (error) {
        console.error("Import error:", error);
        addMessage(MessageRole.MODEL, "Error parsing file.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden selection:bg-blue-100">
      
      {/* HEADER */}
      <header className="h-auto bg-white border-b border-slate-200 flex flex-col shrink-0 z-30 shadow-sm">
        <div className="h-16 flex items-center px-8 justify-between">
           <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg shadow-slate-400/20">
               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path></svg>
             </div>
             <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">ProcessFlow AI</h1>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Visualizer</span>
             </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Steps</span>
                <span className="text-sm font-semibold text-slate-700">{nodes.length}</span>
              </div>
              
              {/* Hidden File Input for Model Import */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".json"
              />

              <div className="h-8 w-px bg-slate-100"></div>
              
              <button 
                onClick={handleImportClick}
                className="px-3 py-2 text-slate-600 bg-white border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                Import
              </button>
              
              <button 
                onClick={handleSaveModel}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
              >
                Save
              </button>
           </div>
        </div>
      </header>

      {/* MAIN CONTENT: Graph */}
      <main className="flex-1 relative overflow-hidden bg-slate-100">
        <BowTieGraph 
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onAddNode={(type) => handleAddNode(type)} 
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onUpdateEdge={handleUpdateEdge}
          onDeleteEdge={handleDeleteEdge}
        />
      </main>

      {/* BOTTOM: Chat */}
      <section className="h-[40vh] shrink-0 z-40 relative border-t border-slate-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
        <ChatInterface 
          messages={messages} 
          isTyping={isTyping} 
          onSendMessage={handleSendMessage}
          onSuggestionClick={(text) => handleSendMessage(text)}
          onClearChat={handleClearChat}
        />
      </section>

    </div>
  );
};

export default App;