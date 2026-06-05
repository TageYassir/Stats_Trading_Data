import React, { useState } from 'react';

export default function CorrelationPage() {
  const [symbols, setSymbols] = useState(['AAPL', 'MSFT', 'GOOGL', 'AMZN']);
  const [newSymbol, setNewSymbol] = useState('');
  const [period, setPeriod] = useState('1y');
  const [interval, setIntervalValue] = useState('1d');
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddSymbol = (e) => {
    e.preventDefault();
    const clean = newSymbol.trim().toUpperCase();
    if (clean && !symbols.includes(clean)) {
      setSymbols([...symbols, clean]);
    }
    setNewSymbol('');
  };

  const handleComputeCorrelation = async () => {
    if (symbols.length < 2) { 
      setError('At least 2 symbols are required for correlation calculation.'); 
      return; 
    }
    
    setLoading(true); 
    setError(null);
    setResults(null);

    try {
      const res = await fetch('http://localhost:8000/api/correlation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols, period, interval })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error || 'Correlation matrix failed.');
      setResults(json);
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const getHeatmapColor = (value) => {
    if (value >= 0) {
      const alpha = Math.min(Math.abs(value), 1);
      return `rgba(16, 185, 129, ${alpha * 0.85 + 0.15})`; // Matching emerald green
    } else {
      const alpha = Math.min(Math.abs(value), 1);
      return `rgba(244, 63, 94, ${alpha * 0.85 + 0.15})`; // Matching rose red
    }
  };

  const inputStyle = { padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' };

  return (
    <div>
      <h2 style={{ color: '#a855f7', margin: '0 0 8px 0', fontSize: '22px' }}>Workspace 03: Correlation Matrix Engine</h2>
      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>Analyze Pearson correlation coefficients across selected assets.</p>
      
      {/* Configuration Section */}
      <div style={{ background: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '24px' }}>
        
        {/* Active Symbols */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {symbols.map(sym => (
            <div key={sym} style={{ background: '#a855f7', color: '#fff', padding: '6px 12px', borderRadius: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              {sym}
              <button onClick={() => setSymbols(symbols.filter(s => s !== sym))} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>×</button>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
          <form onSubmit={handleAddSymbol} style={{ display: 'flex', gap: '8px' }}>
            <input type="text" value={newSymbol} onChange={e => setNewSymbol(e.target.value)} placeholder="Add pair (e.g., GC=F)" style={{ ...inputStyle, width: '100%', fontFamily: 'monospace' }} />
            <button type="submit" style={{ background: '#334155', border: '1px solid #475569', borderRadius: '8px', padding: '0 20px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Add</button>
          </form>
          
          <select value={period} onChange={e => setPeriod(e.target.value)} style={inputStyle}>
            <option value="3mo">3 Months</option>
            <option value="6mo">6 Months</option>
            <option value="1y">1 Year</option>
            <option value="2y">2 Years</option>
          </select>
          
          <select value={interval} onChange={e => setIntervalValue(e.target.value)} style={inputStyle}>
            <option value="1d">Daily</option>
            <option value="1wk">Weekly</option>
          </select>
          
          <button onClick={handleComputeCorrelation} disabled={loading} style={{ background: '#a855f7', border: 'none', borderRadius: '8px', padding: '10px 24px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1, transition: 'background 0.2s', height: '100%' }}>
            {loading ? 'Processing...' : 'Compute Matrix'}
          </button>
        </div>
      </div>

      {error && <div style={{ background: '#7f1d1d40', border: '1px solid #7f1d1d', padding: '12px', borderRadius: '8px', marginBottom: '24px', color: '#f87171' }}>{error}</div>}

      {/* Results Table */}
      {results && (
        <div style={{ background: '#0f172a', borderRadius: '12px', padding: '24px', border: '1px solid #334155', overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '500px', textAlign: 'center', fontFamily: 'monospace', fontSize: '14px' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '2px solid #334155', padding: '12px', color: '#94a3b8' }}>Asset</th>
                {results.symbols.map(sym => (
                  <th key={sym} style={{ borderBottom: '2px solid #334155', padding: '12px', color: '#a855f7', fontWeight: 'bold' }}>{sym}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.symbols.map((rowSym, rowIndex) => (
                <tr key={rowSym}>
                  <td style={{ borderBottom: '1px solid #1e293b', borderRight: '2px solid #334155', padding: '12px', color: '#a855f7', fontWeight: 'bold', textAlign: 'left', background: '#0f172a' }}>{rowSym}</td>
                  {results.matrix[rowIndex].map((coefValue, colIndex) => {
                    const cellColor = getHeatmapColor(coefValue);
                    return (
                      <td key={colIndex} style={{ border: '1px solid #1e293b', padding: '12px', background: cellColor, color: '#fff', fontWeight: rowIndex === colIndex ? 'bold' : 'normal' }} title={`${rowSym} vs ${results.symbols[colIndex]}`}>
                        {coefValue.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}