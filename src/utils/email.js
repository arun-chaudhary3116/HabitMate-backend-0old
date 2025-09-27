// src/utils/email.js
import { Resend } from "resend";
import env from "../config/env.js"; // make sure RESEND_API_KEY is in .env

const resend = new Resend(env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await resend.emails.send({
      from: "HabitMate <onboarding@resend.dev>",

      to,
      subject,
      html,
      text,
    });

    console.log("✅ Email sent via Resend:", info);
    return info;
  } catch (err) {
    console.error("❌ Error sending email with Resend:", err);
    throw err;
  }
};
