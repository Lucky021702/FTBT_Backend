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
      res.status(500).json({
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

// router.post("/add", async (req, res) => {
//   const { index, document } = req.body;
//   if (!index || !document) {
//     return res.status(400).json({ error: "Index and document are required" });
//   }
//   try {
//     const response = await client.index({
//       index: index,
//       body: document,
//     });
//     console.log(`Document added to index "${index}"`, response);
//     res
//       .status(200)
//       .json({ message: `Document added to index "${index}"`, response });
//   } catch (error) {
//     console.error(`Error adding document to index "${index}":`, error);
//     res.status(500).json({
//       error: `Error adding document to index "${index}"`,
//       message: error.message,
//     });
//   }
// });

router.post("/add", async (req, res) => {
  const { index, document } = req.body;
  if (!index || !document || !Array.isArray(document)) {
    return res
      .status(400)
      .json({ error: "Index and an array of documents are required" });
  }
  try {
    const bulkBody = [];
    document.forEach((doc) => {
      bulkBody.push({ index: { _index: index } });
      bulkBody.push(doc);
    });
    const response = await client.bulk({ body: bulkBody });
    if (response.errors) {
      // Log errors for further investigation
      const erroredDocuments = [];
      response.items.forEach((item, i) => {
        if (item.index && item.index.error) {
          erroredDocuments.push({
            status: item.index.status,
            error: item.index.error,
            operation: bulkBody[i * 2],
            document: bulkBody[i * 2 + 1],
          });
        }
      });
      console.error("Bulk operation had errors", erroredDocuments);
      return res.status(500).json({
        message: "Error indexing documents",
        errors: erroredDocuments,
      });
    }
    console.log(`Documents added to index "${index}"`, response);
    res
      .status(200)
      .json({ message: `Documents added to index "${index}"`, response });
  } catch (error) {
    console.error(`Error adding documents to index "${index}":`, error);
    res.status(500).json({
      error: `Error adding documents to index "${index}"`,
      message: error.message,
    });
  }
});

function getSentenceDiff(sent1, sent2) {
  console.log(sent1);
  let sentArr1 = sent1.split(" ");
  let sentArr2 = sent2.split(" ");
  let referenceSentence =
    sentArr1.length > sentArr2.length ? sentArr1 : sentArr2;
  let diffCount = 0;

  for (let i = 0; i < referenceSentence.length; i++) {
    if (sentArr1[i] !== undefined && sentArr2[i] !== undefined) {
      if (sentArr1[i] !== sentArr2[i]) {
        diffCount++;
      }
    } else {
      diffCount++;
    }
  }
  return diffCount;
}
// router.post("/searchIndex", async (req, res) => {
//   try {
//     const index = req.body.index;
//     const data = req.body.query;
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
//     console.log(datas);
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

//     // return { results };
//     res.json(results);
//   } catch (err) {
//     console.error(err);
//     throw new Error("An error occurred during the search.");
//   }
// });

router.post("/searchIndex", async (req, res) => {
  try {
    const { index, query } = req.body;

    if (!index || !query) {
      return res.status(400).json({ error: "Index and query are required" });
    }

    const response = await client.search({
      index,
      body: {
        query: {
          match: {
            source: query,
          },
        },
      },
    });

    const hits = response.hits.hits;
    if (hits.length === 0) {
      return res.status(200).json({ message: "No data found" });
    }
    const results = hits.map((hit) => {
      const { source, target } = hit._source;
      const id = hit._id;
      const diff = getSentenceDiff(source, query);
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

      return {
        id,
        source,
        target,
        matchPercentage,
      };
    });

    // Sort results to ensure exact matches come first
    const sortedResults = results.sort((a, b) => {
      if (a.matchPercentage === "100%") return -1;
      if (b.matchPercentage === "100%") return 1;
      return 0;
    });

    res.json(sortedResults);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred during the search." });
  }
});

router.delete("/delete", async (req, res) => {
  const { index } = req.body;
  if (!index) {
    return res.status(400).json({ error: "Index name is required" });
  }
  try {
    const { body } = await client.deleteByQuery({
      index: index,
      body: {
        query: {
          match_all: {},
        },
      },
    });

    console.log(`All documents deleted from index "${index}"`, body);
    res.status(200).json({
      message: `All documents deleted from index "${index}"`,
      response: body,
    });
  } catch (error) {
    console.error(`Error deleting documents from index "${index}":`, error);
    res.status(500).json({
      error: `Error deleting documents from index "${index}"`,
      message: error.message,
    });
  }
});

module.exports = router;
