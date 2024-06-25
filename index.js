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

// Set the io object on the app
app.set("io", io);

app.get("/", async (req, res) => res.send("<h1>Connected ...</h1>"));

server.listen(PORT, async () => {
  await dbConnect();
  console.log(`server at ${PORT} , DB Connected`);
});
