"use client";
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const handleScrape = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Terjadi kesalahan');
      
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h1 style={{ color: '#ee4d2d', textAlign: 'center' }}>Shopee Data Scraper</h1>
      
      <form onSubmit={handleScrape} style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <input 
          type="url" 
          placeholder="Masukkan link Shopee (contoh: https://shp.ee/...)" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '10px 20px', backgroundColor: '#ee4d2d', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Mencari...' : 'Ekstrak Data'}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
          Error: {error}
        </div>
      )}

      {data && (
        <div style={{ marginTop: '20px', border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
          <h3>{data.title}</h3>
          {data.image && (
            <img 
              src={data.image} 
              alt={data.title} 
              style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', marginTop: '10px' }} 
            />
          )}
          <p style={{ fontSize: '14px', color: '#666', marginTop: '15px' }}>
            <strong>URL Asli:</strong> <a href={data.url} target="_blank" rel="noopener noreferrer">{data.url}</a>
          </p>
        </div>
      )}
    </div>
  );
}
