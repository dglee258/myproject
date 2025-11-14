import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// .env 파일 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env") });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set");
  process.exit(1);
}

try {
  console.log("Fetching available Gemini models...\n");
  
  // REST API로 모델 목록 가져오기
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  console.log("Available models:");
  console.log("=================\n");
  
  if (data.models) {
    for (const model of data.models) {
      console.log(`Name: ${model.name}`);
      console.log(`Display Name: ${model.displayName || "N/A"}`);
      console.log(`Description: ${model.description || "N/A"}`);
      console.log(`Supported Methods: ${model.supportedGenerationMethods?.join(", ") || "N/A"}`);
      console.log("---\n");
    }
  } else {
    console.log("No models found");
  }
} catch (error) {
  console.error("Error listing models:", error.message);
  process.exit(1);
}
