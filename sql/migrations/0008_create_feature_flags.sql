-- ============================================================
-- Feature Flags System
-- ============================================================
-- Manage feature availability without code deployment

CREATE TABLE IF NOT EXISTS feature_flags (
  flag_id SERIAL PRIMARY KEY,
  feature_key VARCHAR(100) UNIQUE NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  disabled_message VARCHAR(255) DEFAULT '추후 공개 예정',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

-- Updated At Trigger
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_flags_updated_at();

-- Seed initial feature flags
INSERT INTO feature_flags (feature_key, feature_name, description, is_enabled, disabled_message, sort_order) VALUES
-- 회원가입은 활성화
('signup', '회원가입', '무료 회원가입 기능', true, '', 1),

-- 나머지는 비활성화
('demo', '데모 체험', '로그인 없이 데모 체험', false, '추후 공개 예정', 2),
('pricing_view', '가격 보기', '요금제 페이지 보기', false, '추후 공개 예정', 3),
('contact', '문의하기', '문의 폼 제출', false, '추후 공개 예정', 4),

-- 서비스 페이지의 CTA 버튼들
('service_demo_cta', '서비스 페이지 - 데모 체험', '서비스 페이지의 데모 체험 버튼', false, '준비 중입니다', 5),
('service_pricing_cta', '서비스 페이지 - 요금제 보기', '서비스 페이지의 요금제 버튼', false, '준비 중입니다', 6)

ON CONFLICT (feature_key) DO NOTHING;

COMMENT ON TABLE feature_flags IS '기능별 활성화/비활성화 상태를 관리하는 테이블';
COMMENT ON COLUMN feature_flags.feature_key IS '기능의 고유 키 (코드에서 참조)';
COMMENT ON COLUMN feature_flags.is_enabled IS 'true: 활성화, false: 비활성화';
COMMENT ON COLUMN feature_flags.disabled_message IS '비활성화 시 표시할 메시지';
