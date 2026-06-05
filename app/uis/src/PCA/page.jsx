import React, { useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';

export default function PCAPage() {
  const [symbols, setSymbols] = useState(['AAPL', 'MSFT', 'GOOGL', 'AMZN']);
  const [newSymbol, setNewSymbol] = useState('');
  
  const [period, setPeriod] = useState('1y');
  const [interval, setIntervalValue] = useState('1d');
  
  const [pcaResults, setPcaResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddSymbol = (e) => {
    e.preventDefault();
    const cleanSymbol = newSymbol.trim().toUpperCase();
    if (cleanSymbol && !symbols.includes(cleanSymbol)) {
      setSymbols([...symbols, cleanSymbol]);
    }
    setNewSymbol('');
  };

  const handleRemoveSymbol = (symToRemove) => {
    setSymbols(symbols.filter(sym => sym !== symToRemove));
  };

  const handleComputePCA = async () => {
    if (symbols.length < 2) {
      setError("Please add at least 2 symbols to run PCA.");
      return;
    }

    setLoading(true);
    setError(null);
    setPcaResults(null);

    try {
      const response = await fetch('http://localhost:8000/api/pca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols, period, interval }),
      });

      if (!response.ok) {
        const fallbackText = await response.text();
        try {
          const jsonErr = JSON.parse(fallbackText);
          throw new Error(jsonErr.error || jsonErr.detail || 'PCA execution mismatch error.');
        } catch {
          throw new Error(`Server dropped a ${response.status} error.`);
        }
      }

      const data = await response.json();
      setPcaResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartLabels = pcaResults?.explained_variance_ratio?.map((_, idx) => `PC ${idx + 1}`) || [];
  const chartVarianceValues = pcaResults?.explained_variance_ratio?.map((val) => Number((val * 100).toFixed(2))) || [];
  const pc1Weights = pcaResults?.components?.[0]?.map((val) => Number(val.toFixed(3))) || [];
  const validSymbols = pcaResults?.symbols || [];

  const inputStyle = { padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' };

  return (
    <div>
      <h2 style={{ marginTop: 0, fontSize: '22px', color: '#38bdf8' }}>Workspace 02: Multi-Pair PCA Analysis Terminal</h2>
      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>Analyze overlapping trend components across a selection of ticker fields.</p>

      {/* Control Panel Card */}
      <div style={{ background: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Target Assets Sub-Section */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 'bold' }}>Target Assets</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {symbols.map(sym => (
              <div key={sym} style={{ background: '#38bdf8', color: '#0f172a', padding: '6px 12px', borderRadius: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                {sym}
                <button onClick={() => handleRemoveSymbol(sym)} style={{ background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: '50%', color: '#0f172a', cursor: 'pointer', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>×</button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSymbol} style={{ display: 'flex', gap: '8px', maxWidth: '400px' }}>
            <input type="text" placeholder="Add symbol (e.g., TSLA)" value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }} />
            <button type="submit" style={{ backgroundColor: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', padding: '0 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>Add Pair</button>
          </form>
        </div>

        {/* Scope Matrix Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>Period Scope</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
              <option value="1mo">1 Month</option>
              <option value="3mo">3 Months</option>
              <option value="6mo">6 Months</option>
              <option value="1y">1 Year</option>
              <option value="2y">2 Years</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>Interval Bar</label>
            <select value={interval} onChange={(e) => setIntervalValue(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
              <option value="1h">1 Hour (1h)</option>
              <option value="4h">4 Hours (4h)</option>
              <option value="1d">Daily (1d)</option>
              <option value="1wk">Weekly (1wk)</option>
            </select>
          </div>
          <button 
            onClick={handleComputePCA} 
            disabled={loading} 
            style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '12px 24px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: loading ? 0.7 : 1, transition: 'all 0.2s', height: '42px' }}
          >
            {loading ? 'Factoring Components...' : 'Extract Covariance Structure'}
          </button>
        </div>
      </div>

      {error && <div style={{ color: '#f87171', padding: '12px', backgroundColor: '#7f1d1d40', borderRadius: '8px', border: '1px solid #7f1d1d', marginBottom: '24px' }}>{error}</div>}

      {/* Results Workspace Graphs */}
      {pcaResults && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          
          {/* Chart 1 Card */}
          <div style={{ padding: '24px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#38bdf8', fontSize: '16px', fontWeight: 'bold' }}>PCA Factor Variance Distribution</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px 0' }}>Shows how much total market movement is explained by each Principal Component.</p>
            <div style={{ width: '100%', height: 260, background: '#1e293b', borderRadius: '8px', padding: '12px', boxSizing: 'border-box' }}>
              <BarChart 
                xAxis={[{ data: chartLabels, scaleType: 'band', tickLabelStyle: { fill: '#94a3b8', fontSize: 11 } }]} 
                series={[{ data: chartVarianceValues, label: 'Explained Variance (%)', color: '#38bdf8' }]} 
                height={240} 
                margin={{ top: 20, bottom: 30, left: 40, right: 10 }} 
                slotProps={{ legend: { labelStyle: { fill: '#f8fafc', fontSize: 12 } } }} 
              />
            </div>
          </div>

          {/* Chart 2 Card */}
          <div style={{ padding: '24px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#10b981', fontSize: '16px', fontWeight: 'bold' }}>Component 1 (PC1) Asset Weights</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px 0' }}>Identifies which specific assets are driving the primary market trend (PC1).</p>
            <div style={{ width: '100%', height: 260, background: '#1e293b', borderRadius: '8px', padding: '12px', boxSizing: 'border-box' }}>
               <BarChart 
                 xAxis={[{ data: validSymbols, scaleType: 'band', tickLabelStyle: { fill: '#94a3b8', fontSize: 11 } }]} 
                 series={[{ data: pc1Weights, label: 'PC1 Loading Weight', color: '#10b981' }]} 
                 height={240} 
                 margin={{ top: 20, bottom: 30, left: 40, right: 10 }} 
                 slotProps={{ legend: { labelStyle: { fill: '#f8fafc', fontSize: 12 } } }} 
               />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}