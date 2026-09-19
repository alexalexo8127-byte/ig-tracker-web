import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Pomocná funkcia na získanie profilu (z Instagramu alebo Supabase)
async function getProfileData(username: string) {
  // Najskôr skúšame Supabase, či ho už nemáme uložený
  const { data: cached } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (cached) return cached;

  // Ak nie, stiahneme ho zo servera
  const res = await fetch(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'x-ig-app-id': '936619743392459',
      },
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const user = data.data?.user;
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

  // Uložení do Supabase
  await supabase.from('profiles').upsert(userInfo, { onConflict: 'ig_id' });
  return userInfo;
}

export async function POST(request: Request) {
  try {
    const { username1, username2 } = await request.json();

    if (!username1 || !username2) {
      return NextResponse.json({ success: false, message: 'Zadajte oba Instagram username pre porovnanie.' }, { status: 400 });
    }

    const profile1 = await getProfileData(username1.trim());
    const profile2 = await getProfileData(username2.trim());

    if (!profile1 || !profile2) {
      return NextResponse.json({ success: false, message: 'Jeden alebo oba profily sa nepodarilo nájsť.' }, { status: 404 });
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