-- ============================================================
-- Add is_demo flag to work_workflows
-- ============================================================
-- This allows us to mark certain workflows as demo data

ALTER TABLE work_workflows 
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- Create index for faster demo workflow queries
CREATE INDEX IF NOT EXISTS idx_work_workflows_is_demo ON work_workflows(is_demo) WHERE is_demo = true;

COMMENT ON COLUMN work_workflows.is_demo IS '데모 페이지에서 사용되는 샘플 워크플로우 여부';
