const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Client } = require("@elastic/elasticsearch");
const client = new Client({ node: "http://localhost:9200" });
const Project = require('../models/Project'); // Adjust the path as necessary
const path = require("path");
const TM = require("../models/Tm")
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
      console.log(fileNames);
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
router.post('/download', (req, res) => {
  let fileName = req.body.fileName
 
  const filePath = path.join(__dirname, '../uploads', fileName);
 
   console.log( "__dirname",filePath);
   res.download(filePath, (err) => {
     if (err) {
       console.error('Error occurred during file download:', err);
       res.status(500).send('Error occurred during file download.');
     }
   });
 });

 router.get('/files/:fileName', (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(__dirname, '../uploads', fileName);

  // You can perform additional checks here for security or file existence
  res.sendFile(filePath);
});


 router.post("/searchIndex", async (req, res) => {
  try {
    const index = req.body.index;
    const data = req.body.query;
      const datas = await client.search({
        index,
        body: {
          query: {
            match: {
              source: data,
            },
          },
        },
      });
      // console.log(datas);
      const hits = datas.hits.hits;
      const results = [];
  
      if (hits.length === 0) {
        return { results: [] };
      }
  
      hits.forEach((hit) => {
        // console.log(hit)
        // console.log(JSON.stringify(hit),"this is hit........................................")
        const source = hit._source.source;
        const target = hit._source.target;
        const diff = getSentenceDiff(source, data);
        const id = hit._id;
        let matchPercentage;
  
        if (diff === 0) {
          matchPercentage = "100%";
        } else if (diff === 1) {
          matchPercentage = "99-95%";
        } else if (diff === 2) {
          matchPercentage = "90-95%";
        } else if (diff === 3) {
          matchPercentage = "85-90%";
        } else {
          matchPercentage = "Less than 85%";
        }
  
        if (diff === 0) {
          results.unshift({
            id,
            source,
            target,
            matchPercentage,
          });
        } else {
          results.push({
            id,
            source,
            target,
            matchPercentage,
          });
        }
      });
  
      return { results };
    } catch (err) {
      console.error(err);
      throw new Error("An error occurred during the search.");
    }
 })
// router.post("/createIndex",async(req, res) =>{
//   try {
//     const newTM = new TM({
//       clientId: req.body.clientId,
//       sourceLanguage: req.body.sourceLanguage,
//       targetLanguage: req.body.targetLanguage,
//       domain: req.body.domain,
//       index:
//         `${req.body.sourceLanguage}_${req.body.targetLanguage}_${req.body.clientId}_${req.body.domain}`.toLowerCase(),
//       createdOn: new Date().toISOString().slice(0, 10),
//     });

//     const savedTM = await TM.create(newTM);

//     const indexName = newTM.index;

//     // Create the index in Elasticsearch
//     await client.indices.create({
//       index: indexName,
//     });

//     // Assume that the indexData is provided in the request body as an array of documents
//     const indexData = req.body.indexData;

//     const bulkBody = [];
//     let batchSize = 0;

//     for (const data of indexData) {
//       const action = { index: { _index: newTM.index } };
//       const document = {
//         source: data.Source,
//         target: data.Target,
//         domain: newTM.domain,
//         clientId: newTM.clientId,
//         timestamp: new Date(),
//       };
//       bulkBody.push(action, document);
//       batchSize++;
//       if (batchSize >= 1000) {
//         await client.bulk({ body: bulkBody });
//         bulkBody.length = 0;
//         batchSize = 0;
//       }
//     }

//     if (bulkBody.length > 0) {
//       await client.bulk({ body: bulkBody });
//     }

//     return res.json({ resp: indexData });
//   } catch (err) {
//     console.error(err);
//     if (err.code === 11000) {
//       return res.status(400).json({
//         error:
//           "TM for this Language pair and Client Id already exists. Try creating for another language.",
//       });
//     } else {
//       return res
//         .status(500)
//         .json({ error: "An error occurred during index creation." });
//     }
//   }
// })
  router.post('/createIndex', async (req, res) => {
    const { indexName, settings, mappings } = req.body.index;

    try {
        const response = await client.indices.create({
            index: indexName,
            body: {
                settings,
                mappings
            }
        });
        console.log(`Index "${indexName}" created`, response);
        res.status(200).json({ message: `Index "${indexName}" created`, response });
    } catch (error) {
        console.error(`Error creating index "${indexName}":`, error);
        res.status(500).json({ error: `Error creating index "${indexName}"`, message: error.message });
    }
  });
module.exports = router;