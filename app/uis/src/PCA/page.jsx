import React, { useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';

export default function PCA() {
  // New Array-based state for symbols
  const [symbols, setSymbols] = useState(['AAPL', 'MSFT', 'GOOGL', 'AMZN']);
  const [newSymbol, setNewSymbol] = useState('');
  
  const [period, setPeriod] = useState('1y');
  const [interval, setIntervalValue] = useState('1d');
  
  const [pcaResults, setPcaResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle adding a new symbol to the list
  const handleAddSymbol = (e) => {
    e.preventDefault();
    const cleanSymbol = newSymbol.trim().toUpperCase();
    if (cleanSymbol && !symbols.includes(cleanSymbol)) {
      setSymbols([...symbols, cleanSymbol]);
    }
    setNewSymbol('');
  };

  // Handle removing a symbol from the list
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
        body: JSON.stringify({
          symbols: symbols,
          period: period,
          interval: interval
        }),
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

  // Chart 1: Variance Data
  const chartLabels = pcaResults?.explained_variance_ratio?.map((_, idx) => `PC ${idx + 1}`) || [];
  const chartVarianceValues = pcaResults?.explained_variance_ratio?.map((val) => Number((val * 100).toFixed(2))) || [];

  // Chart 2: PC1 Loadings (How much each stock contributes to the main trend)
  const pc1Weights = pcaResults?.components?.[0]?.map((val) => Number(val.toFixed(3))) || [];
  const validSymbols = pcaResults?.symbols || [];

  return (
    <div>
      <h2 style={{ marginTop: 0, fontSize: '20px', color: '#f8fafc' }}>Multi-Pair PCA Analysis Terminal</h2>
      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>Analyze overlapping trend components across a selection of ticker fields.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        
        {/* Symbol Input Area */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Target Assets</label>
          
          {/* Symbol Tags/Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            {symbols.map(sym => (
              <div key={sym} style={{ background: '#3b82f6', color: '#fff', padding: '4px 10px', borderRadius: '14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {sym}
                <button onClick={() => handleRemoveSymbol(sym)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontSize: '14px', fontWeight: 'bold' }}>×</button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSymbol} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Add symbol (e.g., TSLA)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              style={{ backgroundColor: '#334155', border: '1px solid #475569', color: '#fff', padding: '10px', borderRadius: '6px', flex: 1, fontFamily: 'monospace' }}
            />
            <button type="submit" style={{ backgroundColor: '#475569', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 16px', cursor: 'pointer' }}>Add Pair</button>
          </form>
        </div>

        {/* Timeframe Controls */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: '1' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Period Scope</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ backgroundColor: '#334155', border: '1px solid #475569', color: '#fff', padding: '10px', borderRadius: '6px', width: '100%' }}>
              <option value="1mo">1 Month</option>
              <option value="3mo">3 Months</option>
              <option value="6mo">6 Months</option>
              <option value="1y">1 Year</option>
              <option value="2y">2 Years</option>
            </select>
          </div>
          <div style={{ flex: '1' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Interval Bar</label>
            <select value={interval} onChange={(e) => setIntervalValue(e.target.value)} style={{ backgroundColor: '#334155', border: '1px solid #475569', color: '#fff', padding: '10px', borderRadius: '6px', width: '100%' }}>
              <option value="1h">1 Hour (1h)</option>
              <option value="4h">4 Hours (4h)</option>
              <option value="1d">Daily (1d)</option>
              <option value="1wk">Weekly (1wk)</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handleComputePCA}
        disabled={loading}
        style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '12px 24px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Factoring Components...' : 'Extract Covariance Structure'}
      </button>

      {error && <div style={{ color: '#f87171', padding: '12px', backgroundColor: '#7f1d1d40', borderRadius: '6px', border: '1px solid #7f1d1d', marginTop: '20px' }}>{error}</div>}

      {pcaResults && (
        <div style={{ marginTop: '25px', padding: '20px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
          
          {/* CHART 1: Explained Variance */}
          <h3 style={{ margin: '0 0 6px 0', color: '#38bdf8', fontSize: '16px' }}>PCA Factor Variance Distribution</h3>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 16px 0' }}>Shows how much total market movement is explained by each Principal Component.</p>
          
          <div style={{ width: '100%', height: 260, background: '#1e293b', borderRadius: '6px', padding: '10px', boxSizing: 'border-box', marginBottom: '30px' }}>
            <BarChart
              xAxis={[{ data: chartLabels, scaleType: 'band', tickLabelStyle: { fill: '#94a3b8' } }]}
              series={[{ data: chartVarianceValues, label: 'Explained Variance (%)', color: '#3b82f6' }]}
              height={240}
              margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
              slotProps={{ legend: { labelStyle: { fill: '#f8fafc' } } }}
            />
          </div>

          {/* CHART 2: PC1 Loadings (Suggested Result) */}
          <h3 style={{ margin: '0 0 6px 0', color: '#10b981', fontSize: '16px' }}>Component 1 (PC1) Asset Weights</h3>
          <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 16px 0' }}>Identifies which specific assets are driving the primary market trend (PC1).</p>

          <div style={{ width: '100%', height: 260, background: '#1e293b', borderRadius: '6px', padding: '10px', boxSizing: 'border-box', marginBottom: '20px' }}>
             <BarChart
              xAxis={[{ data: validSymbols, scaleType: 'band', tickLabelStyle: { fill: '#94a3b8' } }]}
              series={[{ data: pc1Weights, label: 'PC1 Loading Weight', color: '#10b981' }]}
              height={240}
              margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
              slotProps={{ legend: { labelStyle: { fill: '#f8fafc' } } }}
            />
          </div>

        </div>
      )}
    </div>
  );
}