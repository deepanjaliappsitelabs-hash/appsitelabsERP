// server/models/Recruitment.js

const mongoose = require("mongoose");

const recruitmentSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["full", "part", "intern"],
      required: true,
    },
    openings: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Active", "Paused", "Closed"],
      default: "Active",
    },
    description: { type: String, default: "" },
    requirements: { type: String, default: "" },
    salaryRange: { type: String, default: "" },
    location: { type: String, default: "" },
    lastDate: { type: Date, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recruitment", recruitmentSchema);

