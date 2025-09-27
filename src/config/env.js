import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load .env (outside src/)
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// Debug check
if (!process.env.DEEPSEEK_API_KEY) {
  console.error("❌ Missing DEEPSEEK_API_KEY in .env");
} else {
  console.log(
    "✅ DeepSeek key loaded:",
    process.env.DEEPSEEK_API_KEY.slice(0, 6) + "..."
  );
}

export default process.env;
