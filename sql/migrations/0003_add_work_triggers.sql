/**
 * Work Feature Triggers
 * 
 * This migration adds triggers for automatic timestamp updates on work tables.
 * The set_updated_at() function should already exist from previous migrations.
 */

-- Trigger: Auto-update updated_at on work_videos
CREATE TRIGGER set_updated_at_work_videos
BEFORE UPDATE ON work_videos
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Trigger: Auto-update updated_at on work_workflows
CREATE TRIGGER set_updated_at_work_workflows
BEFORE UPDATE ON work_workflows
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Trigger: Auto-update updated_at on work_analysis_steps
CREATE TRIGGER set_updated_at_work_analysis_steps
BEFORE UPDATE ON work_analysis_steps
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Trigger: Auto-update updated_at on work_workflow_members
CREATE TRIGGER set_updated_at_work_workflow_members
BEFORE UPDATE ON work_workflow_members
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Trigger: Auto-update updated_at on work_workflow_invites
CREATE TRIGGER set_updated_at_work_workflow_invites
BEFORE UPDATE ON work_workflow_invites
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

/**
 * Optional: Auto-add workflow owner as admin member
 * 
 * This trigger automatically adds the workflow creator as an admin member
 * when a new workflow is created.
 */
CREATE OR REPLACE FUNCTION public.auto_add_workflow_owner()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
BEGIN
  -- Add the owner as an admin member
  INSERT INTO public.work_workflow_members (
    workflow_id,
    user_id,
    role,
    status,
    joined_at
  ) VALUES (
    NEW.workflow_id,
    NEW.owner_id,
    'admin',
    'active',
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Trigger: Auto-add owner as admin member when workflow is created
CREATE TRIGGER auto_add_workflow_owner_trigger
AFTER INSERT ON work_workflows
FOR EACH ROW
EXECUTE FUNCTION public.auto_add_workflow_owner();
