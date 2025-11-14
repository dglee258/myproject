import { GoogleGenerativeAI } from "@google/generative-ai";
import { promises as fs } from "fs";

export type GeminiStep = {
  type: "click" | "input" | "navigate" | "wait" | "decision";
  action: string;
  description: string;
  confidence: number;
};

function makeClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenerativeAI(apiKey);
}

export async function analyzeFramesWithGemini(
  framePaths: string[],
  options?: { model?: string; promptExtras?: string }
): Promise<GeminiStep[]> {
  const genAI = makeClient();
  
  // 여러 모델을 fallback으로 시도
  const models = [
    options?.model ?? "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
  ];

  // 이미지 파트 구성
  const imageParts = await Promise.all(
    framePaths.map(async (p) => ({
      inlineData: {
        mimeType: "image/jpeg",
        data: (await fs.readFile(p)).toString("base64"),
      },
    }))
  );

  const prompt = `당신은 UI 작업 과정을 분석하는 전문가입니다.
다음 이미지들은 시간 순서대로 캡처된 화면입니다.
이미지를 종합하여 사용자가 수행한 업무 단계를 JSON으로만 출력하세요. 여분의 텍스트는 금지합니다.
JSON 스키마:
{
  "steps": [
    {
      "type": "click|input|navigate|wait|decision",
      "action": "한 줄 요약",
      "description": "2-3줄 설명",
      "confidence": 0-100
    }
  ]
}
${options?.promptExtras ?? ""}`;

  // 모델을 순서대로 시도
  let lastError: Error | null = null;
  for (const modelName of models) {
    try {
      console.log(`[Gemini] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent([
        ...imageParts,
        prompt,
      ]);

      // 응답 본문에서 JSON만 추출
      const text = result.response.text();
      const json = extractJson(text);
      if (!json?.steps || !Array.isArray(json.steps)) {
        throw new Error("Invalid JSON format from Gemini");
      }
      
      console.log(`[Gemini] Successfully used model: ${modelName}`);
      return json.steps as GeminiStep[];
    } catch (error: any) {
      console.warn(`[Gemini] Model ${modelName} failed:`, error.message);
      lastError = error;
      
      // 503 에러가 아니면 더 이상 시도하지 않음
      if (error.status && error.status !== 503) {
        throw error;
      }
      
      // 다음 모델 시도 전 짧은 대기
      if (models.indexOf(modelName) < models.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // 모든 모델 실패
  throw lastError || new Error("All Gemini models failed");
}

function extractJson(text: string) {
  try {
    // ```json ... ``` 코드블록 포맷 처리
    const codeBlock = text.match(/```json[\s\S]*?```/i);
    if (codeBlock) {
      const inner = codeBlock[0].replace(/```json/i, "").replace(/```/g, "");
      return JSON.parse(inner);
    }
    // 일반 텍스트에 JSON만 있을 경우
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      const slice = text.slice(firstBrace, lastBrace + 1);
      return JSON.parse(slice);
    }
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Failed to parse JSON from Gemini response");
  }
}
