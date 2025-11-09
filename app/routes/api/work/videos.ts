/**
 * Video Upload API
 * 
 * POST /api/work/videos
 * - Supabase Storage에 업로드된 비디오의 메타데이터를 DB에 저장
 */

import type { Route } from "./+types/videos";
import db from "~/core/db/drizzle-client.server";
import { workVideos } from "~/features/work/upload/schema";
import makeServerClient from "~/core/lib/supa-client.server";

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
    const body = await request.json();
    const {
      title,
      original_filename,
      mime_type,
      file_size,
      storage_path,
      duration_seconds,
      thumbnail_url,
      preview_url,
    } = body;

    // DB에 비디오 레코드 생성
    const [video] = await db
      .insert(workVideos)
      .values({
        owner_id: user.id,
        title: title || original_filename?.replace(/\.[^/.]+$/, ""),
        original_filename,
        mime_type,
        file_size: file_size ? Number(file_size) : null,
        storage_path,
        duration_seconds,
        thumbnail_url,
        preview_url,
        status: "idle",
        progress: 0,
        requested_at: new Date(),
      })
      .returning();

    return Response.json(
      {
        success: true,
        video_id: video.video_id,
        video,
      },
      { headers },
    );
  } catch (error) {
    console.error("Video creation error:", error);
    return Response.json(
      {
        error: "Failed to create video record",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers },
    );
  }
}
