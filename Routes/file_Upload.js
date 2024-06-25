const express = require('express');
const router = express.Router();
const multer = require('multer');
const Project = require('../models/Project'); // Adjust the path as necessary

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: './uploads/', // Change the path accordingly
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// // Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 } // 1MB limit per file
}).array('sourceUpload', 10);


// Init upload for multiple files
const uploadTmx = multer({
  storage: storage,
  limits: { fileSize: 1000000 } // 1MB limit per file
}).array('tmxUpload', 10); // Maximum 10 files at a time

// Endpoint for uploading source file
router.post('/projects/:projectId/upload-source', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ message: err.message });
    }

    try {
      const { projectId } = req.params;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded.' });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }

      const fileNames = files.map(file => file.filename);

      // Assuming you want to replace the existing array or push new files
      project.sourceUpload = project.sourceUpload.concat(fileNames); // Append new filenames to the existing array
      await project.save();

      res.status(200).json({
        message: 'Source files uploaded successfully',
        files
      });
    } catch (error) {
      res.status(500).json({ message: 'Error uploading source files', error: error.message });
    }
  });
});

// Endpoint for uploading TMX file
router.post('/projects/:projectId/upload-tmx', (req, res) => {
  uploadTmx(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ message: err.message });
    }

    try {
      const { projectId } = req.params;
      const files = req.files;
console.log(files);
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded.' });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }

      const fileNames = files.map(file => file.filename);

      // Assuming you want to replace the existing array or push new files
      project.tmxUpload = project.tmxUpload.concat(fileNames); // Append new filenames to the existing array
      await project.save();

      res.status(200).json({
        message: 'TMX files uploaded successfully',
        files: fileNames
      });
    } catch (error) {
      res.status(500).json({ message: 'Error uploading TMX files', error: error.message });
    }
  });
});


module.exports = router;