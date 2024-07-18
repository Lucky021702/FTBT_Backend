const express = require("express");
const router = express.Router();
const BTData = require('../models/BtData'); // Adjust the path as necessary
 
 
router.post("/btFileData", async (req, res) => {
    try {
      const { index, Source, Target } = req.body;
 
      // Check if a document with the same index already exists
      let existingFile = await BTData.findOne({ index });
 
      if (existingFile) {
        // If exists, update the existing document
        existingFile.Source = Source;
        let btUpdatedFile = await existingFile.save();
        res.status(200).json(btUpdatedFile);
      } else {
        // If not exists, create a new document
        const newFile = new BTData({
          index,
          Source,
        });
        let btFileData = await newFile.save();
        res.status(200).json(btFileData);
      }
    } catch (error) {
      console.error("Error adding data in FileSchema", error);
      res.status(500).json({ error: "Failed to add data in FileSchema" });
    }
  });
 
  router.get("/btFileData/:index", async (req, res) => {
    try {
      const { index } = req.params;
      console.log(`Received request for index: ${index}`);
  
      // Check if a document with the same index already exists
      let existingFile = await BTData.findOne({ index });
      console.log(`Existing file: ${existingFile}`);
  
      if (existingFile) {
        res.status(200).json(existingFile);
      } else {
        res.status(400).json({ message: "No file found" });
      }
    } catch (error) {
      console.error("Error retrieving data from FileSchema", error);
      res.status(500).json({ error: "Failed to retrieve data from FileSchema" });
    }
  });
  module.exports = router;