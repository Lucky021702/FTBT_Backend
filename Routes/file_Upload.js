const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Client } = require("@elastic/elasticsearch");
const client = new Client({ node: "http://localhost:9200" });
const Project = require('../models/Project'); // Adjust the path as necessary
const File = require('../models/FileData'); // Adjust the path as necessary
const path = require("path");
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
    console.log(datas);
    const hits = datas.hits.hits;
    const results = [];

    if (hits.length === 0) {
      return res.status(200).json([{ source: 'No data found' }]);
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
        matchPercentage = "85%";
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
 
    // return { results };
    res.json(results);
  } catch (err) {
    console.error(err);
    throw new Error("An error occurred during the search.");
  }
});
router.post("/fileData", async (req, res) => {
  try {
    const { index, Source, Target } = req.body;

    // Check if a document with the same index already exists
    let existingFile = await File.findOne({ index });

    if (existingFile) {
      // If exists, update the existing document
      existingFile.Source = Source;
      existingFile.Target = Target;
      let updatedFile = await existingFile.save();
      res.status(200).json(updatedFile);
    } else {
      // If not exists, create a new document
      const newFile = new File({
        index,
        Source,
        Target,
      });
      let fileData = await newFile.save();
      res.status(200).json(fileData);
    }
  } catch (error) {
    console.error("Error adding data in FileSchema", error);
    res.status(500).json({ error: "Failed to add data in FileSchema" });
  }
});

// router.put("/updateTargetAtIndex", async (req, res) => {
//   try {
//     const { index, targetIndex, newValue } = req.body;

//     // Validate input
//     if (!index || targetIndex === undefined || typeof newValue !== 'string') {
//       return res.status(400).json({ error: "Invalid input" });
//     }

//     // Update the document directly in MongoDB using findOneAndUpdate
//     const updatedFile = await File.findOneAndUpdate(
//       { index },
//       { $set: { [`Target.${targetIndex}`]: newValue } },
//       { new: true } // To return the updated document
//     );

//     // Check if file exists
//     if (!updatedFile) {
//       return res.status(404).json({ error: "File with the given index not found" });
//     }

//     res.status(200).json(updatedFile);
//   } catch (error) {
//     console.error("Error updating Target field", error);
//     res.status(500).json({ error: "Failed to update Target field" });
//   }
// });

router.get("/qcFileData/:index", async (req, res) => {
  try {
    const { index } = req.params;
    console.log(`Received request for index: ${index}`);

    // Check if a document with the same index already exists
    let existingFile = await File.findOne({ index });
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