-- Service sections table
CREATE TABLE IF NOT EXISTS "service_sections" (
    "section_id" serial PRIMARY KEY NOT NULL,
    "section_key" varchar(100) NOT NULL UNIQUE,
    "title" text,
    "subtitle" text,
    "description" text,
    "badge_text" varchar(100),
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Service items table
CREATE TABLE IF NOT EXISTS "service_items" (
    "item_id" serial PRIMARY KEY NOT NULL,
    "section_key" varchar(100) NOT NULL,
    "item_type" varchar(50) NOT NULL,
    "title" varchar(255) NOT NULL,
    "description" text,
    "icon" varchar(100),
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Insert sample data for service sections
INSERT INTO "service_sections" ("section_key", "title", "subtitle", "description", "badge_text", "display_order") VALUES
('hero', '업무 동영상을', '프로세스 문서로 변환합니다', '업무 화면을 녹화하면 AI가 단계별 프로세스를 자동으로 추출하여 문서화해드립니다', 'AI 기반 업무 자동화', 1),
('how_it_works', '어떻게 작동하나요?', NULL, '간단한 3단계로 업무 프로세스 문서가 완성됩니다', NULL, 2),
('key_features', '주요 기능', NULL, '업무 프로세스 문서화에 필요한 핵심 기능들을 제공합니다', NULL, 3),
('use_cases', '이런 업무에 활용하세요', NULL, '반복적인 업무 절차를 체계적으로 문서화할 수 있습니다', NULL, 4),
('cta', '지금 바로 시작해보세요', NULL, '로그인 없이 데모로 체험해보거나, 무료 플랜으로 시작할 수 있습니다', NULL, 5)
ON CONFLICT ("section_key") DO NOTHING;

-- Insert sample data for how_it_works items
INSERT INTO "service_items" ("section_key", "item_type", "title", "description", "icon", "display_order") VALUES
('how_it_works', 'step', '동영상 업로드', '업무 화면을 녹화하거나 MP4, MOV 등 동영상 파일을 업로드합니다 (최대 50MB)', 'FileVideo', 1),
('how_it_works', 'step', 'AI 단계 추출', 'AI가 클릭, 입력, 이동 등 업무 단계를 자동으로 인식하고 타임스탬프를 기록합니다', 'Bot', 2),
('how_it_works', 'step', '프로세스 공유', '생성된 단계별 프로세스를 팀원들과 공유하고 메모를 추가할 수 있습니다', 'CheckCircle2', 3)
ON CONFLICT DO NOTHING;

-- Insert sample data for key_features items
INSERT INTO "service_items" ("section_key", "item_type", "title", "description", "icon", "display_order") VALUES
('key_features', 'feature', 'AI 단계 추출', '동영상에서 클릭, 입력, 이동 등 업무 단계를 자동으로 인식하고 분류합니다', 'Sparkles', 1),
('key_features', 'feature', '타임스탬프 기록', '각 단계별 정확한 시간 정보를 제공하여 특정 순간을 쉽게 찾을 수 있습니다', '⏰', 2),
('key_features', 'feature', '단계별 메모', '각 업무 단계에 추가 설명이나 주의사항을 기록할 수 있습니다', '📝', 3),
('key_features', 'feature', '팀원 공유', '생성된 프로세스를 팀원들과 공유하고 함께 활용할 수 있습니다', 'Users', 4),
('key_features', 'feature', '스크린샷 캡처', '주요 단계별 스크린샷을 자동으로 저장하여 시각적 가이드를 제공합니다', '📸', 5),
('key_features', 'feature', '실시간 진행률', 'AI 분석 진행 상황을 실시간으로 확인할 수 있습니다', '📊', 6)
ON CONFLICT DO NOTHING;

-- Insert sample data for use_cases items
INSERT INTO "service_items" ("section_key", "item_type", "title", "description", "icon", "display_order") VALUES
('use_cases', 'use_case', '소프트웨어 교육', '신규 직원을 위한 프로그램 사용법을 단계별 가이드로 만들어보세요', '💻', 1),
('use_cases', 'use_case', '업무 매뉴얼', '반복적인 작업 절차를 문서화하여 표준화된 프로세스를 만드세요', '📋', 2),
('use_cases', 'use_case', '고객 지원', '자주 묻는 문제 해결 과정을 시각적으로 안내하여 지원 시간을 줄이세요', '🎧', 3),
('use_cases', 'use_case', '팀원 교류', '업무 노하우를 동료들과 공유하고 함께 프로세스를 개선해보세요', '👥', 4)
ON CONFLICT DO NOTHING;
