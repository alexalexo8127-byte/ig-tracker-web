'use client';

import { useState, useEffect } from 'react';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);

  // Funkcia na načítanie uložených profilov zo Supabase
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
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      setResult(data);
      if (data.success) {
        setUsername('');
        fetchProfiles(); // Obnoví zoznam profilov hneď po úspešnej analýze
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto' }}>
      <h1>IGCOMPARE - SaaS Dashboard</h1>
      <p style={{ color: '#666' }}>Serverová analýza Instagram profilov a ukladanie do Supabase.</p>

      <form onSubmit={handleAnalyze} style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="napr. instagram"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: '10px', flex: 1, borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px 20px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          {loading ? 'Spracovávam...' : 'Analyzovať a uložiť'}
        </button>
      </form>

      {result && (
        <div style={{ background: '#f4f4f4', padding: '15px', marginTop: '20px', borderRadius: '6px' }}>
          <h3>Posledná akcia:</h3>
          <pre style={{ overflowX: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <h2 style={{ marginTop: '40px' }}>Uložené profily v databáze</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
        {profiles.length === 0 ? (
          <p style={{ color: '#888' }}>Zatiaľ žiadne uložené profily.</p>
        ) : (
          profiles.map((p) => (
            <div key={p.ig_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {p.profile_pic && <img src={p.profile_pic} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />}
                <div>
                  <strong>@{p.username}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>{p.full_name}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '14px' }}>
                <div><strong>{p.followers_count?.toLocaleString()}</strong> followerov</div>
                <div style={{ fontSize: '11px', color: '#888' }}>{new Date(p.updated_at).toLocaleString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}