import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Tree, TreeNode } from 'react-organizational-chart';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { Trash2, Plus, Info, Calendar } from 'lucide-react';

interface OrgNode {
  id: string;
  name: string;
  designation: string;
  dob: string | null;
  doj: string | null;
  parent_id: string | null;
}

export default function OrganigramPage() {
  const [nodes, setNodes] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: '', designation: '', dob: '', doj: '' });
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('org_nodes').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setNodes(data);
    }
    setLoading(false);
  };

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.designation) return;

    const { error } = await supabase.from('org_nodes').insert({
      name: formData.name,
      designation: formData.designation,
      dob: formData.dob || null,
      doj: formData.doj || null,
      parent_id: selectedParentId
    });

    if (!error) {
      setIsFormOpen(false);
      setFormData({ name: '', designation: '', dob: '', doj: '' });
      fetchNodes();
    } else {
      alert('Failed to add node: ' + error.message);
    }
  };

  const handleDeleteNode = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this node? All child nodes will be deleted as well.')) return;

    const { error } = await supabase.from('org_nodes').delete().eq('id', id);
    if (!error) {
      fetchNodes();
    } else {
      alert('Failed to delete: ' + error.message);
    }
  };

  const handleDrop = async (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    
    // Prevent cycles: check if targetId is a descendant of draggedId
    let current = nodes.find(n => n.id === targetId);
    while (current && current.parent_id) {
      if (current.parent_id === draggedId) {
        alert("Cannot drop a node into its own descendant!");
        return;
      }
      current = nodes.find(n => n.id === current?.parent_id);
    }

    const { error } = await supabase.from('org_nodes').update({ parent_id: targetId }).eq('id', draggedId);
    if (!error) {
      fetchNodes();
    }
  };

  const treeData = useMemo(() => {
    const buildTree = (parentId: string | null): any[] => {
      return nodes
        .filter(n => n.parent_id === parentId)
        .map(n => ({ ...n, children: buildTree(n.id) }));
    };
    return buildTree(null);
  }, [nodes]);

  const NodeCard = ({ node }: { node: any }) => {
    const handleDragStart = (e: React.DragEvent) => {
      if (!isAdmin) return;
      e.dataTransfer.setData('nodeId', node.id);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
    };

    const handleDropEvent = (e: React.DragEvent) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('nodeId');
      if (draggedId) {
        handleDrop(draggedId, node.id);
      }
    };

    return (
      <div 
        className="inline-block"
        draggable={isAdmin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDropEvent}
      >
        <div 
          className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-shadow p-3 min-w-[160px] text-center cursor-pointer group"
          onClick={() => setSelectedNode(node)}
        >
          {isAdmin && (
            <div className="absolute -top-3 -right-3 hidden group-hover:flex gap-1 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 p-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedParentId(node.id); setIsFormOpen(true); }}
                className="p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full"
                title="Add Subordinate"
              >
                <Plus size={14} />
              </button>
              <button 
                onClick={(e) => handleDeleteNode(node.id, e)}
                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
          <div className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">{node.name}</div>
          <div className="text-[10px] font-semibold text-white bg-indigo-500 dark:bg-indigo-600 px-2 py-0.5 rounded-full inline-block mx-auto uppercase tracking-wide">
            {node.designation}
          </div>
        </div>
      </div>
    );
  };

  const renderTree = (nodesToRender: any[]) => {
    return nodesToRender.map(node => (
      <TreeNode key={node.id} label={<NodeCard node={node} />}>
        {node.children && node.children.length > 0 && renderTree(node.children)}
      </TreeNode>
    ));
  };

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Organization Structure</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Drag and drop nodes to change reporting lines. Click to view details.
          </p>
        </div>
        {treeData.length === 0 && (
          <button 
            onClick={() => { setSelectedParentId(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            <Plus size={16} /> Add Root Node
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-8 overflow-auto min-h-[600px] flex justify-center shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center text-slate-500">Loading hierarchy...</div>
        ) : treeData.length > 0 ? (
          <Tree
            lineWidth={'2px'}
            lineColor={'#94a3b8'}
            lineBorderRadius={'10px'}
            label={<NodeCard node={treeData[0]} />}
          >
            {treeData[0].children && renderTree(treeData[0].children)}
          </Tree>
        ) : (
          <div className="flex items-center justify-center text-slate-500 flex-col gap-3">
            <Network size={48} className="opacity-20" />
            <p>No organization structure found. Create a root node to begin.</p>
          </div>
        )}
      </div>

      {/* Add Node Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-semibold text-lg dark:text-white">Add New Employee</h3>
            </div>
            <form onSubmit={handleAddNode} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">Name</label>
                <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm dark:text-white outline-none focus:border-indigo-500 transition-colors" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">Designation</label>
                <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm dark:text-white outline-none focus:border-indigo-500 transition-colors" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} placeholder="e.g. Managing Director" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">Date of Birth</label>
                  <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm dark:text-white outline-none focus:border-indigo-500 transition-colors" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">Date of Joining</label>
                  <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm dark:text-white outline-none focus:border-indigo-500 transition-colors" value={formData.doj} onChange={e => setFormData({...formData, doj: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10 mt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedNode(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center border-b border-slate-200 dark:border-white/10 relative">
              <div className="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-3">
                <Info size={28} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white">{selectedNode.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{selectedNode.designation}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-white/5">
                <Calendar size={18} className="text-slate-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Date of Birth</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedNode.dob ? new Date(selectedNode.dob).toLocaleDateString() : 'Not Provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-white/5">
                <Calendar size={18} className="text-slate-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Date of Joining</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedNode.doj ? new Date(selectedNode.doj).toLocaleDateString() : 'Not Provided'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="w-full mt-2 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
