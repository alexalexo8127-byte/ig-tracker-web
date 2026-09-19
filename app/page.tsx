import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 0;

export default async function Home() {
  const { data: snapshots } = await supabase
    .from('snapshots')
    .select('*, followers(count)')
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold text-white">IGCOMPARE Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Prehľad skenov a sledovateľov</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h2 className="text-slate-400 text-sm font-medium">Celkový počet skenov</h2>
            <p className="text-4xl font-bold mt-2 text-blue-400">{snapshots?.length || 0}</p>
          </div>
        </div>

        <h2 className="text-xl font-semibold mt-8 mb-4">História skenov</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {snapshots && snapshots.length > 0 ? (
            <ul className="divide-y divide-slate-800">
              {snapshots.map((snap) => (
                <li key={snap.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-200">{snap.account_name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(snap.created_at).toLocaleString('sk-SK')}
                    </p>
                  </div>
                  <span className="bg-blue-500/10 text-blue-400 text-xs px-3 py-1 rounded-full font-medium">
                    {snap.followers?.[0]?.count || 0} followerov
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-slate-500 text-sm">Zatiaľ žiadne skeny.</p>
          )}
        </div>
      </div>
    </main>
  );
}