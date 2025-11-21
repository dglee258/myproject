import type { ActionFunctionArgs } from "react-router";

import { data } from "react-router";

import adminClient from "~/core/lib/supa-admin-client.server";
import makeServerClient from "~/core/lib/supa-client.server";

export async function action({ request }: ActionFunctionArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return data({ error: "No file provided" }, { status: 400 });
    }

    // 파일 크기 검증 (50MB 제한)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return data(
        {
          error: "File size exceeds 50MB limit. Please choose a smaller file.",
        },
        { status: 400 },
      );
    }

    // 파일 타입 검증
    if (!file.type.startsWith("video/")) {
      return data(
        {
          error:
            "Only video files are allowed. Please choose a valid video file.",
        },
        { status: 400 },
      );
    }

    // Admin client로 업로드 (RLS 우회)
    const path = `${user.id}/${Date.now()}_${file.name}`;

    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from("work-videos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return data({ error: uploadError.message }, { status: 500 });
    }

    return data({
      success: true,
      path: uploadData.path,
      fullPath: uploadData.fullPath,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return data({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
