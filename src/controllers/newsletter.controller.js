import { Newsletter } from "../models/newsletter.model.js";
import { sendEmail } from "../utils/email.js";

export const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const exists = await Newsletter.findOne({ email });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "Already subscribed" });
    }

    await Newsletter.create({ email });

    // ✅ send confirmation email
    await sendEmail({
      to: email,
      subject: "Thanks for subscribing!",
      html: `<p>You are now subscribed to HabitMate updates 🎉</p>`,
    });

    res.json({ success: true, message: "Subscribed successfully" });
  } catch (err) {
    console.error("Newsletter subscription error:", err);
    res.status(500).json({ success: false, message: "Failed to subscribe" });
  }
};

// ✅ Bulk update sender
export const sendNewsletterUpdate = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Subject and message are required" });
    }

    // Fetch all subscribers
    const subscribers = await Newsletter.find({}, "email");

    if (!subscribers.length) {
      return res
        .status(400)
        .json({ success: false, message: "No subscribers found" });
    }

    // Send email to each subscriber
    for (const sub of subscribers) {
      await sendEmail({
        to: sub.email,
        subject,
        html: `<p>${message}</p>`,
      });
    }

    res.json({
      success: true,
      message: `Newsletter sent to ${subscribers.length} subscribers`,
    });
  } catch (err) {
    console.error("sendNewsletterUpdate error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to send newsletter" });
  }
};
