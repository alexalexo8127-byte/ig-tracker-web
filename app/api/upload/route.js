import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CORS hlavičky pre povolenie požiadaviek z instagram.com
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { accountName, names } = body;

    if (!accountName || !Array.isArray(names)) {
      return NextResponse.json(
        { error: 'Chýba accountName alebo pole names.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Načítanie unikátnych účtov z histórie
    const { data: existingSnapshots } = await supabase
      .from('snapshots')
      .select('account_name');

    const trackedAccounts = Array.from(
      new Set(existingSnapshots?.map((s) => s.account_name).filter(Boolean) || [])
    );

    const isExistingAccount = trackedAccounts.includes(accountName);

    // Kontrola 3-účtového limitu Pre Free plán
    if (!isExistingAccount && trackedAccounts.length >= 3) {
      return NextResponse.json(
        {
          error: 'LIMIT_EXCEEDED',
          message: 'Free plán umožňuje registrovať maximálne 3 unikátne Instagram účty. Pre pridanie 4. účtu prejdite na PRO plán.'
        },
        { status: 403, headers: corsHeaders }
      );
    }

    // 2. Vytvorenie skenu
    const { data: snapshot, error: snapshotError } = await supabase
      .from('snapshots')
      .insert({ account_name: accountName })
      .select()
      .single();

    if (snapshotError) throw snapshotError;

    // 3. Uloženie followerov
    const followersData = names.map((name) => ({
      snapshot_id: snapshot.id,
      username: name,
    }));

    const { error: followersError } = await supabase
      .from('followers')
      .insert(followersData);

    if (followersError) throw followersError;

    return NextResponse.json(
      {
        success: true,
        snapshotId: snapshot.id,
        count: names.length,
        isExistingAccount,
        trackedAccountsCount: isExistingAccount ? trackedAccounts.length : trackedAccounts.length + 1
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}