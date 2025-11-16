import { useEffect, useState } from "react";
import { redirect, useParams, useNavigate } from "react-router";
import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Alert, AlertDescription } from "~/core/components/ui/alert";
import { CheckCircle, XCircle, Clock, Users } from "lucide-react";

import makeServerClient from "~/core/lib/supa-client.server";

export async function loader({ request }: { request: Request }) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname + url.search)}`);
  }
  return null;
}

interface InviteInfo {
  team: {
    team_id: string;
    name: string;
    description: string | null;
  };
  invite: {
    email: string;
    role: string;
    expires_at: string;
    is_expired: boolean;
    is_accepted: boolean;
  };
}

export default function TeamInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    async function loadInvite() {
      try {
        const res = await fetch(`/api/teams/invites/${token}`);
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "초대 정보를 불러올 수 없습니다");
          return;
        }
        const data = await res.json();
        setInviteInfo(data);
      } catch (e) {
        setError("초대 정보를 불러오는 중 오류가 발생했습니다");
      } finally {
        setLoading(false);
      }
    }

    loadInvite();
  }, [token]);

  async function handleAccept() {
    if (!token) return;

    setAccepting(true);
    setError(null);

    try {
      const res = await fetch(`/api/teams/invites/${token}/accept`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "초대 수락에 실패했습니다");
        return;
      }

      const data = await res.json();
      setSuccess(true);

      // 3초 후 팀 관리 페이지로 이동
      setTimeout(() => {
        navigate(`/work/team-management?team=${data.team_id}`);
      }, 3000);
    } catch (e) {
      setError("초대 수락 중 오류가 발생했습니다");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="ml-3 text-muted-foreground">초대 정보 확인 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !inviteInfo) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>초대를 찾을 수 없습니다</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || "유효하지 않은 초대 링크입니다"}</AlertDescription>
            </Alert>
            <Button onClick={() => navigate("/work")} className="mt-4 w-full">
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <CardTitle>팀 가입 완료!</CardTitle>
            </div>
            <CardDescription>
              {inviteInfo.team.name}에 성공적으로 가입되었습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                잠시 후 팀 관리 페이지로 이동합니다...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { team, invite } = inviteInfo;

  if (invite.is_accepted) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>이미 수락된 초대</CardTitle>
            <CardDescription>이 초대는 이미 수락되었습니다</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/work/team-management?team=${team.team_id}`)} className="w-full">
              팀 관리로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite.is_expired) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>만료된 초대</CardTitle>
            </div>
            <CardDescription>이 초대는 만료되었습니다</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                초대 링크가 만료되었습니다. 팀 관리자에게 새 초대를 요청하세요.
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate("/work")} className="mt-4 w-full">
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <CardTitle>팀 초대</CardTitle>
          </div>
          <CardDescription>팀에 초대되었습니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{team.name}</h3>
            {team.description && (
              <p className="text-sm text-muted-foreground">{team.description}</p>
            )}
          </div>

          <div className="space-y-2 rounded-lg bg-muted p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">초대 이메일:</span>
              <span className="font-medium">{invite.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">역할:</span>
              <span className="font-medium">
                {invite.role === "owner"
                  ? "소유자"
                  : invite.role === "admin"
                    ? "관리자"
                    : "사용자"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">만료일:</span>
              <span className="font-medium">
                {new Date(invite.expires_at).toLocaleDateString("ko-KR")}
              </span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1"
            >
              {accepting ? "처리 중..." : "초대 수락"}
            </Button>
            <Button
              onClick={() => navigate("/work")}
              variant="outline"
              disabled={accepting}
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
