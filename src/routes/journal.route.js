import express from "express";

import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntries,
} from "../controllers/journal.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyJWT, createJournalEntry);

router.get("/", verifyJWT, getJournalEntries);

router.delete("/:id", verifyJWT, deleteJournalEntry);

export default router;
