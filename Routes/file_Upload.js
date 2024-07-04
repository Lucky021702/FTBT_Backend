const express = require("express");
const router = express.Router();
const multer = require("multer");
const { Client } = require("@elastic/elasticsearch");
const client = new Client({ node: "http://localhost:9200" });
const Project = require("../models/Project"); // Adjust the path as necessary
const path = require("path");
// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: "./uploads/", // Change the path accordingly
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// // Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB limit per file
}).array("sourceUpload", 10);

// Init upload for multiple files
const uploadTmx = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB limit per file
}).array("tmxUpload", 10); // Maximum 10 files at a time

// Endpoint for uploading source file
router.post("/projects/:projectId/upload-source", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ message: err.message });
    }

    try {
      const { projectId } = req.params;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded." });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found." });
      }

      const fileNames = files.map((file) => file.filename);
      console.log(fileNames);
      // Assuming you want to replace the existing array or push new files
      project.sourceUpload = project.sourceUpload.concat(fileNames); // Append new filenames to the existing array
      await project.save();

      res.status(200).json({
        message: "Source files uploaded successfully",
        files,
      });
    } catch (error) {
      res
        .status(500)
        .json({
          message: "Error uploading source files",
          error: error.message,
        });
    }
  });
});

// Endpoint for uploading TMX file
router.post("/projects/:projectId/upload-tmx", (req, res) => {
  uploadTmx(req, res, async (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ message: err.message });
    }

    try {
      const { projectId } = req.params;
      const files = req.files;
      console.log(files);
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded." });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found." });
      }

      const fileNames = files.map((file) => file.filename);

      // Assuming you want to replace the existing array or push new files
      project.tmxUpload = project.tmxUpload.concat(fileNames); // Append new filenames to the existing array
      await project.save();

      res.status(200).json({
        message: "TMX files uploaded successfully",
        files: fileNames,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error uploading TMX files", error: error.message });
    }
  });
});
router.post("/download", (req, res) => {
  let fileName = req.body.fileName;

  const filePath = path.join(__dirname, "../uploads", fileName);

  console.log("__dirname", filePath);
  res.download(filePath, (err) => {
    if (err) {
      console.error("Error occurred during file download:", err);
      res.status(500).send("Error occurred during file download.");
    }
  });
});

router.get("/files/:fileName", (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(__dirname, "../uploads", fileName);

  // You can perform additional checks here for security or file existence
  res.sendFile(filePath);
});

// const NewMergeRows = async function (req, res) {
//   try {
//     const pid = new ObjectId(req.body._id);

//  router.post("/searchIndex", async (index, data) => {
//   try {
//     const datas = await client.search({
//       index,
//       body: {
//         query: {
//           match: {
//             source: data,
//           },
//         },
//       },
//     });
//     // console.log(datas);
//     const hits = datas.hits.hits;
//     const results = [];

//     if (hits.length === 0) {
//       return { results: [] };
//     }

//     hits.forEach((hit) => {
//       // console.log(hit)
//       // console.log(JSON.stringify(hit),"this is hit........................................")
//       const source = hit._source.source;
//       const target = hit._source.target;
//       const diff = getSentenceDiff(source, data);
//       const id = hit._id;
//       let matchPercentage;

//       if (diff === 0) {
//         matchPercentage = "100%";
//       } else if (diff === 1) {
//         matchPercentage = "99-95%";
//       } else if (diff === 2) {
//         matchPercentage = "90-95%";
//       } else if (diff === 3) {
//         matchPercentage = "85-90%";
//       } else {
//         matchPercentage = "Less than 85%";
//       }

//       if (diff === 0) {
//         results.unshift({
//           id,
//           source,
//           target,
//           matchPercentage,
//         });
//       } else {
//         results.push({
//           id,
//           source,
//           target,
//           matchPercentage,
//         });
//       }
//     });

//     return { results };
//   } catch (err) {
//     console.error(err);
//     throw new Error("An error occurred during the search.");
//   }
//  })

router.post("/searchIndex", async (req, res) => {
  const { index, data } = req.body;

  try {
    // Flatten the array of arrays to a single string (assuming source should be treated as single string)
    const searchData = data.map(item => item[0]).join(' ');

    console.log('Search Data:', searchData);

    const response = await client.search({
      index,
      body: {
        query: {
          match: {
            source: searchData
          }
        }
      }
    });

    const hits = response.body.hits.hits;
    const results = [];

    hits.forEach((hit) => {
      const source = hit._source.source;
      const target = hit._source.target;
      // Add your logic for calculating matchPercentage here
      const matchPercentage = "TODO";

      results.push({
        id: hit._id,
        source,
        target,
        matchPercentage
      });
    });

    console.log('Search Results:', results);

    return res.json({ results });
  } catch (err) {
    console.error('Elasticsearch search error:', err);
    return res.status(500).json({ error: "An error occurred during the search." });
  }
});


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
