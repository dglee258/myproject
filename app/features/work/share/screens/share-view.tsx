import type { Route } from "./+types/share-view";
import { useEffect, useMemo, useState } from "react";
import { useLoaderData, useParams } from "react-router";
import { Card } from "~/core/components/ui/card";
import { Button } from "~/core/components/ui/button";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "공유된 업무 프로세스 보기" },
    { name: "description", content: "공유 토큰으로 임시 접근하여 업무 프로세스를 조회합니다" },
  ];
}

export async function loader({}: Route.LoaderArgs) {
  // 공개 페이지: 인증 불필요. 서버에서는 아무 것도 반환하지 않음
  return {};
}

export default function ShareView() {
  const params = useParams();
  const token = params["*"]?.split("/").pop() || params["token"]; // 라우팅 안전 처리
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // 탭 단위 세션 ID 생성 (세션 스토리지 사용)
  const sessionId = useMemo(() => {
    const key = "work-share-session";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = self.crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(key, id);
    }
    return id;
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setError("잘못된 공유 주소입니다.");
        setLoading(false);
        return;
      }
      try {
        // 1) 토큰 클레임 (세션 귀속)
        const claimRes = await fetch("/api/work/share/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, session_id: sessionId }),
        });
        if (!claimRes.ok && claimRes.status !== 409) {
          const j = await claimRes.json().catch(() => ({}));
          throw new Error(j.error || `클레임 실패(${claimRes.status})`);
        }
        // 2) 워크플로우 조회
        const res = await fetch(`/api/work/share/workflows/${token}`, {
          headers: { "x-share-session": sessionId },
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `조회 실패(${res.status})`);
        }
        const j = await res.json();
        setData(j.workflow);
        setLoading(false);
      } catch (e: any) {
        setError(e.message || "오류가 발생했습니다.");
        setLoading(false);
      }
    };
    run();
  }, [token, sessionId]);

  if (loading) return <div className="container mx-auto max-w-3xl p-6">불러오는 중...</div>;
  if (error) return <div className="container mx-auto max-w-3xl p-6 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">공유된 업무 프로세스</h1>
        <p className="text-muted-foreground">이 탭을 닫으면 접근 권한이 만료됩니다.</p>
      </div>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-2">{data?.title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{data?.description}</p>
        <div className="space-y-3">
          {(data?.steps || []).map((s: any) => (
            <div key={s.step_id} className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">#{s.sequence_no} • {s.type}</div>
              <div className="font-medium">{s.action}</div>
              <div className="text-sm">{s.description}</div>
              {s.timestamp_label && (
                <div className="text-xs text-muted-foreground">{s.timestamp_label}</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => window.print()} variant="outline">인쇄</Button>
        <Button onClick={() => window.close()} variant="secondary">탭 닫기</Button>
      </div>
    </div>
  );
}
