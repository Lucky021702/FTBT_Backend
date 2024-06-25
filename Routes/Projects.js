const express = require("express");
const router = express.Router();
const Project = require("../models/Project.js");
const User = require("../models/Schema.js");

router.post("/createProject", async (req, res) => {
  try {
    const { projectName, email, tmxUpload, sourceUpload, sourceLanguage, targetLanguage } = req.body;
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
        error: "Project name is required"
      });
    }
    
    if (!sourceLanguage) {
      return res.status(400).json({
        error: "Source language is required"
      });
    }
    
    if (!targetLanguage || targetLanguage.length === 0) {
      return res.status(400).json({
        error: "At least one target language is required"
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
      userId: user._id,
      status: "init",
      sourceUpload: sourceUpload || [],
      tmxUpload: tmxUpload || [],
      sourceUpload: sourceUpload || [], 
      tmxUpload: tmxUpload || [], 
      sourceLanguage,
      targetLanguage,
      email,
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
        project.tasks[existingTaskIndex] = newTask;
      } else {
        project.tasks.push({ ...newTask, index: project.tasks.length });
      }
    });
    project.updatedAt = new Date().toISOString().split("T")[0];
    const updatedProject = await project.save();
    res.status(200).json(updatedProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/projects/:department", async (req, res) => {
  const department = req.params.department;
  try {
    const users = await User.find({ department: department });
    if (!users) {
      return res.status(404).json({ error: 'Users not found' });
    }
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Error finding users", details: error.message });
  }
});

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

module.exports = router;
