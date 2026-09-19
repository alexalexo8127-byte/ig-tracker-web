import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function getProfileData(username: string) {
  const cleanUsername = username.trim().toLowerCase();

  // 1. Skúsime najskôr nájsť profil v Supabase lokálnej databáze (case-insensitive)
  const { data: cached } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', cleanUsername)
    .single();

  if (cached) return cached;

  // 2. Ak nie je v databáze, stiahneme ho priamo z Instagram API
  try {
    const res = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${cleanUsername}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'x-ig-app-id': '936619743392459',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const user = json.data?.user;
    if (!user) return null;

    const userInfo = {
      ig_id: user.id,
      username: user.username,
      full_name: user.full_name || '',
      profile_pic: user.profile_pic_url_hd || '',
      followers_count: user.edge_followed_by?.count || 0,
      following_count: user.edge_follow?.count || 0,
      updated_at: new Date().toISOString(),
    };

    // Uložíme do Supabase pre budúce použitie
    await supabase.from('profiles').upsert(userInfo, { onConflict: 'ig_id' });
    return userInfo;
  } catch (err) {
    console.error(`Chyba pri sťahovaní profilu ${cleanUsername}:`, err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { username1, username2 } = await request.json();

    if (!username1 || !username2) {
      return NextResponse.json({ success: false, message: 'Zadajte oba Instagram username pre porovnanie.' }, { status: 400 });
    }

    const profile1 = await getProfileData(username1);
    const profile2 = await getProfileData(username2);

    if (!profile1) {
      return NextResponse.json({ success: false, message: `Nepodarilo sa nájsť alebo stiahnuť profil: @${username1}. Uistite sa, že účet je verejný.` }, { status: 404 });
    }

    if (!profile2) {
      return NextResponse.json({ success: false, message: `Nepodarilo sa nájsť alebo stiahnuť profil: @${username2}. Uistite sa, že účet je verejný.` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile1,
      profile2,
      differenceInFollowers: profile1.followers_count - profile2.followers_count,
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Nastala chyba servera.' }, { status: 500 });
  }
}