import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { names, accountName } = await request.json();

    if (!names || !Array.isArray(names)) {
      return Response.json({ error: 'Neplatný formát dát' }, { status: 400 });
    }

    // 1. Vytvorenie záznamu o novom skene (snapshot)
    const { data: snapshot, error: snapErr } = await supabase
      .from('snapshots')
      .insert({ account_name: accountName || 'Neznámy účet' })
      .select()
      .single();

    if (snapErr) return Response.json({ error: snapErr.message }, { status: 500 });

    // 2. Vloženie všetkých mien followerov
    const followerRows = names.map(username => ({
      snapshot_id: snapshot.id,
      username: username
    }));

    const { error: followErr } = await supabase.from('followers').insert(followerRows);
    if (followErr) return Response.json({ error: followErr.message }, { status: 500 });

    return Response.json({ success: true, count: names.length, snapshotId: snapshot.id });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}