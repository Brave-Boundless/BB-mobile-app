-- Trigger functions are not part of the API. handle_new_auth_user is
-- SECURITY DEFINER, so it must not be callable via /rest/v1/rpc.
-- Triggers still fire: EXECUTE is checked when the trigger is created, not
-- when it runs.
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
