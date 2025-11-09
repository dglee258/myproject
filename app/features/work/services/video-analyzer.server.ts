/**
 * Video Analysis Service
 * 
 * 동영상을 분석하여 업무 프로세스 단계를 자동 생성합니다.
 * 
 * TODO: 실제 AI 분석 엔진 연동 필요
 * - GPT-4 Vision API
 * - Google Cloud Video Intelligence
 * - 또는 커스텀 AI 모델
 */

import db from "~/core/db/drizzle-client.server";
import { workAnalysisSteps } from "~/features/work/business-logic/schema";
import { workVideos } from "~/features/work/upload/schema";
import { workWorkflows } from "~/features/work/business-logic/schema";
import { eq } from "drizzle-orm";

interface VideoAnalysisResult {
  type: "click" | "input" | "navigate" | "wait" | "decision";
  action: string;
  description: string;
  confidence: number;
  timestamp_seconds: number;
}

/**
 * 백그라운드에서 비디오 분석 시작
 * 실제 환경에서는 큐 시스템(Inngest, BullMQ) 사용 권장
 */
export async function analyzeVideoInBackground(
  videoId: number,
  workflowId: number,
): Promise<void> {
  // 비동기로 분석 시작 (큐에 추가하는 대신 setTimeout 사용)
  // 프로덕션에서는 Inngest, BullMQ 등 사용
  setTimeout(async () => {
    try {
      console.log(
        `[Video Analyzer] Starting analysis for video ${videoId}, workflow ${workflowId}`,
      );

      // 1. 비디오 상태 업데이트
      await db
        .update(workVideos)
        .set({ status: "processing", progress: 10 })
        .where(eq(workVideos.video_id, videoId));

      // 2. 비디오 정보 조회
      const video = await db.query.workVideos.findFirst({
        where: eq(workVideos.video_id, videoId),
      });

      if (!video) {
        throw new Error("Video not found");
      }

      // 3. AI 분석 실행 (현재는 Mock 데이터)
      const analysisResults = await performAIAnalysis(video.storage_path);

      // 4. 분석 단계 저장
      const steps = analysisResults.map((result, index) => ({
        workflow_id: workflowId,
        sequence_no: index + 1,
        type: result.type,
        action: result.action,
        description: result.description,
        timestamp_label: formatTimestamp(result.timestamp_seconds),
        timestamp_seconds: result.timestamp_seconds,
        confidence: result.confidence,
      }));

      await db.insert(workAnalysisSteps).values(steps);

      // 5. 완료 상태 업데이트
      await db
        .update(workWorkflows)
        .set({
          status: "analyzed",
          completed_at: new Date(),
        })
        .where(eq(workWorkflows.workflow_id, workflowId));

      await db
        .update(workVideos)
        .set({
          status: "completed",
          progress: 100,
          completed_at: new Date(),
        })
        .where(eq(workVideos.video_id, videoId));

      console.log(
        `[Video Analyzer] Analysis completed for workflow ${workflowId}`,
      );
    } catch (error) {
      console.error("[Video Analyzer] Error:", error);

      // 에러 상태 업데이트
      await db
        .update(workWorkflows)
        .set({ status: "pending" })
        .where(eq(workWorkflows.workflow_id, workflowId));

      await db
        .update(workVideos)
        .set({
          status: "error",
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .where(eq(workVideos.video_id, videoId));
    }
  }, 100);
}

/**
 * AI 분석 실행 (Mock 구현)
 * 
 * 실제 구현 시:
 * 1. FFmpeg로 키프레임 추출
 * 2. GPT-4 Vision 또는 다른 AI로 각 프레임 분석
 * 3. OCR로 텍스트 추출
 * 4. 액션 추론 및 단계 생성
 */
async function performAIAnalysis(
  storagePath: string | null,
): Promise<VideoAnalysisResult[]> {
  // TODO: 실제 AI 분석 로직 구현
  // - Supabase Storage에서 비디오 다운로드
  // - FFmpeg로 프레임 추출
  // - AI API 호출 (GPT-4 Vision, Google Cloud Video AI 등)
  // - 결과 파싱 및 반환

  console.log(`[Video Analyzer] Analyzing video from path: ${storagePath}`);

  // Mock 분석 (3초 대기)
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Mock 결과 반환
  return [
    {
      type: "navigate",
      action: "관리자 페이지 접속",
      description: "브라우저에서 관리자 대시보드 URL 입력 및 이동",
      confidence: 95,
      timestamp_seconds: 5,
    },
    {
      type: "input",
      action: "로그인 정보 입력",
      description: "이메일과 비밀번호 입력 필드에 인증 정보 작성",
      confidence: 98,
      timestamp_seconds: 12,
    },
    {
      type: "click",
      action: "로그인 버튼 클릭",
      description: "화면 하단의 '로그인' 버튼을 클릭하여 인증 진행",
      confidence: 99,
      timestamp_seconds: 18,
    },
    {
      type: "wait",
      action: "페이지 로딩 대기",
      description: "대시보드 페이지 로딩 완료까지 대기",
      confidence: 92,
      timestamp_seconds: 21,
    },
    {
      type: "navigate",
      action: "메뉴 선택",
      description: "좌측 사이드바에서 '업무 관리' 메뉴 클릭",
      confidence: 96,
      timestamp_seconds: 25,
    },
  ];
}

/**
 * 타임스탬프 포맷팅 (초 → MM:SS)
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * 실제 AI 분석 예시 (GPT-4 Vision)
 * 
 * 환경변수 필요: OPENAI_API_KEY
 */
/*
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function analyzeFrameWithGPT4Vision(
  frameBase64: string,
  timestamp: number
): Promise<VideoAnalysisResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `이 화면 캡처를 분석하여 사용자가 수행하는 업무 단계를 JSON으로 응답하세요:
{
  "type": "click|input|navigate|wait|decision",
  "action": "수행 액션 한 줄 요약",
  "description": "상세 설명 2-3줄",
  "confidence": 0-100
}`,
          },
          {
            type: "image_url",
            image_url: {
              url: \`data:image/jpeg;base64,\${frameBase64}\`,
            },
          },
        ],
      },
    ],
    max_tokens: 300,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return {
    ...result,
    timestamp_seconds: timestamp,
  };
}
*/
