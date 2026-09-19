import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Pomocná funkcia na detekciu podozrivého / bot účtu
function isSuspectedBot(username: string): { isBot: boolean; reason?: string } {
  const name = username.toLowerCase();
  
  // 1. Príliš veľa číslic v mene (napr. user129847192)
  const digits = (name.match(/\d/g) || []).length;
  if (digits > 5 || (digits / name.length) > 0.45) {
    return { isBot: true, reason: 'Vysoký počet číslic v mene' };
  }

  // 2. Podozrivé spamové kľúčové slová
  const spamKeywords = ['crypto', 'promo', 'dm_for', 'followers', 'free', 'cheap', 'bot', 'gain'];
  for (const kw of spamKeywords) {
    if (name.includes(kw)) {
      return { isBot: true, reason: `Obsahuje kľúčové slovo: "${kw}"` };
    }
  }

  return { isBot: false };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountName = searchParams.get('accountName');

  if (!accountName) {
    return NextResponse.json({ error: 'Chýba parameter accountName' }, { status: 400 });
  }

  // Načítame 2 najnovšie skeny pre dané konto
  const { data: snapshots, error: snapError } = await supabase
    .from('snapshots')
    .select('id, created_at')
    .eq('account_name', accountName)
    .order('created_at', { ascending: false })
    .limit(2);

  if (snapError || !snapshots || snapshots.length === 0) {
    return NextResponse.json({ error: 'Nenašli sa žiadne skeny pre tento účet' }, { status: 404 });
  }

  const latestSnapshot = snapshots[0];
  const previousSnapshot = snapshots[1]; // Môže byť undefined, ak existuje len 1 sken

  // Načítame followerov pre najnovší sken
  const { data: latestFollowers } = await supabase
    .from('followers')
    .select('username')
    .eq('snapshot_id', latestSnapshot.id);

  const latestSet = new Set((latestFollowers || []).map((f) => f.username));

  // Ak máme aj predchádzajúci sken, porovnáme ich
  let previousSet = new Set<string>();
  if (previousSnapshot) {
    const { data: prevFollowers } = await supabase
      .from('followers')
      .select('username')
      .eq('snapshot_id', previousSnapshot.id);
    previousSet = new Set((prevFollowers || []).map((f) => f.username));
  }

  // Výpočet rozdielov
  const newFollowers = Array.from(latestSet).filter((user) => !previousSet.has(user));
  const unfollowers = Array.from(previousSet).filter((user) => !latestSet.has(user));

  // Analýza botov v aktuálnom zozname
  const botAnalysis = Array.from(latestSet)
    .map((username) => ({ username, ...isSuspectedBot(username) }))
    .filter((res) => res.isBot);

  return NextResponse.json({
    accountName,
    latestScan: latestSnapshot.created_at,
    hasComparison: !!previousSnapshot,
    stats: {
      totalFollowers: latestSet.size,
      newFollowersCount: newFollowers.length,
      unfollowersCount: unfollowers.length,
      suspectedBotsCount: botAnalysis.length,
    },
    details: {
      newFollowers,
      unfollowers,
      suspectedBots: botAnalysis,
    },
  });
}