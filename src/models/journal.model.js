// backend/models/journal.model.js
import mongoose, { Schema, Types } from "mongoose";

const journalSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", required: true }, // Link to User
  date: { type: Date, default: Date.now },
  content: { type: String, required: true },
  mood: { type: String, default: "Neutral" },
});

export const Journal = mongoose.model("Journal", journalSchema);
