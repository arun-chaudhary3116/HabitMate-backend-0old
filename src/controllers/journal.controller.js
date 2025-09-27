import { Journal } from "../models/journal.model.js";

// ✅ Create new journal entry
export const createJournalEntry = async (req, res) => {
  try {
    const { content, mood } = req.body;
    const userId = req.user?.id; // from auth middleware

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const entry = new Journal({
      userId,
      content,
      mood,
    });

    await entry.save();

    // Map _id to id for frontend
    res.status(201).json({
      id: entry._id,
      userId: entry.userId,
      date: entry.date,
      content: entry.content,
      mood: entry.mood,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating journal entry", error });
  }
};

// ✅ Get all journal entries
export const getJournalEntries = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const entries = await Journal.find({ userId }).sort({ date: -1 });

    // Map _id to id
    const formatted = entries.map((e) => ({
      id: e._id,
      userId: e.userId,
      date: e.date,
      content: e.content,
      mood: e.mood,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Error fetching journal entries", error });
  }
};

// ✅ Delete entry
export const deleteJournalEntry = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const entry = await Journal.findOneAndDelete({ _id: id, userId });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.status(200).json({
      message: "Entry deleted",
      id: entry._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting journal entry", error });
  }
};
