import React, { useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';

export default function DataPage() {
  const [symbol, setSymbol] = useState('AAPL');
  const [period, setPeriod] = useState('1y');
  const [interval, setIntervalValue] = useState('1d');
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Available intervals for yfinance
  const availableIntervals = {
    '1m': '1 Minute',
    '5m': '5 Minutes',
    '15m': '15 Minutes',
    '30m': '30 Minutes',
    '45m': '45 Minutes',
    '1h': '1 Hour',
    '90m': '90 Minutes',
    '2h': '2 Hours',
    '4h': '4 Hours',
    '1d': 'Daily',
    '5d': '5 Days',
    '1wk': 'Weekly',
    '1mo': 'Monthly'
  };

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `http://localhost:8000/api/fetch_yahoo?symbol=${symbol.toUpperCase()}&period=${period}&interval=${interval}`;
      console.log("Fetching URL:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received data:", data);
      
      // Extract the prices array from the response
      if (data.data && data.data.prices) {
        setStockData(data.data.prices);
      } else if (Array.isArray(data)) {
        setStockData(data);
      } else {
        setStockData([]);
        throw new Error('Unexpected data format from server');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      setStockData([]);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data safely
  const chartDates = stockData.map((row, idx) => row.Date || row.date || String(idx));
  const chartPrices = stockData.map((row) => Number(row.Close || row.close || 0));

  return (
    <div>
      <h2 style={{ marginTop: 0, fontSize: '20px', color: '#f8fafc' }}>Market Data Ingestion & Charts</h2>
      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
        Query stocks (AAPL, MSFT, GOOGL) or Forex (EURUSD, GBPUSD, XAUUSD)
      </p>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '30px', alignItems: 'flex-end' }}>
        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Ticker Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="AAPL, EURUSD, XAUUSD"
            style={{ backgroundColor: '#334155', border: '1px solid #475569', color: '#fff', padding: '10px', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Period Horizon</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ backgroundColor: '#334155', border: '1px solid #475569', color: '#fff', padding: '10px', borderRadius: '6px', width: '100%' }}>
            <option value="1d">1 Day</option>
            <option value="5d">5 Days</option>
            <option value="1mo">1 Month</option>
            <option value="3mo">3 Months</option>
            <option value="6mo">6 Months</option>
            <option value="1y">1 Year</option>
            <option value="2y">2 Years</option>
            <option value="5y">5 Years</option>
            <option value="max">Max</option>
          </select>
        </div>

        <div style={{ flex: '1', minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Timeframe Resolution</label>
          <select value={interval} onChange={(e) => setIntervalValue(e.target.value)} style={{ backgroundColor: '#334155', border: '1px solid #475569', color: '#fff', padding: '10px', borderRadius: '6px', width: '100%' }}>
            {Object.entries(availableIntervals).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleFetchData}
          style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '12px 24px', cursor: 'pointer', fontWeight: '600' }}
          disabled={loading}
        >
          {loading ? 'Fetching...' : 'Load & Plot Data'}
        </button>
      </div>

      {error && (
        <div style={{ color: '#f87171', padding: '12px', backgroundColor: '#7f1d1d40', borderRadius: '6px', border: '1px solid #7f1d1d', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      {/* Display info for Forex pairs */}
      {symbol.match(/^(EURUSD|GBPUSD|USDJPY|XAUUSD|XAGUSD)/i) && stockData.length > 0 && (
        <div style={{ backgroundColor: '#1e293b', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
          <span style={{ color: '#38bdf8' }}>ℹ️ Forex/Commodity data loaded successfully</span>
        </div>
      )}

      {/* RENDER LINE CHART VIEW */}
      {stockData.length > 0 && (
        <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '16px', marginBottom: '25px', border: '1px solid #334155' }}>
          <h3 style={{ fontSize: '15px', color: '#38bdf8', margin: '0 0 12px 0' }}>
            {symbol.toUpperCase()} - {availableIntervals[interval] || interval} Chart
          </h3>
          <div style={{ width: '100%', height: 300, background: '#1e293b', borderRadius: '6px', padding: '10px', boxSizing: 'border-box' }}>
            <LineChart
              xAxis={[{ data: chartDates, scaleType: 'point', hideTooltip: false }]}
              series={[{ data: chartPrices, label: symbol.includes('USD') ? 'Price' : 'Close Price ($)', color: '#10b981', showMark: false }]}
              height={280}
              margin={{ left: 50, right: 20, top: 20, bottom: 50 }}
            />
          </div>
        </div>
      )}

      {/* DATA PREVIEW TABLE */}
      {stockData.length > 0 && (
        <div>
          <h3 style={{ fontSize: '15px', marginBottom: '12px' }}>Data Preview (Last 20 rows)</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ backgroundColor: '#334155', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Date/Time</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {stockData.slice(-20).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '10px', color: '#94a3b8' }}>{row.Date || row.date || i}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#10b981', fontWeight: '500' }}>
                      {(row.Close || row.close || 0).toFixed(5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}