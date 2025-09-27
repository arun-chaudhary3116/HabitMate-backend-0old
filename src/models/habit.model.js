import mongoose, { Schema, Types } from "mongoose";

const habitSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      // required: [true, "Title is required"],
      trim: true,
      maxlength: [50, "Title cannot exceed 50 characters"],
    },
    description: {
      type: String,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    icon: {
      type: String,
      default: "✅",
    },
    isDaily: {
      type: Boolean,
      default: true,
    },
    streak: {
      // Fixed capitalization (was 'Streak')
      type: Number,
      default: 0,
      min: 0,
    },
    lastCheckedDate: Date,
    completedToday: {
      // Added to track daily completion
      type: Boolean,
      default: false,
    },
    history: [
      {
        date: { type: Date, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    color: {
      // Added to match frontend
      type: String,
      default: "bg-primary",
    },
    category: {
      // Added to match frontend
      type: String,
      default: "General",
    },
  },
  { timestamps: true }
);

export const Habit = mongoose.model("Habit", habitSchema);
