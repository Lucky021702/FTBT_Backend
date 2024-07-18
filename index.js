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
const language = require("./Routes/Language");
const server = http.createServer(app);
const path = require("path");
const File = require("./models/FileData")
const BtFile = require("./models/BtData")
const BtData = require("./Routes/btFileUpload")

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Use the route
app.use("/api/chat", chatRoute);
app.use("/api", login);
app.use("/api", Projects);
app.use("/api", fileUpload);
app.use("/api", language);
app.use("/api", BtData);

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("New client connected");
  // Join the user-specific room
  socket.on("joinRoom", (email) => {
    socket.join(email);
    console.log(`${email} joined the room`);
  });
  socket.on("sendMessage", async (message) => {
    const chatMessage = new ChatMessage(message);
    await chatMessage.save();
    io.to(message.toSender)
      .to(message.toReceiver)
      .emit("receiveMessage", chatMessage);
  });
  socket.on("disconnect", () => {
    // console.log("Client disconnected");
  });
});
app.set("io", io);
app.put("/updateTargetAtIndex", async (req, res) => {
  try {
    const { index, targetIndex, newValue } = req.body;

    // Validate input
    if (index === undefined || targetIndex === undefined || typeof newValue !== "string") {
      return res.status(400).json({ error: "Invalid input" });
    }

    // Find the document by index
    const file = await File.findOne({ index });

    // Check if file exists
    if (!file) {
      return res.status(404).json({ error: "File with the given index not found" });
    }

    // Ensure Target is an array and targetIndex is within bounds
    if (!Array.isArray(file.Target)) {
      file.Target = [];
    }
    while (file.Target.length <= targetIndex) {
      file.Target.push("");
    }

    // Update the specific element in the Target array
    file.Target[targetIndex] = newValue;

    // Save the updated document
    const updatedFile = await file.save();

    // Emit the update
    io.emit("target-updated", {
      updatedFile
    },console.log("inside FT"));
    res.status(200).json(updatedFile);
  } catch (error) {
    console.error("Error updating Target field", error);
    res.status(500).json({ error: "Failed to update Target field" });
  }
});

app.put("/updateTargetAtIndexBT", async (req, res) => {
  try {
    const { index, targetIndex, newValue } = req.body;

    // Validate input
    if (index === undefined || targetIndex === undefined || typeof newValue !== "string") {
      return res.status(400).json({ error: "Invalid input" });
    }

    // Find the document by index
    const file = await BtFile.findOne({ index });

    // Check if file exists
    if (!file) {
      return res.status(404).json({ error: "File with the given index not found" });
    }

    // Ensure Target is an array and targetIndex is within bounds
    if (!Array.isArray(file.Target)) {
      file.Target = [];
    }
    while (file.Target.length <= targetIndex) {
      file.Target.push("");
    }

    // Update the specific element in the Target array
    file.Target[targetIndex] = newValue;

    // Save the updated document
    const updatedFile = await file.save();
     // Emit the update
     io.emit("target-updated-Bt", {
      updatedFile,
    },console.log("inside Target"));
    res.status(200).json(updatedFile);
  } catch (error) {
    console.error("Error updating Target field", error);
    res.status(500).json({ error: "Failed to update Target field" });
  }
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, async () => {
  await dbConnect();
  console.log(`server at ${PORT} , DB Connected`);
});
