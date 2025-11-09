-- ============================================================
-- Pricing Plans Schema
-- ============================================================
-- This migration creates tables for managing pricing plans and features

-- Pricing Plans Table
CREATE TABLE IF NOT EXISTS pricing_plans (
  plan_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL, -- 월 가격 (원 단위)
  price_yearly INTEGER, -- 연 가격 (원 단위, NULL이면 월 결제만)
  currency VARCHAR(10) DEFAULT 'KRW',
  is_popular BOOLEAN DEFAULT false, -- 인기 플랜 표시
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pricing Plan Features Table
CREATE TABLE IF NOT EXISTS pricing_plan_features (
  feature_id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES pricing_plans(plan_id) ON DELETE CASCADE,
  feature_name VARCHAR(255) NOT NULL,
  feature_value TEXT, -- 예: "무제한", "10GB", "5명"
  is_included BOOLEAN DEFAULT true, -- 포함 여부
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_plans_active ON pricing_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_plan_features_plan ON pricing_plan_features(plan_id);

-- Updated At Trigger
CREATE OR REPLACE FUNCTION update_pricing_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_plans_updated_at
  BEFORE UPDATE ON pricing_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_plans_updated_at();

-- Seed Data
INSERT INTO pricing_plans (name, description, price_monthly, price_yearly, is_popular, display_order) VALUES
('Free', '개인 사용자를 위한 무료 플랜', 0, 0, false, 1),
('Pro', '소규모 팀을 위한 전문가 플랜', 29000, 290000, true, 2),
('Enterprise', '대규모 조직을 위한 기업 플랜', 99000, 990000, false, 3);

-- Free Plan Features
INSERT INTO pricing_plan_features (plan_id, feature_name, feature_value, display_order) VALUES
((SELECT plan_id FROM pricing_plans WHERE name = 'Free'), '동영상 분석', '월 3개', 1),
((SELECT plan_id FROM pricing_plans WHERE name = 'Free'), '저장 공간', '1GB', 2),
((SELECT plan_id FROM pricing_plans WHERE name = 'Free'), 'AI 분석 정확도', '기본', 3),
((SELECT plan_id FROM pricing_plans WHERE name = 'Free'), '팀 멤버', '1명', 4),
((SELECT plan_id FROM pricing_plans WHERE name = 'Free'), '기술 지원', '커뮤니티', 5);

-- Pro Plan Features
INSERT INTO pricing_plan_features (plan_id, feature_name, feature_value, display_order) VALUES
((SELECT plan_id FROM pricing_plans WHERE name = 'Pro'), '동영상 분석', '월 50개', 1),
((SELECT plan_id FROM pricing_plans WHERE name = 'Pro'), '저장 공간', '50GB', 2),
((SELECT plan_id FROM pricing_plans WHERE name = 'Pro'), 'AI 분석 정확도', '고급', 3),
((SELECT plan_id FROM pricing_plans WHERE name = 'Pro'), '팀 멤버', '10명', 4),
((SELECT plan_id FROM pricing_plans WHERE name = 'Pro'), '프로세스 내보내기', '포함', 5),
((SELECT plan_id FROM pricing_plans WHERE name = 'Pro'), '기술 지원', '이메일 지원', 6);

-- Enterprise Plan Features
INSERT INTO pricing_plan_features (plan_id, feature_name, feature_value, display_order) VALUES
((SELECT plan_id FROM pricing_plans WHERE name = 'Enterprise'), '동영상 분석', '무제한', 1),
((SELECT plan_id FROM pricing_plans WHERE name = 'Enterprise'), '저장 공간', '무제한', 2),
((SELECT plan_id FROM pricing_plans WHERE name = 'Enterprise'), 'AI 분석 정확도', '프리미엄', 3),
((SELECT plan_id FROM pricing_plans WHERE name = 'Enterprise'), '팀 멤버', '무제한', 4),
((SELECT plan_id FROM pricing_plans WHERE name = 'Enterprise'), '프로세스 내보내기', '포함', 5),
((SELECT plan_id FROM pricing_plans WHERE name = 'Enterprise'), 'API 접근', '포함', 6),
((SELECT plan_id FROM pricing_plans WHERE name = 'Enterprise'), '전담 매니저', '포함', 7),
((SELECT plan_id FROM pricing_plans WHERE name = 'Enterprise'), '기술 지원', '24/7 우선 지원', 8);
