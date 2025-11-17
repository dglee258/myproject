DROP POLICY "select-steps" ON "work_analysis_steps" CASCADE;--> statement-breakpoint
DROP POLICY "select-workflows" ON "work_workflows" CASCADE;--> statement-breakpoint
CREATE POLICY "workflow-based-step-access" ON "work_analysis_steps" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        EXISTS (
          SELECT 1 FROM work_workflows w
          WHERE w.workflow_id = "work_analysis_steps"."workflow_id"
            AND (
              (select auth.uid()) = w.owner_id
              OR (
                w.team_id IS NOT NULL 
                AND EXISTS (
                  SELECT 1 FROM work_team_members tm
                  WHERE tm.team_id = w.team_id
                    AND tm.user_id = (select auth.uid())
                    AND tm.status = 'active'
                )
              )
            )
            OR EXISTS (
              SELECT 1 FROM work_workflow_members m
              WHERE m.workflow_id = w.workflow_id
                AND m.user_id = (select auth.uid())
                AND m.status = 'active'
            )
          )
        )
      );--> statement-breakpoint
CREATE POLICY "workflow-owner-edit-steps" ON "work_analysis_steps" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (
        EXISTS (
          SELECT 1 FROM work_workflows w
          WHERE w.workflow_id = "work_analysis_steps"."workflow_id"
            AND w.owner_id = (select auth.uid())
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM work_workflows w
          WHERE w.workflow_id = "work_analysis_steps"."workflow_id"
            AND w.owner_id = (select auth.uid())
        )
      );--> statement-breakpoint
CREATE POLICY "workflow-owner-full-access" ON "work_workflows" AS PERMISSIVE FOR ALL TO "authenticated" USING ((select auth.uid()) = "work_workflows"."owner_id") WITH CHECK ((select auth.uid()) = "work_workflows"."owner_id");--> statement-breakpoint
CREATE POLICY "team-members-access-workflows" ON "work_workflows" AS PERMISSIVE FOR SELECT TO "authenticated" USING (
        "work_workflows"."team_id" IS NOT NULL 
        AND EXISTS (
          SELECT 1 FROM work_team_members tm
          WHERE tm.team_id = "work_workflows"."team_id"
            AND tm.user_id = (select auth.uid())
            AND tm.status = 'active'
        OR (
          "work_workflows"."team_id" IS NOT NULL 
          AND EXISTS (
            SELECT 1 FROM work_team_members tm
            WHERE tm.team_id = "work_workflows"."team_id"
              AND tm.user_id = (select auth.uid())
              AND tm.status = 'active'
          )
        )
        OR EXISTS (
          SELECT 1 FROM work_workflow_members m
          WHERE m.workflow_id = "work_workflows"."workflow_id"
            AND m.user_id = (select auth.uid())
            AND m.status = 'active'
        )
      );