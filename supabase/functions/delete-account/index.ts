// delete-account: deletes the calling user's Supabase Auth account.
//
// Every user-owned row (users, drill_days, journal_entries) references
// auth.users with ON DELETE CASCADE, so deleting the auth user removes all of
// their data. The caller is identified from their own session token; there is
// no way to name another user.
//
// verify_jwt is off (supabase/config.toml) per Supabase's guidance for
// publishable/secret keys; the token is validated here with auth.getUser(),
// which checks it against Supabase Auth.

import { createClient } from 'npm:@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;

function key(kind: 'PUBLISHABLE' | 'SECRET'): string {
  const json = Deno.env.get(`SUPABASE_${kind}_KEYS`);
  if (json) return JSON.parse(json)['default'];
  // Legacy keys, for projects without the new key set.
  return Deno.env.get(kind === 'SECRET' ? 'SUPABASE_SERVICE_ROLE_KEY' : 'SUPABASE_ANON_KEY')!;
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json(401, { error: 'not_signed_in' });

  const asUser = createClient(url, key('PUBLISHABLE'), { auth: { persistSession: false } });
  const { data, error } = await asUser.auth.getUser(token);
  if (error || !data.user) return json(401, { error: 'not_signed_in' });

  const admin = createClient(url, key('SECRET'), { auth: { persistSession: false } });
  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) return json(500, { error: 'delete_failed' });

  return json(200, { deleted: true });
});
