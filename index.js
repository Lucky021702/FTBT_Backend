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
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

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

// Set the io object on the app
app.set("io", io);

app.get("/", async (req, res) => res.send("<h1>Connected ...</h1>"));

server.listen(PORT, async () => {
  await dbConnect();
  console.log(`server at ${PORT} , DB Connected`);
});
// require("dotenv").config();
// const express = require("express");
// const dbConnect = require("./DB/dbConnect");
// const cors = require("cors");
// const app = express();
// const http = require("http");
// const socketIo = require("socket.io");
// const chatRoute = require("./Routes/Chat");
// const Projects = require("./Routes/Projects");
// const login = require("./Routes/login");
// const fileUpload = require("./Routes/file_Upload");
// const language = require("./Routes/Language");
// const path = require("path");

// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"],
//   },
// });

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Use the routes
// app.use("/api/chat", chatRoute);
// app.use("/api", login);
// app.use("/api", Projects);
// app.use("/api", fileUpload);
// app.use("/api", language);

// // Serve static files from the 'uploads' directory
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// app.get("/", async (req, res) => res.send("<h1>Connected ...</h1>"));

// io.on('connection', (socket) => {
//   console.log('A user connected');
//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//   });
// });
// app.put("/updateTargetAtIndex", async (req, res) => {
//   try {
//     const { index, targetIndex, newValue } = req.body;
//     // Validate input
//     if (!index || targetIndex === undefined || typeof newValue !== "string") {
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
//       return res
//         .status(404)
//         .json({ error: "File with the given index not found" });
//     }
//     io.emit("target-updated", {
//      updatedFile
//     });
 
//     res.status(200).json(updatedFile);
//   } catch (error) {
//     console.error("Error updating Target field", error);
//     res.status(500).json({ error: "Failed to update Target field" });
//   }
// });

// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).send('Something broke!');
// });

// // Start server and database connection
// const PORT = process.env.PORT || 8000;
// server.listen(PORT, async () => {
//   await dbConnect();
//   console.log(`Server running at http://localhost:${PORT} and DB connected`);
// });
