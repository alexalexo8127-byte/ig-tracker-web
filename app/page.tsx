'use client';

import { useState } from 'react';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

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
    } catch (err: any) {
      setResult({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '50px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>IGCOMPARE - Analýza profilu</h1>
      <p style={{ color: '#666' }}>Zadajte Instagram profil pre stiahnutie a uloženie do Supabase.</p>

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
          {loading ? 'Spracovávam...' : 'Analyzovať'}
        </button>
      </form>

      {result && (
        <pre style={{ background: '#f4f4f4', padding: '15px', marginTop: '20px', borderRadius: '6px', overflowX: 'auto' }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}