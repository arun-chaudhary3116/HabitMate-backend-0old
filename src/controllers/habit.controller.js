import { Habit } from "../models/habit.model.js";

// Get all habits for a user
export const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id });

    const today = new Date().toDateString();

    // Reset completedToday if it's a new day
    const resetPromises = habits.map(async (habit) => {
      if (habit.lastCheckedDate) {
        const lastChecked = habit.lastCheckedDate.toDateString();
        if (lastChecked !== today) {
          habit.completedToday = false;
          await habit.save();
        }
      }
    });

    await Promise.all(resetPromises);

    res.json(
      habits.map((habit) => ({
        id: habit._id,
        title: habit.title,
        description: habit.description || "Daily goal",
        completedToday: habit.completedToday,
        streak: habit.streak,
        lastCheckedDate: habit.lastCheckedDate,
        category: habit.category,
        color: habit.color,
        history: habit.history || [],
      }))
    );
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching habits", error: error.message });
  }
};

// Create new habit
export const createHabit = async (req, res) => {
  try {
    const { title, description, category, color } = req.body;
    const habit = new Habit({
      userId: req.user._id,
      title,
      description,
      category: category || "General",
      color: color || "bg-primary",
      streak: 0,
    });
    await habit.save();

    res.status(201).json({
      _id: habit._id,
      title: habit.title,
      description: habit.description || "Daily goal",
      completedToday: habit.completedToday,
      streak: habit.streak,
      category: habit.category,
      color: habit.color,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating habit", error: error.message });
  }
};

// Toggle habit completion
export const checkHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: "Habit not found" });

    const today = new Date();
    const todayStr = today.toDateString();

    // Check if already marked today
    const alreadyDone = habit.history?.some(
      (h) => new Date(h.date).toDateString() === todayStr && h.completed
    );

    if (alreadyDone) {
      return res.status(400).json({ message: "Habit already completed today" });
    }

    // Add to history
    habit.history.push({ date: today, completed: true });

    // Update completedToday & lastCheckedDate
    habit.completedToday = true;
    habit.lastCheckedDate = today;

    // Update streak: increment if last completed was yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const lastHistory = habit.history[habit.history.length - 2]; // second last entry
    if (
      lastHistory &&
      new Date(lastHistory.date).toDateString() === yesterday.toDateString()
    ) {
      habit.streak += 1;
    } else {
      habit.streak = 1; // reset streak if missed days
    }

    await habit.save();

    res.json({
      id: habit._id,
      completedToday: habit.completedToday,
      streak: habit.streak,
      lastCheckedDate: habit.lastCheckedDate,
      history: habit.history,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating habit", error: error.message });
  }
};

// habit.controller.js
export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findByIdAndDelete(req.params.id);
    if (!habit) return res.status(404).json({ message: "Habit not found" });
    res.json({ message: "Habit deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting habit", error: error.message });
  }
};
