import axios from "axios";
import env from "../config/env.js";

const DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_API_KEY) {
  throw new Error("DeepSeek API key is missing. Set DEEPSEEK_API_KEY in .env");
}

export const getDeepSeekResponse = async (message) => {
  try {
    const systemPrompt = `
      You are HabitMate AI. 
      You only provide advice on habit creation, habit improvement, fitness, productivity, and related topics. 
      Never answer outside of habits or fitness.
      If user asks you to create a habit, respond with a JSON object like:
      {
        "habitName": "<name>",
        "goal": "<goal>",
        "category": "<category>"
      }.
      Always include a friendly human-readable response explaining why this habit is useful in the field.
      Respond in this JSON format:
      {
        "humanReply": "<your explanation text>",
        "habitJson": {
          "habitName": "<name>",
          "goal": "<goal>",
          "category": "<category>"
        }
      }
      If the user only asks for advice but no habit, return "habitJson": null.
    `;

    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let aiRaw = response.data.choices[0].message.content;

    // Ensure always returns JSON object with humanReply + habitJson
    if (typeof aiRaw === "string") {
      try {
        const parsed = JSON.parse(aiRaw);
        return parsed;
      } catch (err) {
        return { humanReply: aiRaw, habitJson: null };
      }
    }

    return aiRaw;
  } catch (error) {
    console.error("DeepSeek API error:", error.response?.data || error.message);
    throw new Error("Failed to get response from DeepSeek");
  }
};
