// const chatMessageSchema = new mongoose.Schema({
//   toReceiver: {
//     type: String,
//     required: true,
//   },
// toSender:{
//      type:String,
//      validate: {
//       validator: async function (value) {
//         const user = await mongoose.model("User").findOne({ userName: value });
//         return !!user;
//       },
//     },
//      required:true
// },
//   message: {
//     type: [String],
//     required: true,
//   },
//   timestamp: {
//     type: Date,
//     default: Date.now,
//   },
//   default: [],
// });

// const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
// module.exports = ChatMessage;

// const mongoose = require("mongoose");

// const chatMessageSchema = new mongoose.Schema({
//   toSender: {
//     type: String,
//     validate: {
//       validator: async function (value) {
//         const user = await mongoose.model("User").findOne({ userName: value });
//         return !!user;
//       },
//     },
//     required: true,
//   },
//   toReceiver: {
//     type: String,
//     required: true,
//   },
//   messages: [],
//   timestamp: {
//         type: Date,
//         default: Date.now,
//       },
// });

// const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
// module.exports = ChatMessage;

const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  toSender: {
    type: String,
    validate: {
      validator: async function (value) {
        const user = await mongoose.model("User").findOne({ email: value });
        return !!user;
      },
    },
    required: true,
  },
  toReceiver: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  seen:{
    type:Boolean,default:false
  }
});

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
module.exports = ChatMessage;
