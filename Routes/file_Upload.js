const express = require('express');
const router = express.Router();
const multer = require('multer');
// const { Client } = require("@elastic/elasticsearch");
// const client = new Client({ node: "http://localhost:9200" });
const Project = require('../models/Project'); // Adjust the path as necessary
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


// const NewMergeRows = async function (req, res) {
//   try {
//     const pid = new ObjectId(req.body._id);

//     if (req.body.splitRows && req.body.splitRows.length > 0) {
//       let jsonArrayCSV = req.body.splitRows;
//       let csvArrayMerge = [];

//       var dirName = req.body.serviceType + req.body.fileName;
//       if (req.body.serviceType === "Translation") {
//         req.body.translatedFile = dirName;
//       } else {
//         req.body.completedFile = dirName;
//       }

//       const groupedArray = jsonArrayCSV.reduce((acc, val) => {
//         let estKey = val['index'];
//         (acc[estKey] ? acc[estKey] : (acc[estKey] = null || [])).push(val);
//         return acc;
//       }, []);

//       const tempArr = Object.values(groupedArray);

//       if (tempArr.length > 0) {
//         for (let extractIndex = 0; extractIndex < tempArr.length; extractIndex++) {
//           let mergedString = "";
//           let fieldValue = "";
//           let targetFieldValues = [];

//           for (let subIndex = 0; subIndex < tempArr[extractIndex].length; subIndex++) {
//             mergedString += tempArr[extractIndex][subIndex]["Original Field Value"] + tempArr[extractIndex][subIndex]["symbol"];
//             fieldValue = tempArr[extractIndex][subIndex]["Field Path"];
//             targetFieldValues.push(tempArr[extractIndex][subIndex]["Target Field Value"]);
//           }

//           const targetFieldValue = targetFieldValues.join(""); // Join all Target Field Values

//           csvArrayMerge.push({
//             "Field Path": fieldValue,
//             "Original Field Value": mergedString,
//             "Target Field Value": targetFieldValue,
//           });
//         }
//       }

//       const fields = ["Field Path", "Original Field Value", "Target Field Value"];
//       const csv = parse(csvArrayMerge, { fields });
//       const csvData = iconv.encode(csv, "iso-8859-1");

//       let data = await fs.writeFile(path.join(__dirname, "../../Uploads", dirName), csvData, async function (err) {
//         if (err) {
//           console.log(err);
//           throw new Error(err);
//         } else {
//           const fileSaved = req.body.serviceType === "Translation" ? "folderFiles.$.translatedFile" : "folderFiles.$.completedFile";
//           try {
//             const update = await CProject.updateOne(
//               {
//                 _id: req.body._id,
//                 "folderFiles.fileId": req.body.fileId,
//               },
//               {
//                 $set: {
//                   [fileSaved]: dirName,
//                   "folderFiles.$.fileStatus": req.body.fileStatus,
//                 }
//               });
//             if (update) {
//               res.status(200).sendfile(path.join(__dirname, "../../Uploads", dirName));
//             }
//           } catch (error) {
//             console.log(error);
//             let errorResponse = response.generateResponse(
//               error,
//               "An error occurred",
//               500,
//               null
//             );
//             res.status(500).send(errorResponse);
//           }
//         };
//       });
//     } else {
//       res.status(400).send("No data provided in splitRows");
//     }
//   } catch (error) {
//     console.log(error);
//     let errorResponse = response.generateResponse(
//       error,
//       "An error occurred",
//       500,
//       null
//     );
//     res.status(500).send(errorResponse);
//   }
// }

module.exports = router;