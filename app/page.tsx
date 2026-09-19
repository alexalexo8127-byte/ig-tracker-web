'use client';

import { useState, useEffect } from 'react';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);

  // Stavy pre porovnanie profilov
  const [user1, setUser1] = useState('');
  const [user2, setUser2] = useState('');
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<any>(null);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/profiles');
      const data = await res.json();
      if (data.success) {
        setProfiles(data.profiles);
      }
    } catch (err) {
      console.error('Chyba pri načítaní histórie');
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();
      setResult(data);
      if (data.success) {
        setUsername('');
        fetchProfiles();
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user1.trim() || !user2.trim()) return;

    setComparing(true);
    setCompareResult(null);

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username1: user1, username2: user2 }),
      });

      const data = await res.json();
      setCompareResult(data);
    } catch (err: any) {
      setCompareResult({ success: false, message: err.message });
    } finally {
      setComparing(false);
    }
  };

  return (
    <main style={{ padding: '40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '800px', margin: '0 auto', background: '#0b0f19', minHeight: '100vh', color: '#f3f4f6' }}>
      
      {/* Sekcia 1: Analýza jednotlivca */}
      <div style={{ background: '#111827', padding: '30px', borderRadius: '12px', border: '1px solid #1f2937', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#ffffff', fontSize: '24px' }}>IGCOMPARE SaaS</h1>
        <p style={{ color: '#9ca3af', marginBottom: '20px' }}>Serverová analýza a tracking Instagram profilov.</p>

        <form onSubmit={handleAnalyze} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Zadajte Instagram username (napr. instagram)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '12px 16px', flex: 1, borderRadius: '8px', border: '1px solid #374151', background: '#1f2937', color: '#ffffff', fontSize: '15px', outline: 'none' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
          >
            {loading ? 'Analyzujem...' : 'Analyzovať'}
          </button>
        </form>

        {result && result.success && (
          <div style={{ background: '#064e3b', border: '1px solid #059669', padding: '20px', marginTop: '20px', borderRadius: '8px', color: '#ecfdf5' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#34d399' }}>Výsledok pre @{result.profile.username}</h3>
            <p style={{ margin: '5px 0' }}>Počet followerov: <strong>{result.profile.followers_count?.toLocaleString()}</strong></p>
            <p style={{ margin: '5px 0' }}>
              Zmena od posledného skenu: <strong style={{ color: result.difference > 0 ? '#34d399' : result.difference < 0 ? '#f87171' : '#f3f4f6' }}>
                {result.difference > 0 ? `+${result.difference}` : result.difference}
              </strong>
            </p>
          </div>
        )}

        {result && !result.success && (
          <div style={{ background: '#7f1d1d', border: '1px solid #dc2626', color: '#fee2e2', padding: '15px', marginTop: '20px', borderRadius: '8px' }}>
            <strong>Chyba:</strong> {result.message}
          </div>
        )}
      </div>

      {/* Sekcia 2: Porovnanie profilov */}
      <div style={{ background: '#111827', padding: '30px', borderRadius: '12px', border: '1px solid #1f2937', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#ffffff', fontSize: '20px' }}>Porovnanie profilov (Side-by-Side)</h2>
        <p style={{ color: '#9ca3af', marginBottom: '20px' }}>Porovnajte štatistiky dvoch účtov naraz.</p>

        <form onSubmit={handleCompare} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Prvý profil (napr. instagram)"
            value={user1}
            onChange={(e) => setUser1(e.target.value)}
            style={{ padding: '12px 16px', flex: 1, minWidth: '200px', borderRadius: '8px', border: '1px solid #374151', background: '#1f2937', color: '#ffffff', fontSize: '15px', outline: 'none' }}
          />
          <input
            type="text"
            placeholder="Druhý profil (napr. cristiano)"
            value={user2}
            onChange={(e) => setUser2(e.target.value)}
            style={{ padding: '12px 16px', flex: 1, minWidth: '200px', borderRadius: '8px', border: '1px solid #374151', background: '#1f2937', color: '#ffffff', fontSize: '15px', outline: 'none' }}
          />
          <button
            type="submit"
            disabled={comparing}
            style={{ padding: '12px 24px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', width: '100%' }}
          >
            {comparing ? 'Porovnávam...' : 'Porovnať profily'}
          </button>
        </form>

        {compareResult && compareResult.success && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
            {/* Profil 1 */}
            <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px', border: '1px solid #374151', textAlign: 'center' }}>
              {compareResult.profile1.profile_pic && (
                <img src={compareResult.profile1.profile_pic} alt="" style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '10px', objectFit: 'cover' }} />
              )}
              <h3 style={{ margin: '5px 0', color: '#ffffff' }}>@{compareResult.profile1.username}</h3>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#38bdf8', margin: '5px 0' }}>{compareResult.profile1.followers_count?.toLocaleString()} followerov</p>
            </div>

            {/* Profil 2 */}
            <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px', border: '1px solid #374151', textAlign: 'center' }}>
              {compareResult.profile2.profile_pic && (
                <img src={compareResult.profile2.profile_pic} alt="" style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '10px', objectFit: 'cover' }} />
              )}
              <h3 style={{ margin: '5px 0', color: '#ffffff' }}>@{compareResult.profile2.username}</h3>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#38bdf8', margin: '5px 0' }}>{compareResult.profile2.followers_count?.toLocaleString()} followerov</p>
            </div>

            <div style={{ gridColumn: 'span 2', background: '#312e81', padding: '12px', borderRadius: '8px', textAlign: 'center', color: '#e0e7ff' }}>
              Rozdiel: <strong>{Math.abs(compareResult.differenceInFollowers).toLocaleString()}</strong> sledovateľov v prospech <strong>@{compareResult.differenceInFollowers >= 0 ? compareResult.profile1.username : compareResult.profile2.username}</strong>
            </div>
          </div>
        )}

        {compareResult && !compareResult.success && (
          <div style={{ background: '#7f1d1d', border: '1px solid #dc2626', color: '#fee2e2', padding: '15px', marginTop: '20px', borderRadius: '8px' }}>
            <strong>Chyba:</strong> {compareResult.message}
          </div>
        )}
      </div>

      {/* Sekcia 3: Zoznam uložených profilov */}
      <div style={{ background: '#111827', padding: '30px', borderRadius: '12px', border: '1px solid #1f2937', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', color: '#ffffff' }}>Sledované profily v databáze</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {profiles.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Zatiaľ žiadne uložené profily.</p>
          ) : (
            profiles.map((p) => (
              <div key={p.ig_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {p.profile_pic ? (
                    <img src={p.profile_pic} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#374151' }} />
                  )}
                  <div>
                    <strong style={{ fontSize: '16px', color: '#ffffff' }}>@{p.username}</strong>
                    <div style={{ fontSize: '13px', color: '#9ca3af' }}>{p.full_name}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>{p.followers_count?.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#9ca3af' }}>followerov</span></div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Aktualizované: {new Date(p.updated_at).toLocaleString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}