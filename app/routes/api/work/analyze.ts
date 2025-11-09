/**
 * Video Analysis API
 * 
 * POST /api/work/analyze
 * - 워크플로우 생성 및 AI 분석 시작
 */

import type { Route } from "./+types/analyze";
import db from "~/core/db/drizzle-client.server";
import { workVideos } from "~/features/work/upload/schema";
import { workWorkflows } from "~/features/work/business-logic/schema";
import { workWorkflowMembers } from "~/features/work/team-management/schema";
import { eq } from "drizzle-orm";
import makeServerClient from "~/core/lib/supa-client.server";
import { analyzeVideoInBackground } from "~/features/work/services/video-analyzer.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const [supabase, headers] = makeServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const { video_id } = await request.json();

    // 비디오 조회
    const video = await db.query.workVideos.findFirst({
      where: eq(workVideos.video_id, video_id),
    });

    if (!video) {
      return Response.json({ error: "Video not found" }, { status: 404, headers });
    }

    if (video.owner_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403, headers });
    }

    // 워크플로우 생성
    const [workflow] = await db
      .insert(workWorkflows)
      .values({
        owner_id: user.id,
        title: video.title || "새 업무 프로세스",
        description: `${video.original_filename}에서 자동 생성된 업무 프로세스`,
        source_video_id: video.video_id,
        duration_seconds: video.duration_seconds,
        thumbnail_url: video.thumbnail_url,
        status: "analyzing",
        requested_at: new Date(),
      })
      .returning();

    // 생성자를 admin 멤버로 자동 추가
    await db.insert(workWorkflowMembers).values({
      workflow_id: workflow.workflow_id,
      user_id: user.id,
      role: "admin",
      status: "active",
      joined_at: new Date(),
    });

    // 비디오 상태 업데이트
    await db
      .update(workVideos)
      .set({ status: "uploading" })
      .where(eq(workVideos.video_id, video_id));

    // 백그라운드 AI 분석 시작
    analyzeVideoInBackground(video.video_id, workflow.workflow_id);

    return Response.json(
      {
        success: true,
        workflow_id: workflow.workflow_id,
        workflow,
      },
      { headers },
    );
  } catch (error) {
    console.error("Analysis start error:", error);
    return Response.json(
      {
        error: "Failed to start analysis",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers },
    );
  }
}
