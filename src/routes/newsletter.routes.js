import express from "express";
import {
  sendNewsletterUpdate,
  subscribeNewsletter,
} from "../controllers/newsletter.controller.js";

const router = express.Router();

router.post("/subscribe", subscribeNewsletter); // for users
router.post("/send-update", sendNewsletterUpdate); // for admin use

export default router;
