'use client';

import { useState, useEffect } from 'react';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);

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

  return (
    <main style={{ padding: '40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '800px', margin: '0 auto', background: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#111' }}>IGCOMPARE SaaS</h1>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>Profesionálna serverová analýza a tracking Instagram profilov.</p>

        <form onSubmit={handleAnalyze} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Zadajte Instagram username (napr. instagram)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '12px 16px', flex: 1, borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '12px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
          >
            {loading ? 'Analyzujem...' : 'Analyzovať profil'}
          </button>
        </form>

        {result && result.success && (
          <div style={{ background: '#ecfdf5', border: '1px solid #10b981', padding: '20px', marginTop: '20px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#065f46' }}>Výsledok pre @{result.profile.username}</h3>
            <p style={{ margin: '5px 0' }}>Počet followerov: <strong>{result.profile.followers_count?.toLocaleString()}</strong></p>
            <p style={{ margin: '5px 0' }}>
              Zmena od posledného skenu: <strong style={{ color: result.difference > 0 ? '#059669' : result.difference < 0 ? '#dc2626' : '#374151' }}>
                {result.difference > 0 ? `+${result.difference}` : result.difference}
              </strong>
            </p>
          </div>
        )}

        {result && !result.success && (
          <div style={{ background: '#fef2f2', border: '1px solid #ef4444', color: '#991b1b', padding: '15px', marginTop: '20px', borderRadius: '8px' }}>
            <strong>Chyba:</strong> {result.message}
          </div>
        )}

        <h2 style={{ marginTop: '40px', fontSize: '20px', color: '#111' }}>Sledované profily v databáze</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
          {profiles.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>Zatiaľ žiadne uložené profily.</p>
          ) : (
            profiles.map((p) => (
              <div key={p.ig_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {p.profile_pic ? (
                    <img src={p.profile_pic} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e5e7eb' }} />
                  )}
                  <div>
                    <strong style={{ fontSize: '16px', color: '#1f2937' }}>@{p.username}</strong>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{p.full_name}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#111' }}>{p.followers_count?.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#6b7280' }}>followerov</span></div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Aktualizované: {new Date(p.updated_at).toLocaleString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}