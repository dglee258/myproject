-- ============================================================
-- Service Page Content Management
-- ============================================================
-- Manage service page content without code deployment

-- Service Sections (Hero, Features, etc.)
CREATE TABLE IF NOT EXISTS service_sections (
  section_id SERIAL PRIMARY KEY,
  section_key VARCHAR(100) UNIQUE NOT NULL,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  badge_text VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Service Items (Features, Use Cases, How It Works steps)
CREATE TABLE IF NOT EXISTS service_items (
  item_id SERIAL PRIMARY KEY,
  section_key VARCHAR(100) NOT NULL,
  item_type VARCHAR(50) NOT NULL, -- 'feature', 'use_case', 'step'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100), -- emoji or icon name
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_sections_key ON service_sections(section_key);
CREATE INDEX IF NOT EXISTS idx_service_sections_active ON service_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_service_items_section ON service_items(section_key);
CREATE INDEX IF NOT EXISTS idx_service_items_type ON service_items(item_type);

-- Updated At Trigger
CREATE OR REPLACE FUNCTION update_service_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_sections_updated_at
  BEFORE UPDATE ON service_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_service_sections_updated_at();

-- Seed initial content
-- Hero Section
INSERT INTO service_sections (section_key, title, subtitle, description, badge_text, display_order) VALUES
('hero', '동영상 하나로', '업무 프로세스가 완성됩니다', '업무 화면을 녹화만 하세요. AI가 자동으로 분석하여 단계별 프로세스 문서를 만들어드립니다', 'AI 업무 프로세스 자동화', 1),
('how_it_works', '어떻게 작동하나요?', '', '3단계로 업무 프로세스 문서화가 완성됩니다', '', 2),
('key_features', '핵심 기능', '', '업무 프로세스 관리에 필요한 모든 기능을 제공합니다', '', 3),
('use_cases', '이런 업무에 활용하세요', '', '다양한 업무 프로세스를 빠르게 문서화할 수 있습니다', '', 4),
('cta', '지금 바로 시작해보세요', '', '로그인 없이 데모로 먼저 체험해보거나, 무료 플랜으로 시작할 수 있습니다', '', 5)
ON CONFLICT (section_key) DO NOTHING;

-- How It Works Steps
INSERT INTO service_items (section_key, item_type, title, description, icon, display_order) VALUES
('how_it_works', 'step', '동영상 업로드', '업무 화면을 녹화한 동영상을 업로드하세요.', 'FileVideo', 1),
('how_it_works', 'step', 'AI 자동 분석', 'AI가 동영상을 분석하여 클릭, 입력, 이동 등의 작업을 자동으로 인식합니다.', 'Bot', 2),
('how_it_works', 'step', '프로세스 문서 완성', '단계별로 정리된 업무 프로세스가 완성됩니다. 팀원들과 공유하고 메모를 추가하여 더욱 상세하게 만들 수 있습니다.', 'CheckCircle2', 3);

-- Key Features
INSERT INTO service_items (section_key, item_type, title, description, icon, display_order) VALUES
('key_features', 'feature', 'AI 자동 분석', '동영상에서 업무 단계를 자동으로 추출하고 분류합니다', 'Sparkles', 1),
('key_features', 'feature', '단계별 문서화', '클릭, 입력, 이동 등 각 단계를 시간순으로 정리합니다', '📝', 2),
('key_features', 'feature', '팀 협업', '팀원들과 프로세스를 공유하고 함께 수정할 수 있습니다', 'Users', 3),
('key_features', 'feature', '메모 추가', '각 단계에 주의사항이나 팁을 메모로 남길 수 있습니다', 'Lightbulb', 4);

-- Use Cases
INSERT INTO service_items (section_key, item_type, title, description, icon, display_order) VALUES
('use_cases', 'use_case', '주문 처리 프로세스', '고객 주문 접수부터 배송 완료까지의 전 과정을 단계별로 문서화하여 신입 직원 교육에 활용', '📦', 1),
('use_cases', 'use_case', '회원 관리 절차', '회원 가입 승인, 정보 수정, 탈퇴 처리 등 회원 관리 업무의 표준 프로세스 수립', '👥', 2),
('use_cases', 'use_case', '정산 업무', '매출 집계, 수수료 계산, 입금 처리 등 복잡한 정산 업무를 명확하게 문서화', '💰', 3),
('use_cases', 'use_case', '시스템 사용법', 'ERP, CRM 등 사내 시스템의 사용 방법을 단계별로 정리하여 매뉴얼 제작', '🎓', 4);

COMMENT ON TABLE service_sections IS '서비스 페이지의 각 섹션 콘텐츠';
COMMENT ON TABLE service_items IS '서비스 페이지의 섹션별 아이템 (기능, 사용 사례, 단계)';
