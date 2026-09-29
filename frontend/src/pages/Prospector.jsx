import { useState } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export default function Prospector() {
  const [sector, setSector] = useState('');
  const [city, setCity] = useState('');
  const [provider, setProvider] = useState('serpapi_maps');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/prospector/campaigns', { sector, city, provider });
      setResult(data);
      toast.success(`Campanha: ${data.count} leads, ${data.audits_enqueued || 0} auditorias na fila`);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Prospector</h1>
      <p className="text-sm text-gray-500 mb-6">Descoberta in-repo (Google Places ou SerpAPI Maps) com dedupe e fila de auditoria.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full border rounded px-3 py-2" placeholder="Setor" value={sector} onChange={(e) => setSector(e.target.value)} required />
        <input className="w-full border rounded px-3 py-2" placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} required />
        <select className="w-full border rounded px-3 py-2" value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="serpapi_maps">SerpAPI Maps</option>
          <option value="google_places">Google Places (New)</option>
        </select>
        <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50">
          {loading ? 'A executar…' : 'Lançar campanha'}
        </button>
      </form>
      {result && (
        <pre className="mt-6 text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
