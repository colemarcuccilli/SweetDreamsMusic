'use client';

import { useState } from 'react';

export default function SendDisregardPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ name: string; email: string; sent: boolean }[]>([]);

  async function handleSend() {
    if (!confirm('Send "please disregard" emails to Victorion Brown, Makayla Harris, Otmdw, and OTMskubwealth?')) return;
    setLoading(true);
    const res = await fetch('/api/admin/send-disregard', { method: 'POST' });
    const data = await res.json();
    setResults(data.results || []);
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="font-mono text-xl font-bold uppercase mb-6">Send Disregard Emails</h1>
      <p className="font-mono text-sm text-black/70 mb-4">
        This will send a &quot;please disregard the previous Session Balance Due email&quot; message to:
      </p>
      <ul className="font-mono text-sm space-y-1 mb-6">
        <li>Victorion Brown — victorion.brown@yahoo.com</li>
        <li>Makayla Harris — kayla206.098@gmail.com</li>
        <li>Otmdw — bardockfan21savaeg@icloud.com</li>
        <li>OTMskubwealth — Nigelbennett2008@icloud.com</li>
      </ul>

      {!sent ? (
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-accent text-black font-mono text-sm font-bold uppercase tracking-wider px-6 py-3 hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Disregard Emails'}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="font-mono text-sm font-bold text-green-700">Emails sent!</p>
          {results.map((r, i) => (
            <p key={i} className={`font-mono text-xs ${r.sent ? 'text-green-600' : 'text-red-600'}`}>
              {r.sent ? '✓' : '✗'} {r.name} ({r.email})
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
