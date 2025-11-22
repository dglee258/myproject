/**
 * Database Trigger Function: welcome_email_direct
 * 
 * This function sends a welcome email directly using Resend API
 * instead of using pgmq queue system.
 * 
 * The function calls the Resend API via PostgreSQL's http extension
 * to send the welcome email immediately when a new user registers.
 * 
 * Security considerations:
 * - Uses SECURITY DEFINER to run with the privileges of the function owner
 * - Sets an empty search path to prevent search path injection attacks
 * 
 * Dependencies:
 * - Requires PostgreSQL http extension
 * - Requires RESEND_API_KEY to be set as a database variable
 * - Requires the welcome email template to be rendered
 * 
 * @returns TRIGGER - Returns the NEW record that triggered the function
 */
CREATE OR REPLACE FUNCTION welcome_email_direct()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
DECLARE
    resend_url TEXT := 'https://api.resend.com/emails';
    recipient_email TEXT;
    response JSONB;
BEGIN
    -- Get the recipient email from user metadata
    recipient_email := new.raw_user_meta_data ->> 'email';
    
    -- Skip if no email found
    IF recipient_email IS NULL OR recipient_email = '' THEN
        RETURN NEW;
    END IF;
    
    -- Send email via Resend API
    SELECT content INTO response 
    FROM http_post(
        url := resend_url,
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || current_setting('app.settings.resend_api_key', true),
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
            'from', 'onboarding@yourdomain.com',
            'to', jsonb_build_array(recipient_email),
            'subject', '싱크로에 오신 것을 환영합니다! 동영상 업로드하고 AI 업무프로세스를 바로 확인하세요',
            'html', jsonb_build_object(
                'template', 'welcome',
                'data', jsonb_build_object(
                    'email', recipient_email,
                    'name', COALESCE(new.raw_user_meta_data ->> 'name', '사용자')
                )
            )::text
        )
    );
    
    -- Log the result (optional)
    IF response ->> 'status' = 'success' THEN
        RAISE LOG 'Welcome email sent successfully to %', recipient_email;
    ELSE
        RAISE WARNING 'Failed to send welcome email to %: %', recipient_email, response;
    END IF;
    
    RETURN NEW;
END;
$$;

/**
 * Database Trigger: welcome_email_direct
 * 
 * This trigger executes the welcome_email_direct function automatically
 * after a new user is inserted into the auth.users table.
 * 
 * The trigger runs once for each row inserted (FOR EACH ROW)
 * and only activates on INSERT operations.
 * 
 * This ensures that every new user receives a welcome email
 * immediately without requiring a queue worker.
 */
CREATE TRIGGER welcome_email_direct
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION welcome_email_direct();
