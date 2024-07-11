const express = require("express");
const router = express.Router();
const Project = require("../models/Project.js");
const User = require("../models/Schema.js");
const Domain = require("../models/Domain.js")
const { ObjectId } = require('mongodb'); 

router.post("/createProject", async (req, res) => {
  try {
    const { projectName, email, tmxUpload, sourceUpload, sourceLanguage, targetLanguage,assignedBy,domain,index } = req.body;
    if (!email) {
      return res.status(400).json({
        error: "Email is required",
        details: "User email is required to create a project",
      });
    }
    if (!projectName) {
      return res.status(400).json({
        error: "Project name is required",
      });
    }
    if (!sourceLanguage) {
      return res.status(400).json({
        error: "Source language is required",
      });
    }
    if (!targetLanguage || targetLanguage.length === 0) {
      return res.status(400).json({
        error: "At least one target language is required",
      });
    }
    if (!projectName) {
      return res.status(400).json({
        error: "Project name is required",
      });
    }

    if (!sourceLanguage) {
      return res.status(400).json({
        error: "Source language is required",
      });
    }
    if (!domain) {
      return res.status(400).json({
        error: "domain is required"
      });
    }
    
    if (!targetLanguage || targetLanguage.length === 0) {
      return res.status(400).json({
        error: "At least one target language is required",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        details: `User with email ${email} not found`,
      });
    }

    const newProject = new Project({
      projectName,
      assignedBy,
      userId: user._id,
      status: "init",
      sourceUpload: sourceUpload || [],
      tmxUpload: tmxUpload || [],
      sourceUpload: sourceUpload || [],
      tmxUpload: tmxUpload || [],
      sourceLanguage,
      targetLanguage,
      email,
      domain,
      index
    });

    const savedProject = await newProject.save();
    res.status(200).json(savedProject);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Error creating project",
      details: error.message,
    });
  }
});

router.get("/projects/domain", async (req, res) => {
  try {
    const domains = await Domain.find();
    console.log("Domains fetched:", domains);
    res.status(200).json({ domains });
  } catch (error) {
    console.error("Error fetching domains:", error);
    res.status(500).json({ error: "Failed to fetch domains" });
  }
});

module.exports = router;

router.get("/projects", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({
        error: "Email not provided",
        details: "User email is required to fetch projects",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        details: `User with email ${email} not found`,
      });
    }
    const projects = await Project.find({ userId: user._id });
    res.status(200).json(projects);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching projects", details: error.message });
  }
});

router.get("/projects/:id", async (req, res) => {
  try {
    const project = await Project.findById(res.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.status(200).json(project);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching Project", details: error.message });
  }
});

router.put("/projects/:id", async (req, res) => {
  try {
    const { projectName, userId, status, sourceUpload, tmxUpload } = req.body;
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { projectName, userId, status, sourceUpload, tmxUpload },
      { new: true, runValidators: true }
    );
    if (!updatedProject) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.status(200).json(updatedProject);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating project", details: error.message });
  }
});
router.put("/projects/:id/tasksUpdate", async (req, res) => {
  const projectId = req.params.id;
  const { tasks } = req.body;
  try {
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: "Tasks should be an array" });
    }
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    tasks.forEach((newTask) => {
      const existingTaskIndex = project.tasks.findIndex(
        (task) => task._id === newTask._id
      );
      if (existingTaskIndex !== -1) {
        // Update existing task
        project.tasks[existingTaskIndex] = {
          ...newTask,
          date: parseDate(newTask.date) // Convert 'date' string to Date object
        };
      } else {
        // Add new task
        project.tasks.push({
          ...newTask,
          date: parseDate(newTask.date) // Convert 'date' string to Date object
        });
      }
    });

    project.status = "In Progress";
    project.updatedAt = new Date().toISOString(); // Set updatedAt to current date and time in UTC
    
    const updatedProject = await project.save();
    res.status(200).json(updatedProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Function to parse date string into a Date object
function parseDate(dateString) {
  // Example: "2024-07-01 00:25:00 AM"
  const parts = dateString.split(' ');
  const datePart = parts[0]; // "2024-07-01"
  const timePart = parts[1]; // "00:25:00"
  const ampmPart = parts[2]; // "AM"

  // Extract hours, minutes, seconds
  const [hours, minutes, seconds] = timePart.split(':').map(part => parseInt(part, 10));

  // Adjust hours if PM
  let adjustedHours = hours;
  if (ampmPart === 'PM' && hours < 12) {
    adjustedHours += 12;
  }

  // Create Date object in UTC format
  const dateObject = new Date(`${datePart}T${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}Z`);

  return dateObject;
}
// router.put("/projects/:id/tasksUpdate", async (req, res) => {
//   const projectId = req.params.id;
//   const { tasks } = req.body;

//   try {
//     if (!Array.isArray(tasks)) {
//       return res.status(400).json({ error: "Tasks should be an array" });
//     }
    
//     const project = await Project.findById(projectId);
//     if (!project) {
//       return res.status(404).json({ error: "Project not found" });
//     }
    
//     tasks.forEach((newTask) => {
//       const existingTaskIndex = project.tasks.findIndex(
//         (task) => task._id === newTask._id
//       );
//       if (existingTaskIndex !== -1) {
//         project.tasks[existingTaskIndex] = newTask;
//       } else {
//         project.tasks.push({ ...newTask, index: project.tasks.length });
//       }
//     });
    
//     project.status = "In Progress";

//     // Set updatedAt to current date and time in UTC
//     const currentUtcDate = new Date().toISOString();
//     project.updatedAt = currentUtcDate;

//     const updatedProject = await project.save();
//     res.status(200).json(updatedProject);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Server error" });
//   }
// });


router.delete("/projects/:id", async (req, res) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id);
    if (!deletedProject) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error deleting project", details: error.message });
  }
});

router.post("/projects/:department", async (req, res) => {
  const department = req.params.department;

  try {
    const users = await User.find({ department: department });

    if (!users) {
      return res.status(404).json({ error: "Users not found" });
    }

    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error finding users", details: error.message });
  }
});

// router.post('/updateAssignStatus', async (req, res) => {
//   try {
//     const { name, assignedStatus } = req.body; // Assuming status is provided in the request body
 
//     // Find projects where tasks have the specified assignTo name and status is "In Progress"
//     const projects = await Project.find({
//       status: "In Progress",
//       "tasks.assignTo": name
//     });
 
//     // Iterate through each project to update the assignedStatus
//     for (let i = 0; i < projects.length; i++) {
//       const project = projects[i];
//       console.log("project",project);
     
//       // Filter tasks in the project that match the assignToName and update assignedStatus
//      project.tasks.forEach(task => {
//         if (task.assignTo === name) {
//           task.assignedStatus = assignedStatus; // Update assignedStatus field
//         }
//       });
 
//       // Save the updated project back to the database
//       await project.save();
//     }
 
//     res.status(200).json({ message: "Tasks updated successfully" });
//   } catch (error) {
//     console.error("Error updating tasks:", error);
//     res.status(500).send(error);
//   }
// });
router.post('/updateAssignStatus', async (req, res) => {
  try {
    const { taskId, assignedStatus } = req.body;
    const project = await Project.findOne({
      status: "In Progress",
      "tasks._id": new ObjectId(taskId)
    });
    if (project) {
      const task = project.tasks.id(taskId);
      if (task) {
        task.assignedStatus = assignedStatus;
        await project.save();
        res.status(200).json({ message: "Task updated successfully" });
      } else {
        res.status(404).json({ message: "Task not found" });
      }
    } else {
      res.status(404).json({ message: "Project not found" });
    }
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).send(error);
  }
});

// router.post('/Find', async (req, res) => {
//   try {
//     const { name, serviceType } = req.body;

//     const projects = await Project.aggregate([
//       { $match: { status: "In Progress", "tasks.assignTo": name, "tasks.serviceType": serviceType } },
//       { $unwind: "$tasks" },
//       { $match: { "tasks.assignTo": name, "tasks.serviceType": serviceType } },
//       { $group: {
//         _id: "$_id",
//         projectName: { $first: "$projectName" },
//         assignedBy: { $first: "$assignedBy" },
//         userId: { $first: "$userId" },
//         status: { $first: "$status" },
//         sourceUpload: { $first: "$sourceUpload" },
//         tmxUpload: { $first: "$tmxUpload" },
//         targetLanguage: { $first: "$targetLanguage" },
//         sourceLanguage: { $first: "$sourceLanguage" },
//         tasks: { $push: "$tasks" },
//         createdAt: { $first: "$createdAt" },
//         updatedAt: { $first: "$updatedAt" },
//         __v: { $first: "$__v" }
//       }}
//     ]);

//     if (projects.length === 0) {
//       return res.status(404).json({ message: "No matching project found" });
//     }

//     res.json(projects[0]); // Assuming you only expect one project to match
//   } catch (error) {
//     console.error("Error finding project:", error);
//     res.status(500).json({ message: "Error finding project" });
//   }
// });
router.post('/Find', async (req, res) => {
  try {
    const { name, serviceType  } = req.body;

    const projects = await Project.aggregate([
      { $match: { status: "In Progress", "tasks.assignTo": name, "tasks.serviceType": serviceType } },
      { $unwind: "$tasks" },
      { $match: { "tasks.assignTo": name, "tasks.serviceType": serviceType } },
      { $group: {
        _id: "$_id",
        projectName: { $first: "$projectName" },
        assignedBy: { $first: "$assignedBy" },
        userId: { $first: "$userId" },
        status: { $first: "$status" },
        sourceUpload: { $first: "$sourceUpload" },
        tmxUpload: { $first: "$tmxUpload" },
        targetLanguage: { $first: "$targetLanguage" },
        sourceLanguage: { $first: "$sourceLanguage" },
        tasks: { $push: "$tasks" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        index:{ $first: "$index" },
        __v: { $first: "$__v" }
      }}
    ]);

    if (projects.length === 0) {
      return res.status(404).json({ message: "No matching project found" });
    }

    res.json(projects); // Return all matched projects
  } catch (error) {
    console.error("Error finding projects:", error);
    res.status(500).json({ message: "Error finding projects" });
  }
});

module.exports = router;
