import express from "express";
import {
  checkHabit,
  createHabit,
  deleteHabit,
  getHabits,
} from "../controllers/habit.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, createHabit); // Create new habit
router.get("/", verifyJWT, getHabits); // Get user habits
router.patch("/:id/check", verifyJWT, checkHabit); // Mark habit complete
router.delete("/:id", verifyJWT, deleteHabit); // Delete habit

export default router;
