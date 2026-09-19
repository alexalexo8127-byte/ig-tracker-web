import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Zadajte Instagram username.' },
        { status: 400 }
      );
    }

    // Serverová požiadavka na Instagram API
    const profileRes = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'x-ig-app-id': '936619743392459',
        },
      }
    );

    if (!profileRes.ok) {
      return NextResponse.json(
        { success: false, message: 'Nepodarilo sa načítať profil. Skontrolujte či je účet verejný.' },
        { status: 400 }
      );
    }

    const data = await profileRes.json();
    const user = data.data?.user;

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Profil sa nenašiel.' },
        { status: 404 }
      );
    }

    const userInfo = {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      profilePic: user.profile_pic_url_hd,
      followersCount: user.edge_followed_by?.count || 0,
      followingCount: user.edge_follow?.count || 0,
    };

    return NextResponse.json({
      success: true,
      profile: userInfo,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Nastala chyba servera.' },
      { status: 500 }
    );
  }
}