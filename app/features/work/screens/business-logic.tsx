import type { Route } from "./+types/business-logic";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "업무로직" },
    { name: "description", content: "업무로직 관리 페이지" },
  ];
}

export default function BusinessLogic() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">업무로직</h1>
      <div className="bg-card rounded-lg border p-6">
        <p className="text-muted-foreground">
          업무로직 관리 페이지입니다. 여기에 업무 로직 관련 기능을 추가할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
