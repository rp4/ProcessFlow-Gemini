import React, { useState, memo, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { ProcessNodeData } from '../types';
import { Layout, X, Trash2 } from 'lucide-react';

interface ProcessNodeProps {
  id: string;
  data: ProcessNodeData;
}

// Use memo to prevent unnecessary re-renders in React Flow
const ProcessNode = memo(({ id, data }: ProcessNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit State
  const [tempTitle, setTempTitle] = useState(data.title);
  const [tempDesc, setTempDesc] = useState(data.description || '');

  // Sync local state with props when they change (e.g. AI updates node)
  useEffect(() => {
    setTempTitle(data.title);
    setTempDesc(data.description || '');
  }, [data.title, data.description]);

  const handleSave = () => {
    if (data.onEdit) {
      // Call the callback directly instead of dispatching an event
      data.onEdit(id, tempTitle, tempDesc);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    const event = new CustomEvent('node-delete', {
      detail: { id }
    });
    window.dispatchEvent(event);
    setIsEditing(false); 
  };

  return (
    <>
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-3 !h-3 !bg-slate-400 !-ml-1.5 hover:!bg-blue-500 transition-colors" 
      />

      <div className="relative group">
        {/* Popover for Editing */}
        {isEditing && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-4 animate-in fade-in zoom-in duration-200 cursor-default">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase">Edit Step</h4>
              <button onClick={() => setIsEditing(false)}><X className="w-4 h-4 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                <input 
                  type="text" 
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <textarea 
                  value={tempDesc}
                  onChange={(e) => setTempDesc(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-blue-500 min-h-[60px]"
                />
              </div>
              
              <div className="flex gap-2 pt-1">
                <button 
                  onClick={handleDelete}
                  className="flex-1 text-xs py-2 bg-red-50 text-red-600 border border-red-100 rounded hover:bg-red-100 flex items-center justify-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-[2] text-xs py-2 bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div 
          onDoubleClick={() => setIsEditing(true)}
          className={`
            bg-white border-l-4 border-l-blue-500 hover:border-blue-600
            relative w-52 p-3 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-2
            border-y border-r border-slate-200/80 select-none min-h-[60px]
          `}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium text-sm text-slate-800 leading-snug line-clamp-2">{data.title}</span>
            <Layout className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          
          {data.description && (
            <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed border-t border-slate-100 pt-1 mt-1">
              {data.description}
            </div>
          )}
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-3 !h-3 !bg-slate-400 !-mr-1.5 hover:!bg-blue-500 transition-colors" 
      />
    </>
  );
});

export default ProcessNode;