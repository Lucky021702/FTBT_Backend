const express = require("express");
const router = express.Router();
const ChatMessage = require("../models/Chat_Message");


router.post("/send", async (req, res) => {
  try {
    const { toSender, message, toReceiver } = req.body;
    if (!toSender || !message || !toReceiver) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const newMessage = new ChatMessage({
      toSender,
      toReceiver,
      message,
      timestamp: new Date(),
      seen:false
    });
    await newMessage.save();
    res.status(201).json({ message: message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// router.get("/:toSender/messages", async (req, res) => {
//   try {
//     const toSender = req.params.toSender;
//     const messages = await ChatMessage.find({
//       "toSender": toSender,
//     }).sort("-timestamp");
//     res.json(messages);
//   } catch (error) {
//     console.error("Error fetching messages:", error);
//     res.status(500).json({ error: "Error fetching messages" });
//   }
// });

// router.post("/send", async (req, res) => {
//   try {
//     const { toSender, message, toReceiver } = req.body;
//     if (!toSender || !message || !toReceiver) {
//       return res.status(400).json({ error: "All fields are required" });
//     }
//     // Save message to database
//     const newMessage = new ChatMessage({ toSender, toReceiver, message });
//     await newMessage.save();
//     // Emit the message to all connected clients
//     io.emit("chat message", newMessage);
//     res.status(201).json({ message });
//   } catch (error) {
//     console.error("Error sending message:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// Handle sending messages
// router.post("/send", async (req, res) => {
//   try {
//     const { toSender, message, toReceiver } = req.body;
//     if (!toSender || !message || !toReceiver) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     // Save message to database
//     const newMessage = new ChatMessage({ toSender, toReceiver, message });
//     await newMessage.save();

//     // Emit the message to all connected clients
//     io.emit("chat message", newMessage);

//     res.status(201).json({ message });
//   } catch (error) {
//     console.error("Error sending message:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

router.get("/:toSender/:toReceiver/messages", async (req, res) => {
  try {
    const { toSender, toReceiver } = req.params;
    const messages = await ChatMessage.find({
      $or: [
        { toSender: toSender, toReceiver: toReceiver },
        { toSender: toReceiver, toReceiver: toSender },
      ],
    }).sort({ timestamp: +1 });
    res.json(messages || "message not found");
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Error fetching messages" });
  }
});

router.post("/mark-as-seen", async (req, res) => {
  try {
    const { messageId, chatId } = req.body;
    const chatMessage = await ChatMessage.findById(chatId);
    if (!chatMessage) {
      return res.status(404).json({ error: "Chat not found" });
    }
    const message = chatMessage.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    message.seen = true;
    await chatMessage.save();
    io.emit("message-seen", { messageId, chatId });
    res.status(200).json({ message: "Message marked as seen" });
  } catch (error) {
    console.error("Error marking message as seen:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/edit-message",async(req,res)=>{
  try{
    const {chatId,messageId, chatMessage} = req.body
  const findChatMessage = await ChatMessage.findById(chatId)
  if(!findChatMessage) return res.status(404).json({error: "Message not found"})
    findChatMessage.message = messageId
  await findChatMessage.save()
  io.emit("message-edited",{messageId})
  res.status(200).json({message:"Message edited Succesfully"})
  }
  catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({ error: "Internal Server Error" });
}});



module.exports = router;
