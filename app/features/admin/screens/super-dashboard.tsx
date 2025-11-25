import { and, desc, eq } from "drizzle-orm";
import { data, redirect } from "react-router";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/core/components/ui/table";
import { profiles } from "~/features/users/schema";

import { adminActivityLogs, adminDailyStats } from "../schema";

export async function loader({ request }: any) {
  const [{ default: makeServerClient }, { default: db }] = await Promise.all([
    import("~/core/lib/supa-client.server"),
    import("~/core/db/drizzle-client.server"),
  ]);
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw redirect("/login");
  }

  const [profile] = await db
    .select({ is_super_admin: profiles.is_super_admin })
    .from(profiles)
    .where(eq(profiles.profile_id, user.id as any))
    .limit(1);

  if (!profile?.is_super_admin) {
    throw data({ error: "Forbidden" }, { status: 403 });
  }

  const [latestStats] = await db
    .select()
    .from(adminDailyStats)
    .orderBy(desc(adminDailyStats.stat_date))
    .limit(1);

  const recentLogs = await db
    .select()
    .from(adminActivityLogs)
    .orderBy(desc(adminActivityLogs.occurred_at))
    .limit(20);

  return {
    stats: latestStats ?? null,
    logs: recentLogs,
  };
}

export default function SuperDashboard({ loaderData }: any) {
  const { stats, logs } = loaderData;

  return (
    <div className="container mx-auto max-w-6xl space-y-8 py-8">
      <h1 className="text-3xl font-bold">관리자 대시보드</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>전체 사용자 수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.total_users ?? "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>전체 워크플로우 수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats?.total_workflows ?? "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>전체 분석 요청 수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.total_analyses ?? "-"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 활동 로그</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              표시할 로그가 없습니다.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>발생 시각</TableHead>
                    <TableHead>사용자 ID</TableHead>
                    <TableHead>이벤트 타입</TableHead>
                    <TableHead>상세</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.occurred_at).toLocaleString("ko-KR")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.user_id ?? "-"}
                      </TableCell>
                      <TableCell>{log.event_type}</TableCell>
                      <TableCell className="max-w-xs truncate text-xs">
                        {log.detail ?? ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
