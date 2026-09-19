import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ success: false, message: 'Zadajte Instagram username.' }, { status: 400 });
    }

    // Stiahnutie verejných dát z Instagramu
    const profileRes = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'x-ig-app-id': '936619743392459',
        },
      }
    );

    if (!profileRes.ok) {
      return NextResponse.json({ success: false, message: 'Profil sa nenašiel alebo nie je verejný.' }, { status: 400 });
    }

    const data = await profileRes.json();
    const user = data.data?.user;

    const userInfo = {
      ig_id: user.id,
      username: user.username,
      full_name: user.full_name || '',
      profile_pic: user.profile_pic_url_hd || '',
      followers_count: user.edge_followed_by?.count || 0,
      following_count: user.edge_follow?.count || 0,
      updated_at: new Date().toISOString(),
    };

    // Uloženie do Supabase tabuľky 'profiles'
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert(userInfo, { onConflict: 'ig_id' });

    if (dbError) {
      console.error('Chyba DB:', dbError.message);
    }

    return NextResponse.json({ success: true, profile: userInfo });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}