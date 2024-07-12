require("dotenv").config();
const express = require("express");
const dbConnect = require("./DB/dbConnect");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const ChatMessage = require("./models/Chat_Message");
const http = require("http");
const socketIo = require("socket.io");
const chatRoute = require("./Routes/Chat");
const Projects = require("./Routes/Projects");
const login = require("./Routes/login");
const fileUpload = require("./Routes/file_Upload");
const File = require("./models/FileData"); // Adjust the path as necessary
const language = require("./Routes/Language");
const server = http.createServer(app);
const path = require("path");
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

// io.on('connection', (socket) => {
//   console.log('a user connected');
// });

// Socket.IO connection
io.on("connection", (socket) => {
  // console.log("New client connected");
  // Join the user-specific room
  socket.on("joinRoom", (email) => {
    socket.join(email);
    // console.log(`${email} joined the room`);
  });
  socket.on("sendMessage", async (message) => {
    const chatMessage = new ChatMessage(message);
    await chatMessage.save();
    io.to(message.toSender)
      .to(message.toReceiver)
      .emit("receiveMessage", chatMessage);
  });
  // Handle the updateTarget event
  socket.on("updateTarget", async (fileId, newTargets) => {
    try {
      // Update the Target field in the database
      const updatedFile = await File.findByIdAndUpdate(
        { Target: newTargets },
       
      );

      // Emit the updated file to all connected clients
      io.emit("targetUpdated", updatedFile); // Emit the update to all clients
    } catch (error) {
      console.error("Error updating Target:", error);
    }
  });
  socket.on("disconnect", () => {
    // console.log("Client disconnected");
  });
});

//Server
const PORT = process.env.PORT || 8000;
// Middleware to parse JSON bodies
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Use the route
app.use("/api/chat", chatRoute);
app.use("/api", login);
app.use("/api", Projects);
app.use("/api", fileUpload);
app.use("/api", language);

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Set the io object on the app
app.set("io", io);

app.get("/", async (req, res) => res.send("<h1>Connected ...</h1>"));

app.put("/updateTargetAtIndex", async (req, res) => {
  try {
    const { index, targetIndex, newValue } = req.body;
    // Validate input
    if (!index || targetIndex === undefined || typeof newValue !== "string") {
      return res.status(400).json({ error: "Invalid input" });
    }
    // Update the document directly in MongoDB using findOneAndUpdate
    const updatedFile = await File.findOneAndUpdate(
      { index },
      { $set: { [`Target.${targetIndex}`]: newValue } },
      { new: true } // To return the updated document
    );

    // Check if file exists
    if (!updatedFile) {
      return res
        .status(404)
        .json({ error: "File with the given index not found" });
    }
    io.emit("target-updated", {
     updatedFile
    });

    res.status(200).json(updatedFile);
  } catch (error) {
    console.error("Error updating Target field", error);
    res.status(500).json({ error: "Failed to update Target field" });
  }
});

app.get("/qcFileData/:index", async (req, res) => {
  try {
    const { index } = req.params;
    const existingFile = await File.findOne({ index });

    if (existingFile) {
      res.status(200).json(existingFile);
    } else {
      res.status(400).json({ message: "No file found" });
    }
  } catch (error) {
    console.error("Error fetching file", error);
    res.status(500).json({ error: "Failed to fetch file" });
  }
});

server.listen(PORT, async () => {
  await dbConnect();
  console.log(`server at ${PORT} , DB Connected`);
});
