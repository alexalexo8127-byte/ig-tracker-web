import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 0;

function isSuspectedBot(username: string) {
  const name = username.toLowerCase();
  const digits = (name.match(/\d/g) || []).length;
  if (digits > 5 || (digits / name.length) > 0.45) {
    return { isBot: true, reason: 'Vysoký počet číslic v mene' };
  }
  const spamKeywords = ['crypto', 'promo', 'dm_for', 'followers', 'free', 'cheap', 'bot', 'gain'];
  for (const kw of spamKeywords) {
    if (name.includes(kw)) {
      return { isBot: true, reason: `Obsahuje kľúčové slovo: "${kw}"` };
    }
  }
  return { isBot: false };
}

type Props = {
  searchParams: Promise<{ account?: string }> | { account?: string };
};

export default async function Home({ searchParams }: Props) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  
  // 1. Načítanie všetkých unikátnych účtov z histórie databázy
  const { data: allSnapshots } = await supabase
    .from('snapshots')
    .select('account_name, created_at')
    .order('created_at', { ascending: false });

  // Získame unikátne názvy účtov z histórie (trvalé sloty)
  const trackedAccounts: string[] = Array.from(
    new Set(allSnapshots?.map((s) => s.account_name).filter(Boolean) || [])
  );

  const FREE_LIMIT = 3;
  const isLimitReached = trackedAccounts.length >= FREE_LIMIT;

  // Vybraný účet z URL (alebo prvý dostupný)
  const selectedAccount = resolvedSearchParams?.account || trackedAccounts[0] || '';

  // 2. Načítanie skenov iba pre vybraný účet
  let snapshots: any[] = [];
  if (selectedAccount) {
    const { data } = await supabase
      .from('snapshots')
      .select('*, followers(username)')
      .eq('account_name', selectedAccount)
      .order('created_at', { ascending: false });
    snapshots = data || [];
  }

  const latestSnap = snapshots[0];
  const prevSnap = snapshots[1];

  const latestFollowers = (latestSnap?.followers || []).map((f: any) => f.username);
  const prevFollowers = (prevSnap?.followers || []).map((f: any) => f.username);

  const latestSet = new Set(latestFollowers);
  const prevSet = new Set(prevFollowers);

  const newFollowers = latestFollowers.filter((u: string) => !prevSet.has(u));
  const unfollowers = prevFollowers.filter((u: string) => !latestSet.has(u));
  const bots = latestFollowers
    .map((u: string) => ({ username: u, ...isSuspectedBot(u) }))
    .filter((b: any) => b.isBot);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Hlavička & Prepínač účtov */}
        <div className="border-b border-slate-800 pb-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">IGCOMPARE Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">
                Sledovaný účet: <span className="text-blue-400 font-semibold">@{selectedAccount || 'Žiadny účet'}</span>
              </p>
            </div>
            
            {/* Limit účtov Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-900 text-slate-400 px-3 py-1.5 rounded-full border border-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Trvalé sloty: <strong className="text-white">{trackedAccounts.length}/{FREE_LIMIT}</strong> (Free Plan)
              </span>
              {isLimitReached && (
                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-full font-semibold">
                  PRO Limit Dosiahnutý
                </span>
              )}
            </div>
          </div>

          {/* Prepínač účtov (Taby) */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-slate-500 font-medium mr-1">Registrované účty:</span>
            {trackedAccounts.map((acc) => {
              const isActive = acc === selectedAccount;
              return (
                <Link
                  key={acc}
                  href={`/?account=${encodeURIComponent(acc)}`}
                  className={`text-sm px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  @{acc}
                </Link>
              );
            })}

            {trackedAccounts.length === 0 && (
              <span className="text-xs text-slate-500">Zatiaľ neboli nahrané žiadne skeny.</span>
            )}

            {/* Zámok pre 4. nový účet (PRO Paywall) */}
            {isLimitReached && (
              <div className="relative group ml-auto sm:ml-2">
                <button
                  disabled
                  className="text-xs bg-slate-900/80 text-slate-500 border border-slate-800 px-3 py-2 rounded-lg cursor-not-allowed flex items-center gap-1.5"
                >
                  <span>+ Pridať 4. nový účet</span>
                  <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">PRO</span>
                </button>
              </div>
            )}
          </div>

          {/* Upozornenie o ochrane databázy a slotov */}
          <div className="bg-blue-950/30 border border-blue-800/40 rounded-lg p-3 text-xs text-blue-300/80 flex items-start gap-2">
            <span className="text-blue-400 text-base leading-none">ℹ️</span>
            <div>
              <strong>Ochrana dát a slotov:</strong> Všetky vaše skeny a história followerov pre registrované účty zostávajú trvalo uložené v databáze. Aj keby ste účet dočasne nesledovali, po zaslaní nového skenu automaticky nadviažete na celú históriu. Registrovaný slot zostáva viazaný na účet, aby sa nepovoleným striedaním účtov neobchádzal Free limit.
            </div>
          </div>
        </div>

        {/* Hlavné štatistiky */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Celkovo Followerov</p>
            <p className="text-3xl font-bold mt-2 text-white">{latestFollowers.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Nové Účty</p>
            <p className="text-3xl font-bold mt-2 text-emerald-400">+{newFollowers.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Odsledovali (Unfollow)</p>
            <p className="text-3xl font-bold mt-2 text-rose-400">-{unfollowers.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Podozriví Boti</p>
            <p className="text-3xl font-bold mt-2 text-amber-400">{bots.length}</p>
          </div>
        </div>

        {/* Detailné karty */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Nové účty ({newFollowers.length})
            </h3>
            {newFollowers.length > 0 ? (
              <ul className="space-y-2">
                {newFollowers.map((user: string) => (
                  <li key={user} className="text-sm bg-slate-950 p-2.5 rounded border border-slate-800/80 text-slate-300">
                    @{user}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Žiadne nové účty.</p>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-rose-400 font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Odsledovali teba ({unfollowers.length})
            </h3>
            {unfollowers.length > 0 ? (
              <ul className="space-y-2">
                {unfollowers.map((user: string) => (
                  <li key={user} className="text-sm bg-slate-950 p-2.5 rounded border border-slate-800/80 text-slate-300">
                    @{user}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Nikto teba neodsledoval.</p>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Detegovaní Boti ({bots.length})
            </h3>
            {bots.length > 0 ? (
              <ul className="space-y-2">
                {bots.map((bot: any) => (
                  <li key={bot.username} className="text-sm bg-slate-950 p-2.5 rounded border border-slate-800/80">
                    <span className="text-slate-200 font-medium block">@{bot.username}</span>
                    <span className="text-xs text-amber-500/80">{bot.reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">Žiadni podozriví boti.</p>
            )}
          </div>
        </div>

        {/* História skenov pre vybraný účet */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">
            História skenov pre @{selectedAccount} ({snapshots.length})
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {snapshots.length > 0 ? (
              <ul className="divide-y divide-slate-800">
                {snapshots.map((snap: any) => (
                  <li key={snap.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-200">{snap.account_name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(snap.created_at).toLocaleString('sk-SK')}
                      </p>
                    </div>
                    <span className="bg-blue-500/10 text-blue-400 text-xs px-3 py-1 rounded-full font-medium border border-blue-500/20">
                      {snap.followers?.length || 0} followerov
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-slate-500 text-sm">Zatiaľ žiadne skeny pre tento účet.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}