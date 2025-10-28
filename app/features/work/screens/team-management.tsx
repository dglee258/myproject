import type { Route } from "./+types/team-management";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "팀원관리" },
    { name: "description", content: "팀원 관리 페이지" },
  ];
}

export default function TeamManagement() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">팀원관리</h1>
      <div className="bg-card rounded-lg border p-6">
        <p className="text-muted-foreground">
          팀원 관리 페이지입니다. 여기에 팀원 관리 기능을 추가할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
