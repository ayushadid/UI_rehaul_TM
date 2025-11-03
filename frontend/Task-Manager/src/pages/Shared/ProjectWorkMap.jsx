import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import { UserContext } from '../../context/userContext'; 

import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider, 
  useReactFlow,      
} from 'reactflow';
import 'reactflow/dist/style.css'; 

import dagre from 'dagre'; 
import UserNode from '../../components/nodes/UserNode';
import TaskNode from '../../components/nodes/TaskNode';
import TaskCreatorNode from '../../components/nodes/TaskCreatorNode'; 
import ConnectionModal from '../../components/ConnectionModal'; 
import moment from 'moment'; 

// --- Auto-layout Function ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 260;
const nodeHeight = 80;

const getLayoutedElements = (nodes, edges) => {
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 20, ranksep: 80 }); 

  nodes.forEach((node) => {
    // 👇 FIX #1: Guard against undefined nodes during race conditions
    if (node && node.id) {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    }
  });

  edges.forEach((edge) => {
    // 👇 FIX #1: Guard against undefined edges
    if (edge && edge.source && edge.target) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
     // 👇 FIX #1: Guard again
    if (node && node.id) {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.targetPosition = 'top';
      node.sourcePosition = 'bottom';

      node.position = {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      };
    }
    return node;
  });

  return { nodes, edges };
};

// --- Inner Component for React Flow Instance ---
const FlowInstance = ({ nodes, edges, onNodesChange, onEdgesChange, onNodeClick, nodeTypes, onPaneContextMenu, onPaneClick, onConnect, onEdgesDelete, onEdgeUpdate, canEditGraph }) => {
  const { fitView, screenToFlowPosition, getNode } = useReactFlow();

  useEffect(() => {
    // Only fit view if there are nodes to fit
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.1, duration: 200 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [nodes, edges, fitView]);

  const handleContextMenu = (event) => {
    if (onPaneContextMenu) {
        event.preventDefault();
        const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        
        onPaneContextMenu({
            x: event.clientX,
            y: event.clientY,
            flowPosition: flowPosition 
        });
    }
  };
  
  const handleOnConnect = (params) => {
    if (!canEditGraph) return;

    const sourceNode = getNode(params.source);
    const targetNode = getNode(params.target);
    if (!sourceNode || !targetNode || sourceNode.type === targetNode.type) {
        toast.error("Invalid connection.");
        return;
    }
    
    onConnect(params);
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      proOptions={{ hideAttribution: true }}
      onPaneContextMenu={handleContextMenu}
      onPaneClick={onPaneClick}
      onConnect={handleOnConnect}
      onEdgesDelete={onEdgesDelete}
      onEdgeUpdate={onEdgeUpdate}
      edgesFocusable={canEditGraph}
      nodesConnectable={canEditGraph}
      nodesDraggable={canEditGraph}
    >
      <Controls />
      <Background variant="dots" gap={12} size={1} />
    </ReactFlow>
  );
};


// --- Main Page Component ---
const ProjectWorkMap = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useContext(UserContext);

    // Graph state
    const [projectName, setProjectName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [mapData, setMapData] = useState(null);
    const [apiNodes, setApiNodes] = useState([]); 
    const [apiEdges, setApiEdges] = useState([]); 
    const [layoutedNodes, setLayoutedNodes] = useState([]); 
    const [layoutedEdges, setLayoutedEdges] = useState([]); 
    
    // Toggle state
    const [viewMode, setViewMode] = useState('responsibility'); 
    const [timeFilter, setTimeFilter] = useState('all'); 
    const [customDateRange, setCustomDateRange] = useState({
      start: moment().format('YYYY-MM-DD'),
      end: moment().add(7, 'days').format('YYYY-MM-DD'),
    });

    // Interactivity state
    const [menu, setMenu] = useState(null);
    const [connectionModal, setConnectionModal] = useState({ isOpen: false, params: null });
    const reactFlowWrapper = useRef(null); 
    
    const nodeTypes = useMemo(() => ({
        user: UserNode,
        task: TaskNode,
        taskCreator: TaskCreatorNode, 
    }), []);

    // React Flow handlers
    const onNodesChange = useCallback(
        (changes) => setLayoutedNodes((nds) => applyNodeChanges(changes, nds)),
        [setLayoutedNodes]
    );
    const onEdgesChange = useCallback(
        (changes) => setLayoutedEdges((eds) => applyEdgeChanges(changes, eds)),
        [setLayoutedEdges]
    );
    
    // --- Permission Check ---
    const canEditGraph = useMemo(() => {
      if (!currentUser || !mapData) return false;
      return currentUser.role === 'admin' || currentUser._id === mapData.owner?._id;
    }, [currentUser, mapData]);

    // --- Data Fetching & Layouting ---
    const fetchMapData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get(API_PATHS.PROJECTS.GET_WORK_MAP(projectId), {
                params: { view: viewMode }
            });
            const { project, nodes: newNodes, edges: newEdges } = response.data;
            setProjectName(project.name);
            setApiNodes(newNodes || []); // 👈 FIX: Ensure we always set an array
            setApiEdges(newEdges || []); // 👈 FIX: Ensure we always set an array
            setMapData(response.data);
        } catch (error) {
            toast.error("Failed to load project map.");
            console.error("Error fetching map data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, viewMode]);

    useEffect(() => {
        fetchMapData();
    }, [fetchMapData]);

    useEffect(() => {
        // 👇 FIX #1: This guard is now safer to prevent race conditions
        if (isLoading || !apiNodes || apiNodes.length === 0) {
            setLayoutedNodes([]);
            setLayoutedEdges([]);
            return;
        }
        
        const getActiveTaskIds = () => {
            const now = moment().startOf('day');
            if (timeFilter === 'all') return null; 
            return apiNodes
                .filter(node => {
                    if (node.type !== 'task') return false;
                    const { dueDate, status } = node.data;
                    if (status === 'Completed') return false;
                    const due = moment(dueDate);
                    switch (timeFilter) {
                        case 'overdue': return due.isBefore(now);
                        case 'week': return due.isBetween(now, moment().endOf('week'), 'day', '[]');
                        case 'month': return due.isBetween(now, moment().endOf('month'), 'day', '[]');
                        case 'custom': return due.isBetween(moment(customDateRange.start), moment(customDateRange.end), 'day', '[]');
                        default: return false;
                    }
                })
                .map(node => node.id);
        };
        const activeTaskIds = getActiveTaskIds();

        const getActiveUserIds = (activeTaskIds) => {
            if (!activeTaskIds) return null; 
            const userIds = new Set();
            apiEdges.forEach(edge => {
                if (activeTaskIds.includes(edge.source) || activeTaskIds.includes(edge.target)) {
                    userIds.add(edge.source.startsWith('user-') ? edge.source : null);
                    userIds.add(edge.target.startsWith('user-') ? edge.target : null);
                }
            });
            return [...userIds].filter(Boolean);
        };
        const activeUserIds = getActiveUserIds(activeTaskIds);

        const filteredNodes = apiNodes.map(node => {
            let isHighlighted = true; 
            if (activeTaskIds) { 
                if (node.type === 'task') isHighlighted = activeTaskIds.includes(node.id);
                else isHighlighted = activeUserIds.includes(node.id);
            }
            return { ...node, data: { ...node.data, isHighlighted: isHighlighted } };
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(filteredNodes, apiEdges);
        
        setLayoutedNodes(layoutedNodes);
        setLayoutedEdges(layoutedEdges);

    }, [apiNodes, apiEdges, timeFilter, customDateRange, isLoading]);

    const onNodeClick = (event, node) => {
        if (node.type === 'task') {
            const taskId = node.id.replace('task-', '');
            const path = currentUser.role === 'admin' ? '/admin/create-task' : `/user/task-details/${taskId}`;
            navigate(path, { state: { taskId: taskId } });
        }
    };
    
    const getButtonClass = (isActive) => {
        return `px-3 py-1.5 text-sm font-semibold rounded-md ${isActive ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`;
    };

    // --- Interactivity Handlers (for Admin/Owner) ---

    const handlePaneContextMenu = useCallback((menuData) => {
        if (!canEditGraph) return; 
        setMenu(menuData); 
    }, [canEditGraph]);

    const handleCreateTaskNode = () => {
        if (!menu) return;
        const newNode = {
            id: 'temp-task',
            type: 'taskCreator',
            position: menu.flowPosition,
            data: { onCreate: onTaskCreateSubmit }
        };
        setLayoutedNodes((nds) => [...nds, newNode]);
        setMenu(null);
    };
    
    const onTaskCreateSubmit = async (title) => {
        if (!title) {
            setLayoutedNodes((nds) => nds.filter((n) => n.id !== 'temp-task'));
            return;
        }
        setIsLoading(true);
        try {
            await axiosInstance.post(API_PATHS.TASKS.CREATE_TASK, {
                title: title,
                project: projectId,
                dueDate: moment().add(7, 'days').toISOString(),
                assignedTo: [],
                reviewers: [],
            });
            toast.success(`Task "${title}" created!`);
            await fetchMapData(); 
        } catch (error) {
            toast.error("Failed to create task.");
            setLayoutedNodes((nds) => nds.filter((n) => n.id !== 'temp-task'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePaneClick = () => {
        setMenu(null);
        setLayoutedNodes((nds) => nds.filter((n) => n.id !== 'temp-task'));
    };

    // --- Task Connection (Your Modal Idea) ---
    const onConnect = (params) => {
        setConnectionModal({ isOpen: true, params });
    };

    const handleConnectionModalClose = () => {
        setConnectionModal({ isOpen: false, params: null });
    };

    const handleConnectionModalSelect = async (role) => {
        const { params } = connectionModal;
        if (!params) return;

        const sourceNode = layoutedNodes.find(n => n.id === params.source);
        const targetNode = layoutedNodes.find(n => n.id === params.target);
        const taskNode = sourceNode.type === 'task' ? sourceNode : targetNode;
        const userNode = sourceNode.type === 'user' ? sourceNode : targetNode;

        const taskId = taskNode.id.replace('task-', '');
        const userId = userNode.id.replace('user-', '');

        const currentTask = apiNodes.find(n => n.id === taskNode.id);
        if (!currentTask) {
            toast.error("Could not find task data.");
            return;
        }

        let payload = {};
        if (role === 'assign') {
            const currentAssignees = apiEdges
                .filter(e => e.target === taskNode.id && e.label === 'assigned')
                .map(e => e.source.replace('user-', ''));
            payload.assignedTo = [...new Set([...currentAssignees, userId])];
        } else if (role === 'review') {
             const currentReviewers = apiEdges
                .filter(e => e.source === taskNode.id && e.label === 'reviews')
                .map(e => e.target.replace('user-', ''));
            payload.reviewers = [...new Set([...currentReviewers, userId])];
        }

        setIsLoading(true);
        handleConnectionModalClose();
        try {
            await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK(taskId), payload);
            toast.success(`User added as ${role === 'assign' ? 'Assignee' : 'Reviewer'}.`);
            await fetchMapData(); 
        } catch (error) {
            toast.error("Failed to update task.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Task Re-Connection (Your "Blender" Idea) ---
    const onEdgeUpdate = async (oldEdge, newConnection) => {
        if (!canEditGraph) return;
        setIsLoading(true);
        
        const sourceNode = layoutedNodes.find(n => n.id === newConnection.source);
        const targetNode = layoutedNodes.find(n => n.id === newConnection.target);

        if (!sourceNode || !targetNode || sourceNode.type === targetNode.type) {
            toast.error("Invalid connection.");
            setIsLoading(false);
            return;
        }

        const taskNode = sourceNode.type === 'task' ? sourceNode : targetNode;
        const newUserNode = sourceNode.type === 'user' ? sourceNode : targetNode;

        const taskId = taskNode.id.replace('task-', '');
        const newUserId = newUserNode.id.replace('user-', '');
        const oldUserId = (oldEdge.source === taskNode.id ? oldEdge.target : oldEdge.source).replace('user-', '');

        const currentTask = apiNodes.find(n => n.id === taskNode.id);
        if (!currentTask) return;

        let payload = {};
        if (oldEdge.label === 'assigned') {
            const currentAssignees = apiEdges
                .filter(e => e.target === taskNode.id && e.label === 'assigned')
                .map(e => e.source.replace('user-', ''));
            const newAssignees = currentAssignees.filter(id => id !== oldUserId); 
            payload.assignedTo = [...new Set([...newAssignees, newUserId])]; 
        } else if (oldEdge.label === 'reviews') {
            const currentReviewers = apiEdges
                .filter(e => e.source === taskNode.id && e.label === 'reviews')
                .map(e => e.target.replace('user-', ''));
            const newReviewers = currentReviewers.filter(id => id !== oldUserId); 
            payload.reviewers = [...new Set([...newReviewers, newUserId])]; 
        } else {
             setIsLoading(false);
             return;
        }
        
        try {
            await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK(taskId), payload);
            toast.success(`Connection updated.`);
            await fetchMapData(); 
        } catch (error) {
            toast.error("Failed to update connection.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Edge Deletion ---
    const onEdgesDelete = async (edgesToDelete) => {
        if (!canEditGraph) return;
        
        const edge = edgesToDelete[0]; 
        
        const sourceNode = layoutedNodes.find(n => n.id === edge.source);
        const targetNode = layoutedNodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return;

        const taskNode = sourceNode.type === 'task' ? sourceNode : targetNode;
        const userNode = sourceNode.type === 'user' ? sourceNode : targetNode;
        const taskId = taskNode.id.replace('task-', '');
        const userId = userNode.id.replace('user-', '');
        
        const currentTask = apiNodes.find(n => n.id === taskNode.id);
        if (!currentTask) return;
        
        let payload = {};
        if (edge.label === 'assigned') {
            const currentAssignees = apiEdges
                .filter(e => e.target === taskNode.id && e.label === 'assigned')
                .map(e => e.source.replace('user-', ''));
            payload.assignedTo = currentAssignees.filter(id => id !== userId); 
        } else if (edge.label === 'reviews') {
            const currentReviewers = apiEdges
                .filter(e => e.source === taskNode.id && e.label === 'reviews')
                .map(e => e.target.replace('user-', ''));
            payload.reviewers = currentReviewers.filter(id => id !== userId); 
        } else {
            toast.error("This connection cannot be deleted.");
            return; 
        }
        
        setIsLoading(true);
        try {
            await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK(taskId), payload);
            toast.success(`Connection removed.`);
            await fetchMapData(); 
        } catch (error) {
            toast.error("Failed to remove connection.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Main Render ---
    if (isLoading && layoutedNodes.length === 0) {
        return <div className="p-6 text-center text-slate-500">Building Project Map...</div>;
    }

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Work Map: <span className="text-primary">{projectName}</span>
                {isLoading && <span className="text-sm text-slate-500 ml-2"> (Updating...)</span>}
            </h2>

            {/* --- Filter Bar --- */}
            <div className="flex flex-wrap gap-6 mb-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                 <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">View Type</label>
                    <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
                        <button onClick={() => setViewMode('responsibility')} className={getButtonClass(viewMode === 'responsibility')}>
                            Responsibility
                        </button>
                        <button onClick={() => setViewMode('dependency')} className={getButtonClass(viewMode === 'dependency')}>
                            Dependency
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Time Heatmap</label>
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => setTimeFilter('all')} className={getButtonClass(timeFilter === 'all')}>All</button>
                        <button onClick={() => setTimeFilter('overdue')} className={getButtonClass(timeFilter === 'overdue')}>Overdue</button>
                        <button onClick={() => setTimeFilter('week')} className={getButtonClass(timeFilter === 'week')}>This Week</button>
                        <button onClick={() => setTimeFilter('month')} className={getButtonClass(timeFilter === 'month')}>This Month</button>
                        <button onClick={() => setTimeFilter('custom')} className={getButtonClass(timeFilter === 'custom')}>Custom</button>
                    </div>
                </div>

                {timeFilter === 'custom' && (
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Custom Range</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                className="form-input text-sm !mt-0"
                                value={customDateRange.start}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                            <span className="text-slate-500">to</span>
                            <input
                                type="date"
                                className="form-input text-sm !mt-0"
                                value={customDateRange.end}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* --- React Flow Canvas --- */}
            <div className="flex-1 w-full h-[75vh] border rounded-lg bg-slate-50 relative" ref={reactFlowWrapper}>
                <ReactFlowProvider>
                    <FlowInstance
                        nodes={layoutedNodes}
                        edges={layoutedEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        onPaneClick={handlePaneClick}
                        onPaneContextMenu={handlePaneContextMenu}
                        onConnect={onConnect}
                        onEdgesDelete={onEdgesDelete}
                        onEdgeUpdate={onEdgeUpdate}
                        canEditGraph={canEditGraph}
                    />
                </ReactFlowProvider>

                {/* --- Context Menu for Creating Tasks --- */}
                {menu && (
                    <div
                        style={{ top: menu.y, left: menu.x }}
                        className="absolute z-50 bg-white shadow-lg rounded-md border border-slate-200"
                        onClick={() => setMenu(null)} 
                    >
                        <button
                            onClick={handleCreateTaskNode}
                            className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                            [+] Create New Task
                        </button>
                    </div>
                )}
            </div>
            
            {/* --- Connection Modal --- */}
            {connectionModal.isOpen && (
                <ConnectionModal
                    isOpen={connectionModal.isOpen}
                    onCancel={handleConnectionModalClose}
                    onSelect={handleConnectionModalSelect}
                    taskNode={layoutedNodes.find(n => n.id === (connectionModal.params?.source.startsWith('task-') ? connectionModal.params?.source : connectionModal.params?.target))}                   
                    userNode={layoutedNodes.find(n => n.id === (connectionModal.params?.source.startsWith('user-') ? connectionModal.params?.source : connectionModal.params?.target))}
                />
            )}
        </div>
    );
};

export default ProjectWorkMap;