const { GoogleGenerativeAI } = require("@google/generative-ai");
const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

const parseAndCreateTask = async (req, res) => {
    const { text } = req.body;

    if (!text || text.trim() === '') {
        return res.status(400).json({ message: "Input text is required." });
    }

    try {
        const allUsers = await User.find({}, 'name');
        const allProjects = await Project.find({}, 'name');
        const userNames = allUsers.map(u => u.name).join(", ");
        const projectNames = allProjects.map(p => p.name).join(", ");

        const prompt = `
            You are an intelligent task parsing assistant for a project management app.
            Your job is to analyze the following text and extract the details needed to create a task.

            Here is the required context you MUST use:
            - Today's date is: ${new Date().toLocaleDateString('en-CA')} (Format: YYYY-MM-DD)
            - The user making this request is named "${req.user.name}". When the input text says "myself", "me", or "I", you MUST use this name as the assigned user.
            - The ONLY available users are: ${userNames}
            - The ONLY available projects are: ${projectNames}

            From the user's input text below, extract the following information:
            1. "title": A concise title for the task.
            2. "assignedUserName": First, find the person's name mentioned in the text. Then, find the closest and most logical name from the "available users" list provided above. The final value MUST be an exact match from that list.
            3. "projectName": The name of the project this task belongs to. It MUST be an exact match from the available projects list. If no project is mentioned, return null.
            4. "dueDate": The due date for the task in YYYY-MM-DD format. If no due date is mentioned, return null.
            5. "checklist": An array of strings for a to-do list of sub-tasks based on the task title. If no sub-tasks are clearly implied, return an empty array [].
            6. "priority": The priority of the task. It MUST be one of these values: "Low", "Medium", "High". If not mentioned, default to "Medium".

            User's Input Text: "${text}"

            Your response MUST be a single, minified JSON object. Do not add any other text or markdown formatting.
            The JSON object must only contain these six keys: "title", "assignedUserName", "projectName", "dueDate", "checklist", "priority".
            If a value cannot be found, it should be null (except for checklist and priority).
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResponseText = response.text();
        
        const parsedDetails = JSON.parse(aiResponseText);

        let project;
        if (parsedDetails.projectName) {
            project = allProjects.find(p => p.name.toLowerCase() === parsedDetails.projectName.toLowerCase());
            if (!project) {
                return res.status(400).json({ message: `Could not find the project "${parsedDetails.projectName}".` });
            }
        } else {
            project = allProjects.find(p => p.name.toLowerCase() === "miscellaneous");
            if (!project) {
                return res.status(500).json({ message: "Default project 'Miscellaneous' could not be found." });
            }
        }

        const assignedUser = allUsers.find(u => u.name === parsedDetails.assignedUserName);

        if (!assignedUser || !parsedDetails.title) {
             return res.status(400).json({ message: "Could not determine the title or user from the text." });
        }

        let todoChecklistItems = [];
        if (parsedDetails.checklist && parsedDetails.checklist.length > 0) {
            todoChecklistItems = parsedDetails.checklist.map(itemText => ({
                text: itemText,
                completed: false
            }));
        } else {
            todoChecklistItems = [{ text: 'Done', completed: false }];
        }

        const newTask = new Task({
            title: parsedDetails.title,
            assignedTo: [assignedUser._id],
            project: project._id,
            dueDate: parsedDetails.dueDate ? new Date(parsedDetails.dueDate) : new Date(),
            todoChecklist: todoChecklistItems,
            status: 'Pending',
            priority: parsedDetails.priority || 'Medium',
            createdBy: req.user._id,
        });

        await newTask.save();
        
        const populatedTask = await Task.findById(newTask._id)
            .populate('assignedTo', 'name email')
            .populate('project', 'name');

        res.status(201).json({ 
            message: "Task created successfully with AI!",
            task: populatedTask 
        });

    } catch (error) {
        console.error("AI Task Creation Error:", error);
        res.status(500).json({ message: "Failed to create task using AI.", error: error.message });
    }
};

module.exports = { parseAndCreateTask };