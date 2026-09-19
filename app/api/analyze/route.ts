import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ success: false, message: 'Zadajte Instagram username.' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    const profileRes = await fetch(
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

    if (!profileRes.ok) {
      return NextResponse.json({ success: false, message: `Profil @${cleanUsername} sa nenašiel alebo nie je verejný.` }, { status: 400 });
    }

    const data = await profileRes.json();
    const user = data.data?.user;

    if (!user) {
      return NextResponse.json({ success: false, message: 'Údaje o profile neboli nájdené.' }, { status: 404 });
    }

    const newFollowersCount = user.edge_followed_by?.count || 0;
    const newFollowingCount = user.edge_follow?.count || 0;

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('followers_count')
      .eq('ig_id', user.id)
      .single();

    let diff = 0;
    if (existingProfile) {
      diff = newFollowersCount - existingProfile.followers_count;
    }

    const userInfo = {
      ig_id: user.id,
      username: user.username,
      full_name: user.full_name || '',
      profile_pic: user.profile_pic_url_hd || '',
      followers_count: newFollowersCount,
      following_count: newFollowingCount,
      updated_at: new Date().toISOString(),
    };

    await supabase.from('profiles').upsert(userInfo, { onConflict: 'ig_id' });

    await supabase.from('profile_history').insert({
      ig_id: user.id,
      username: user.username,
      followers_count: newFollowersCount,
      following_count: newFollowingCount,
    });

    return NextResponse.json({
      success: true,
      profile: userInfo,
      difference: diff,
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Nastala chyba servera.' }, { status: 500 });
  }
}