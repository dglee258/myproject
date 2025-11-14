-- Add screenshot_url column to work_analysis_steps
ALTER TABLE work_analysis_steps ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
