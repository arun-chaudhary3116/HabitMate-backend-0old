import mongoose, { Schema, Types } from "mongoose";

const habitCheckerSchema = new Schema(
  {
    habitId: {
      type: Types.ObjectId,
      ref: "Habit",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

//Prevent duplicate check-in records for the same habit date

habitCheckerSchema.index({ habitId: 1, date: 1 }, { unique: true });
export const HabitChecker = mongoose.model("HabitChecker", habitCheckerSchema);
