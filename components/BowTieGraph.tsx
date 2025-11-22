import React, { useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Edge, 
  Node, 
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import { NodeType } from '../types';
import ProcessNode from './RiskNode';

interface ProcessGraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onAddNode: (type: NodeType) => void;
  onUpdateNode: (id: string, title: string, description: string) => void;
  onDeleteNode: (id: string) => void;
  onUpdateEdge: (id: string, label: string) => void;
  onDeleteEdge: (id: string) => void;
}

const nodeTypes = {
  processNode: ProcessNode,
};

const ProcessGraphContent: React.FC<ProcessGraphProps> = ({ 
  nodes, edges, onNodesChange, onEdgesChange, onConnect,
  onAddNode, onDeleteNode, onUpdateEdge, onDeleteEdge
}) => {
  
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const [edgeLabelInput, setEdgeLabelInput] = useState('');

  React.useEffect(() => {
    // Only keep the delete listener as it is triggered from the node
    const handleNodeDelete = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { id } = customEvent.detail;
      onDeleteNode(id);
    };

    window.addEventListener('node-delete', handleNodeDelete);
    
    return () => {
      window.removeEventListener('node-delete', handleNodeDelete);
    };
  }, [onDeleteNode]);

  const onEdgeClick = (event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setEditingEdge(edge);
    setEdgeLabelInput(edge.label as string || '');
  };

  const saveEdgeEdit = () => {
    if (editingEdge) {
      onUpdateEdge(editingEdge.id, edgeLabelInput);
      setEditingEdge(null);
    }
  };

  const deleteEdge = () => {
    if (editingEdge) {
      onDeleteEdge(editingEdge.id);
      setEditingEdge(null);
    }
  };

  return (
    <div className="w-full h-full relative bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        attributionPosition="bottom-right"
      >
        <Background color="#cbd5e1" gap={24} size={1} />
        <Controls className="bg-white border border-slate-200 shadow-sm" />
        
        <Panel position="top-center" className="bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm border border-slate-200 flex gap-2">
          <button 
            onClick={() => onAddNode(NodeType.PROCESS_STEP)} 
            className="flex items-center gap-2 text-xs font-bold text-slate-700 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-blue-400 rounded-md transition-all shadow-sm"
          >
            <span className="text-lg leading-none text-blue-500">+</span> Add Process Step
          </button>
        </Panel>
      </ReactFlow>

      {/* Edge Edit Modal */}
      {editingEdge && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-2xl border border-slate-200 z-50 w-72">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Edit Connection</h3>
          <div className="mb-4">
            <label className="block text-xs text-slate-500 mb-1">Label (optional)</label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="e.g., Yes, No, If Valid"
                value={edgeLabelInput}
                onChange={(e) => setEdgeLabelInput(e.target.value)}
                className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-between gap-2">
             <button onClick={deleteEdge} className="flex-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded">
               Delete
             </button>
             <button onClick={() => setEditingEdge(null)} className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded">
               Cancel
             </button>
             <button onClick={saveEdgeEdit} className="flex-1 px-3 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded">
               Save
             </button>
          </div>
        </div>
      )}
      {editingEdge && <div className="absolute inset-0 bg-black/20 z-40" onClick={() => setEditingEdge(null)}></div>}
    </div>
  );
};

const BowTieGraphWrapper: React.FC<ProcessGraphProps> = (props) => (
  <ReactFlowProvider>
    <ProcessGraphContent {...props} />
  </ReactFlowProvider>
);

export default BowTieGraphWrapper;