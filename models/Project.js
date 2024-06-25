const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  serviceType: {
    type: String,
    required: true,
  },
  assignTo: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  assignTargetLanguage: {
    type: String,
    required: true,
  },
});

const projectSchema = new Schema(
  {
    projectName: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // email: {
    //   type: String,
    //   required: true,
    // },
    status: {
      type: String,
      enum: ["init", "In Progress", "Completed"],
      default: "init",
    },
    sourceUpload: {
      type: [String],
    },
    tmxUpload: {
      type: [String],
    },
    targetLanguage: {
      type: [String],
      required: true,
    },
    sourceLanguage: {
      type: String,
      required: true,
    },
    tasks: {
      type: [taskSchema],
    },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
