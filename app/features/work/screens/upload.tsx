import type { Route } from "./+types/upload";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "업로드" },
    { name: "description", content: "파일 업로드 페이지" },
  ];
}

export default function Upload() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">업로드</h1>
      <div className="bg-card rounded-lg border p-6">
        <p className="text-muted-foreground">
          파일 업로드 페이지입니다. 여기에 파일 업로드 기능을 추가할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
