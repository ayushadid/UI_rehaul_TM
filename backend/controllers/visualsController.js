const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

/**
 * @desc    Get the data for the "Project Work Map"
 * @route   GET /api/projects/:id/work-map
 * @query   ?view=responsibility (default) OR ?view=dependency
 * @access  Private
 */
exports.getProjectWorkMap = async (req, res) => {
    try {
        const { id: projectId } = req.params;
        // 👇 --- NEW: Read the 'view' query parameter ---
        const { view = 'responsibility' } = req.query; // Default to 'responsibility' view

        const project = await Project.findById(projectId)
            .populate('owner', 'name profileImageUrl')
            .lean();

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const nodes = [];
        const edges = [];
        const userMap = new Map();

        const owner = project.owner;
        userMap.set(owner._id.toString(), owner);
        nodes.push({
            id: `user-${owner._id.toString()}`,
            type: 'user',
            data: { user: owner, isOwner: true },
            position: { x: 400, y: 50 }
        });

        // 👇 --- MODIFIED: Added 'dependencies' to the .select() ---
        const tasks = await Task.find({ project: project._id })
            .select('assignedTo reviewers createdBy status title dueDate dependencies') // Added 'dependencies'
            .populate('assignedTo', 'name profileImageUrl')
            .populate('reviewers', 'name profileImageUrl')
            .populate('createdBy', 'name profileImageUrl')
            .lean();

        for (const task of tasks) {
            const taskIdStr = task._id.toString();
            
            nodes.push({
                id: `task-${taskIdStr}`,
                type: 'task',
                data: { 
                    title: task.title, 
                    status: task.status, 
                    dueDate: task.dueDate 
                },
                position: { x: 0, y: 0 }
            });

            // 👇 --- NEW: Conditional Edge Logic ---
            if (view === 'dependency') {
                // --- DEPENDENCY VIEW LOGIC ---

                // 1. Add edges for dependencies
                if (task.dependencies && task.dependencies.length > 0) {
                    for (const depId of task.dependencies) {
                        edges.push({
                            id: `e-dep-${depId.toString()}-to-${taskIdStr}`,
                            source: `task-${depId.toString()}`, // The task it depends on
                            target: `task-${taskIdStr}`,      // The current task
                            label: 'blocks',
                            type: 'smoothstep',
                            animated: true,
                            className: 'react-flow-edge-dependency' // Red "blocker" edge
                        });
                    }
                }

                // 2. Add faint "assigned" edges so tasks aren't floating
                for (const assignee of (task.assignedTo || [])) {
                    const assigneeId = assignee._id.toString();
                    if (!userMap.has(assigneeId)) {
                        userMap.set(assigneeId, assignee);
                        nodes.push({
                            id: `user-${assigneeId}`,
                            type: 'user',
                            data: { user: assignee, isOwner: false },
                            position: { x: 0, y: 0 }
                        });
                    }
                    edges.push({
                        id: `e-assign-${assigneeId}-to-${taskIdStr}`,
                        source: `user-${assigneeId}`,
                        target: `task-${taskIdStr}`,
                        className: 'react-flow-edge-faint' // Faint dashed line
                    });
                }

            } else {
                // --- RESPONSIBILITY VIEW LOGIC (your existing logic) ---

                // 4b. Process "DO-ERS" (Assignees)
                for (const assignee of (task.assignedTo || [])) {
                    const assigneeId = assignee._id.toString();
                    if (!userMap.has(assigneeId)) {
                        userMap.set(assigneeId, assignee);
                        nodes.push({
                            id: `user-${assigneeId}`,
                            type: 'user',
                            data: { user: assignee, isOwner: false },
                            position: { x: 0, y: 0 }
                        });
                    }
                    edges.push({
                        id: `e-assign-${assigneeId}-to-${taskIdStr}`,
                        source: `user-${assigneeId}`,
                        target: `task-${taskIdStr}`,
                        label: 'assigned'
                    });
                }

                // 4c. Process "REVIEWERS"
                for (const reviewer of (task.reviewers || [])) {
                    const reviewerId = reviewer._id.toString();
                    if (!userMap.has(reviewerId)) {
                        userMap.set(reviewerId, reviewer);
                        nodes.push({
                            id: `user-${reviewerId}`,
                            type: 'user',
                            data: { user: reviewer, isOwner: false },
                            position: { x: 0, y: 0 }
                        });
                    }
                    edges.push({
                        id: `e-review-${taskIdStr}-by-${reviewerId}`,
                        source: `task-${taskIdStr}`,
                        target: `user-${reviewerId}`,
                        label: 'reviews',
                        animated: true,
                        className: 'react-flow-edge-review'
                    });
                }
                
                // 4d. Process "APPROVER" (Creator)
                const creator = task.createdBy;
                if (creator) {
                    const creatorId = creator._id.toString();
                    if (!userMap.has(creatorId)) {
                        userMap.set(creatorId, creator);
                        nodes.push({
                            id: `user-${creatorId}`,
                            type: 'user',
                            data: { user: creator, isOwner: (creatorId === owner._id.toString()) },
                            position: { x: 0, y: 0 }
                        });
                    }
                    
                    if (!(task.reviewers || []).some(r => r._id.toString() === creatorId)) {
                        edges.push({
                            id: `e-approve-${taskIdStr}-by-${creatorId}`,
                            source: `task-${taskIdStr}`,
                            target: `user-${creatorId}`,
                            label: 'approves',
                            animated: true,
                            className: 'react-flow-edge-approve'
                        });
                    }
                }
            } // --- End of if/else view logic ---
        }
        
        // 5. Link all non-owner users to the owner (Structural lines)
        // We do this in *both* views to maintain hierarchy
        for (const userId of userMap.keys()) {
            if (userId !== owner._id.toString()) {
                edges.push({
                    id: `e-owner-to-${userId}`,
                    source: `user-${owner._id.toString()}`,
                    target: `user-${userId}`,
                    type: 'smoothstep',
                    className: 'react-flow-edge-owner'
                });
            }
        }

        res.json({ 
            project: { name: project.name, _id: project._id }, 
            nodes, 
            edges 
        });

    } catch (error) {
        console.error("Error creating work map:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};