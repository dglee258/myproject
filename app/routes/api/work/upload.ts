import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import makeServerClient from "~/core/lib/supa-client.server";
import adminClient from "~/core/lib/supa-admin-client.server";

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

    // Admin client로 업로드 (RLS 우회)
    const path = `${user.id}/${Date.now()}_${file.name}`;
    
    const { data: uploadData, error: uploadError } = await adminClient
      .storage
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
