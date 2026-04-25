import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Trash2, Plus, Edit2, Users, Network, MapPin, Calendar, X } from 'lucide-react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  BackgroundVariant,
  ReactFlowProvider,
  MarkerType,
  Handle,
  Position,
  NodeChange,
  EdgeChange,
  Connection,
  useReactFlow,
  useStore
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { useDataStore } from '@/store/useDataStore';

interface OrgNode {
  id: string;
  name: string;
  designation: string;
  phone: string | null;
  email: string | null;
  branch: string | null;
  dob: string | null;
  doj: string | null;
  parent_id: string | null;
  gender: string | null;
  box_color: string | null;
}

const PREDEFINED_ROLES = [
  'Managing Director',
  'Management Executive',
  'Finance Manager',
  'Operation Manager',
  'Area Manager',
  'Business Dev Manager',
  'Consultant Manager',
  'Branch Manager',
  'Relationship Manager',
  'Service Relationship Manager',
  'Cashier',
  'Consultant'
];

const COLOR_OPTIONS = [
  { label: 'Default', value: '', circle: 'bg-slate-200 dark:bg-slate-700' },
  { label: 'Rose', value: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800', circle: 'bg-rose-400' },
  { label: 'Sky', value: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800', circle: 'bg-sky-400' },
  { label: 'Emerald', value: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', circle: 'bg-emerald-400' },
  { label: 'Purple', value: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800', circle: 'bg-purple-400' },
  { label: 'Amber', value: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', circle: 'bg-amber-400' },
];

const EmployeeNode = ({ data }: any) => {
  const bgClass = data.nodeData?.box_color || 'bg-white dark:bg-slate-900';

  return (
    <div 
      onClick={() => data.onView && data.onView(data.nodeData)}
      className={`relative group ${bgClass} border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 w-[320px] shadow-sm hover:shadow-md dark:hover:shadow-lg hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col items-center text-center`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <div className="mb-4 border-b border-slate-200 dark:border-slate-700/50 pb-3 w-full">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">{data.name}</h3>
        <p className="text-sm font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400 mt-1">{data.designation}</p>
      </div>

      <div className="space-y-2.5 w-full flex flex-col items-center">
        {data.branch && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{data.branch}</span>
          </div>
        )}
        {data.dob && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>DOB: {new Date(data.dob).toLocaleDateString()}</span>
          </div>
        )}
        {data.doj && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>DOJ: {new Date(data.doj).toLocaleDateString()}</span>
          </div>
        )}
        {(!data.branch && !data.dob && !data.doj) && (
          <div className="text-xs text-slate-400 dark:text-slate-500 italic">No additional details</div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

const nodeTypes = {
  employee: EmployeeNode,
};

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const nodeWidth = 320;
  const nodeHeight = 150;
  
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, edgesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    let x = 0;
    let y = 0;
    if (nodeWithPosition && nodeWithPosition.x !== undefined && nodeWithPosition.y !== undefined) {
      x = nodeWithPosition.x - nodeWidth / 2;
      y = nodeWithPosition.y - nodeHeight / 2;
    }
    
    return {
      ...node,
      targetPosition: 'top',
      sourcePosition: 'bottom',
      position: { x, y },
      style: { opacity: 1 }
    };
  });

  return { nodes: newNodes, edges };
};

function OrganigramChart() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingNodeData, setViewingNodeData] = useState<OrgNode | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', designation: '', phone: '', email: '', branch: '', dob: '', doj: '', gender: '', box_color: ''
  });

  const { user } = useAuthStore();
  const { branches } = useDataStore();
  const isAdmin = user?.role === 'admin' || user?.email === 'tomas@siroiforex.com' || user?.email === 'surchanddsingh@siroiforex.com';
  
  const { setCenter } = useReactFlow();

  const fetchHierarchy = useCallback(async () => {
    console.log("fetchHierarchy started...");
    setLoading(true);
    const { data, error } = await supabase.from('org_nodes').select('*');
    console.log("fetchHierarchy data received:", data?.length, "error:", error);
    if (!error && data) {
      // Calculate tiers by mapping depths
      const tierMap = new Map<string, number>();
      
      const calculateTier = (id: string, currentTier: number) => {
        tierMap.set(id, currentTier);
        const children = data.filter(n => n.parent_id === id);
        children.forEach(child => calculateTier(child.id, currentTier + 1));
      };

      // Find roots
      const roots = data.filter(n => !n.parent_id);
      roots.forEach(r => calculateTier(r.id, 0));

      const flowNodes = data.map((n) => ({
        id: n.id,
        type: 'employee',
        data: {
          id: n.id,
          parentId: n.parent_id,
          name: n.name,
          designation: n.designation,
          branch: n.branch,
          tier: tierMap.get(n.id) || 0,
          isAdmin,
          nodeData: n,
          onView: setViewingNodeData
        },
        position: { x: 0, y: 0 }, // Will be set by dagre
      }));

      const flowEdges = data
        .filter(n => n.parent_id)
        .map(n => ({
          id: `e-${n.parent_id}-${n.id}`,
          source: n.parent_id as string,
          target: n.id,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#818cf8', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' }
        }));

      try {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

        const rootNode = layoutedNodes.find(n => !n.data.parentId);
        if (rootNode) {
          setTimeout(() => {
            setCenter(rootNode.position.x + 160, rootNode.position.y + 150, { zoom: 0.9, duration: 800 });
          }, 100);
        }
      } catch (err) {
        console.error("Dagre layout error:", err);
        setNodes(flowNodes); // Fallback to raw nodes
        setEdges(flowEdges);
      }
    } else {
      console.error("Supabase error fetching nodes:", error);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  const handleAddChild = (parentId: string) => {
    setSelectedParentId(parentId);
    setEditingNodeId(null);
    setFormData({ name: '', designation: '', phone: '', email: '', branch: '', dob: '', doj: '', gender: '', box_color: '' });
    setIsFormOpen(true);
  };

  const handleAddPeer = (parentId: string | null) => {
    setSelectedParentId(parentId);
    setEditingNodeId(null);
    setFormData({ name: '', designation: '', phone: '', email: '', branch: '', dob: '', doj: '', gender: '', box_color: '' });
    setIsFormOpen(true);
  };

  const handleEdit = (nodeData: OrgNode) => {
    setSelectedParentId(nodeData.parent_id);
    setEditingNodeId(nodeData.id);
    setFormData({
      name: nodeData.name || '',
      designation: nodeData.designation || '',
      phone: nodeData.phone || '',
      email: nodeData.email || '',
      branch: nodeData.branch || '',
      dob: nodeData.dob || '',
      doj: nodeData.doj || '',
      gender: nodeData.gender || '',
      box_color: nodeData.box_color || ''
    });
    setIsFormOpen(true);
  };

  const handleDeleteNode = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this employee? Reporting lines below them will be orphaned.')) return;

    // Orphan children to avoid foreign key constraints
    await supabase.from('org_nodes').update({ parent_id: null }).eq('parent_id', id);
    
    const { error } = await supabase.from('org_nodes').delete().eq('id', id);
    if (!error) {
      fetchHierarchy();
    } else {
      alert('Failed to delete: ' + error.message);
    }
  };

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Drag and Drop Reparenting via edge connection
  const onConnect = useCallback(
    async (params: Connection) => {
      if (!isAdmin) return;
      if (params.source === params.target) return;

      // Update the target node's parent_id in Supabase
      const { error } = await supabase.from('org_nodes').update({ parent_id: params.source }).eq('id', params.target);
      if (!error) {
        fetchHierarchy(); // Re-fetch to apply new layout and edges
      } else {
        alert("Failed to update reporting structure: " + error.message);
      }
    },
    [fetchHierarchy, isAdmin]
  );

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.designation) return;

    if (formData.email && formData.email.trim() !== '' && !formData.email.endsWith('@siroiforex.com')) {
      alert('Email must belong to @siroiforex.com domain');
      return;
    }

    const payload = {
      name: formData.name,
      designation: formData.designation,
      phone: formData.phone || null,
      email: formData.email || null,
      branch: formData.branch || null,
      dob: formData.dob || null,
      doj: formData.doj || null,
      gender: formData.gender || null,
      box_color: formData.box_color || null,
      parent_id: selectedParentId
    };

    if (editingNodeId) {
      const { error } = await supabase.from('org_nodes').update(payload).eq('id', editingNodeId);
      if (error) alert('Error updating: ' + error.message);
      else {
        setIsFormOpen(false);
        fetchHierarchy();
      }
    } else {
      const { error } = await supabase.from('org_nodes').insert(payload);
      if (error) alert('Error adding: ' + error.message);
      else {
        setIsFormOpen(false);
        fetchHierarchy();
      }
    }
  };

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Organization Structure</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Drag a node's output handle (bottom) to another node's input handle (top) to change reporting lines. Hover to edit.
          </p>
        </div>
        <button 
          onClick={() => handleAddPeer(null)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="w-full h-[calc(100vh-150px)] min-h-[600px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 z-10">Loading hierarchy...</div>
        ) : (
          <ReactFlow
            style={{ width: '100%', height: '800px' }}
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            className="bg-slate-50 dark:bg-slate-950"
            minZoom={0.1}
          >
            <Background color="#94a3b8" className="dark:!opacity-50" variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 fill-slate-700 dark:fill-white" />
          </ReactFlow>
        )}
      </div>

      {/* CRUD Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{editingNodeId ? 'Edit Employee' : 'Add New Employee'}</h3>
            </div>
            <form onSubmit={handleSaveForm} className="p-6 space-y-5">
              
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Full Name *</label>
                  <input required type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Reporting To (Manager)</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" value={selectedParentId || ''} onChange={e => setSelectedParentId(e.target.value || null)}>
                    <option value="">-- No Manager (Board / Top Level) --</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.data.name} ({n.data.designation})</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Position / Role *</label>
                  <input required list="roles" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} placeholder="Select or type..." />
                  <datalist id="roles">
                    {PREDEFINED_ROLES.map(r => <option key={r} value={r} />)}
                  </datalist>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Branch Location</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})}>
                    <option value="">Select Branch</option>
                    {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Gender</label>
                  <select className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="">Select Gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non Binary">Non Binary</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Phone Number</label>
                  <input type="tel" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91..." />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Email ID</label>
                  <input type="email" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="name@siroiforex.com" />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Date of Joining</label>
                  <input type="date" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" value={formData.doj} onChange={e => setFormData({...formData, doj: e.target.value})} />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Birthday (DOB)</label>
                  <input type="date" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Box Theme (Location Color)</label>
                  <div className="flex items-center gap-3">
                    {COLOR_OPTIONS.map(opt => (
                      <button
                        key={opt.label}
                        type="button"
                        title={opt.label}
                        onClick={() => setFormData({...formData, box_color: opt.value})}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.box_color === opt.value 
                            ? 'border-indigo-600 scale-110 shadow-md dark:border-indigo-400' 
                            : 'border-transparent hover:scale-105'
                        } ${opt.circle}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-lg shadow-indigo-600/20">
                  {editingNodeId ? 'Save Changes' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {viewingNodeData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            
            <div className={`relative p-8 border-b border-slate-100 dark:border-slate-800 ${viewingNodeData.box_color || 'bg-slate-50 dark:bg-slate-800/50'}`}>
              <button 
                onClick={() => setViewingNodeData(null)}
                className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <h3 className="font-bold text-3xl text-slate-900 dark:text-white mb-2">{viewingNodeData.name}</h3>
              <p className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">{viewingNodeData.designation}</p>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Location / Branch</p>
                  <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-500" /> {viewingNodeData.branch || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</p>
                  <p className="text-slate-900 dark:text-white font-medium">{viewingNodeData.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</p>
                  <p className="text-slate-900 dark:text-white font-medium">{viewingNodeData.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gender</p>
                  <p className="text-slate-900 dark:text-white font-medium">{viewingNodeData.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date of Birth</p>
                  <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" /> {viewingNodeData.dob ? new Date(viewingNodeData.dob).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date of Joining</p>
                  <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" /> {viewingNodeData.doj ? new Date(viewingNodeData.doj).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-4 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              {isAdmin ? (
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const id = viewingNodeData.id;
                      setViewingNodeData(null);
                      setTimeout(() => handleDeleteNode(id), 100);
                    }} 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Profile
                  </button>
                  <button 
                    onClick={() => {
                      const id = viewingNodeData.id;
                      setViewingNodeData(null);
                      setTimeout(() => handleAddChild(id), 100);
                    }} 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Direct Report
                  </button>
                </div>
              ) : <div/>}
              
              {isAdmin && (
                <button 
                  onClick={() => {
                    const node = viewingNodeData;
                    setViewingNodeData(null);
                    setTimeout(() => handleEdit(node), 100);
                  }} 
                  className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
                >
                  <Edit2 className="w-4 h-4" /> Edit Details
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default function OrganigramPageWrapper() {
  return (
    <ReactFlowProvider>
      <OrganigramChart />
    </ReactFlowProvider>
  );
}
