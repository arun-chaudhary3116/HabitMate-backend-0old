import { getDeepSeekResponse } from "../utils/deepseek.js";

export const chatWithDeepSeek = async (req, res) => {
  const { message } = req.body;

  if (!message)
    return res
      .status(400)
      .json({ success: false, message: "Message is required" });

  try {
    const aiResponse = await getDeepSeekResponse(message);

    // Expect AI to return: { humanReply: string, habitJson: object | null }
    let parsedResponse = aiResponse;
    if (typeof aiResponse === "string") {
      try {
        parsedResponse = JSON.parse(aiResponse);
      } catch (err) {
        parsedResponse = { humanReply: aiResponse, habitJson: null };
      }
    }

    const { humanReply, habitJson } = parsedResponse;

    res.json({ success: true, humanReply, habitJson });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
