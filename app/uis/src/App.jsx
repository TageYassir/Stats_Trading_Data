import React, { useEffect, useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart'; 
import Chart from 'react-apexcharts';

export default function App() {
  const [status, setStatus] = useState('loading');

  // Market data
  const [symbol, setSymbol] = useState('AAPL');
  const [dataPeriod, setDataPeriod] = useState('1y');
  const [dataInterval, setDataInterval] = useState('1d');
  const [stockData, setStockData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  
  // Chart type and pagination
  const [chartType, setChartType] = useState('candlestick'); 
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 100;

  // PCA State (MODIFIED: Now uses Arrays and a new symbol input)
  const [pcaSymbols, setPcaSymbols] = useState(['AAPL', 'MSFT', 'GOOGL', 'AMZN']);
  const [newPcaSymbol, setNewPcaSymbol] = useState('');
  const [pcaPeriod, setPcaPeriod] = useState('1y');
  const [pcaInterval, setPcaInterval] = useState('1d');
  const [pcaResults, setPcaResults] = useState(null);
  const [pcaLoading, setPcaLoading] = useState(false);
  const [pcaError, setPcaError] = useState(null);

  // Interval & period options
  const intervals = {
    '1h': '1 Hour', 
    '4h': '4 Hours', 
    '1d': 'Daily', 
    '1wk': 'Weekly'
  };
  
  const periods = {
    '1d': '1 Day', '5d': '5 Days', '1mo': '1 Month', '3mo': '3 Months',
    '6mo': '6 Months', '1y': '1 Year', '2y': '2 Years', '5y': '5 Years', 'max': 'Max'
  };

  // Health check
  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then(r => r.json())
      .then(j => setStatus(j.status || 'ok'))
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [stockData]);

  // Fetch data
  const handleFetchData = async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const url = `http://localhost:8000/api/fetch_yahoo?symbol=${encodeURIComponent(symbol)}&period=${dataPeriod}&interval=${dataInterval}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.data && json.data.prices) {
        setStockData(json.data.prices);
      } else {
        throw new Error('Unexpected data format received from backend.');
      }
    } catch (err) {
      setDataError(err.message);
      setStockData([]);
    } finally {
      setDataLoading(false);
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(stockData.length / itemsPerPage);
  const paginatedData = stockData.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const lineData = paginatedData.map(row => ({
    x: new Date(row.Date || row.date).getTime(),
    y: Number(row.Close || row.close || 0)
  }));

  const candleData = paginatedData.map(row => ({
    x: new Date(row.Date || row.date).getTime(),
    y: [
      Number(row.Open || row.open || row.Close || row.close || 0),
      Number(row.High || row.high || row.Close || row.close || 0),
      Number(row.Low || row.low || row.Close || row.close || 0),
      Number(row.Close || row.close || 0)
    ]
  }));

const lineOptions = {
    chart: { 
      type: 'area', 
      height: 400, 
      background: 'transparent', 
      foreColor: '#94a3b8', 
      toolbar: { show: true },
      animations: { enabled: false } // Speeds up hover responsiveness on large datasets
    },
    colors: ['#089981'],
    fill: { 
      type: 'gradient', 
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } 
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'straight', width: 2 },
    
    // 1. ADD MARKERS FOR HOVER
    markers: {
      size: 0, // Keep the line clean normally
      hover: {
        size: 5, // Show a 5px dot when hovering
        sizeOffset: 3
      }
    },
    
    xaxis: { 
      type: 'datetime', 
      // 2. ADD A TRADINGVIEW-STYLE CROSSHAIR
      crosshairs: { 
        show: true,
        stroke: { color: '#64748b', width: 1, dashArray: 4 }
      },
      tooltip: { enabled: false } // Turn off the bulky bottom X-axis tooltip
    },
    
    yaxis: { 
      labels: { formatter: (val) => val.toFixed(2) }, 
    },
    grid: { borderColor: '#334155', strokeDashArray: 4 },
    
    // 3. FIX TOOLTIP INTERACTION
    tooltip: { 
      theme: 'dark', 
      shared: true,      // Triggers for all series on the X-axis
      intersect: false,  // You don't have to touch the exact pixel of the line
      x: { format: 'dd MMM yyyy HH:mm' }, // Added HH:mm for intraday intervals
      y: { formatter: (value) => value ? value.toFixed(2) : value } 
    }
  };
// Candlestick Chart Configuration
  const candleOptions = {
    chart: { 
      type: 'candlestick', 
      height: 400, 
      background: 'transparent', 
      foreColor: '#94a3b8',
      toolbar: { show: true },
      animations: { enabled: false } // Speeds up hover performance
    },
    xaxis: { 
      type: 'datetime',
      crosshairs: { 
        show: true,
        stroke: { color: '#64748b', width: 1, dashArray: 4 }
      },
      tooltip: { enabled: false } // Disable bottom tooltip to keep UI clean
    },
    yaxis: { 
      tooltip: { enabled: false }, 
      labels: { formatter: (val) => val.toFixed(2) } 
    },
    grid: { borderColor: '#334155', strokeDashArray: 4 },
    plotOptions: { 
      candlestick: { 
        colors: { upward: '#089981', downward: '#f23645' },
        wick: { useFillColor: true } 
      } 
    },
    
    // THE NEW CUSTOM TOOLTIP
    tooltip: { 
      theme: 'dark',
      custom: function({ seriesIndex, dataPointIndex, w }) {
        // Extract the OHLC data from ApexCharts internal globals
        const o = w.globals.seriesCandleO[seriesIndex][dataPointIndex];
        const h = w.globals.seriesCandleH[seriesIndex][dataPointIndex];
        const l = w.globals.seriesCandleL[seriesIndex][dataPointIndex];
        const c = w.globals.seriesCandleC[seriesIndex][dataPointIndex];
        const timestamp = w.globals.seriesX[seriesIndex][dataPointIndex];
        
        // Safety check if data is missing
        if (o === undefined || o === null) return '';

        // Format the date/time nicely
        const dateStr = new Date(timestamp).toLocaleString(undefined, { 
          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
        });

        // Determine if the candle is Bullish (Green) or Bearish (Red)
        const isBullish = c >= o;
        const color = isBullish ? '#089981' : '#f23645';

        // Return a clean HTML template for the tooltip box
        return `
          <div style="padding: 10px; background: #1e293b; border: 1px solid #334155; border-radius: 6px; min-width: 130px;">
            <div style="font-size: 11px; color: #94a3b8; border-bottom: 1px solid #334155; padding-bottom: 6px; margin-bottom: 8px; text-align: center;">
              ${dateStr}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-family: monospace; margin-bottom: 4px;">
              <span style="color: #94a3b8;">O</span> <span style="color: #f8fafc;">${o.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-family: monospace; margin-bottom: 4px;">
              <span style="color: #94a3b8;">H</span> <span style="color: #f8fafc;">${h.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-family: monospace; margin-bottom: 4px;">
              <span style="color: #94a3b8;">L</span> <span style="color: #f8fafc;">${l.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-family: monospace;">
              <span style="color: #94a3b8;">C</span> <span style="color: ${color}; font-weight: bold;">${c.toFixed(2)}</span>
            </div>
          </div>
        `;
      }
    }
  };

  const renderChart = () => {
    if (paginatedData.length === 0) return <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No data to display</div>;
    return chartType === 'candlestick' 
      ? <Chart options={candleOptions} series={[{ name: 'Candle', data: candleData }]} type="candlestick" height={400} />
      : <Chart options={lineOptions} series={[{ name: 'Close Price', data: lineData }]} type="area" height={400} />;
  };

  // MODIFIED: PCA Handlers for Tags
  const handleAddPcaSymbol = (e) => {
    e.preventDefault();
    const clean = newPcaSymbol.trim().toUpperCase();
    if (clean && !pcaSymbols.includes(clean)) {
      setPcaSymbols([...pcaSymbols, clean]);
    }
    setNewPcaSymbol('');
  };

  const handleRemovePcaSymbol = (symToRemove) => {
    setPcaSymbols(pcaSymbols.filter(sym => sym !== symToRemove));
  };

  // PCA Engine
  const handleComputePCA = async () => {
    setPcaLoading(true);
    setPcaError(null);
    
    if (pcaSymbols.length < 2) {
      setPcaError('At least 2 symbols are required for PCA computation.');
      setPcaLoading(false);
      return;
    }
    
    try {
      const res = await fetch('http://localhost:8000/api/pca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: pcaSymbols, period: pcaPeriod, interval: pcaInterval })
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error || 'PCA computation failed.');
      
      setPcaResults(json);
    } catch (err) {
      setPcaError(err.message);
    } finally {
      setPcaLoading(false);
    }
  };

  // MODIFIED: Setup data for both PCA charts
  const pcaLabels = pcaResults?.explained_variance_ratio?.map((_, i) => `PC ${i+1}`) || [];
  const pcaValues = pcaResults?.explained_variance_ratio?.map(v => Number((v*100).toFixed(2))) || [];
  
  const validPcaSymbols = pcaResults?.symbols || [];
  const pc1Weights = pcaResults?.components?.[0]?.map((val) => Number(val.toFixed(3))) || [];

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: 16, marginBottom: 24 }}>
        <h1 style={{ fontSize: 22 }}>Quantitative Trading Terminal</h1>
        <p>API: <span style={{ color: status === 'ok' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{status.toUpperCase()}</span></p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Section 1: Market Data */}
        <section style={{ backgroundColor: '#1e293b', borderRadius: 10, padding: 20, border: '1px solid #334155' }}>
          <h2 style={{ color: '#38bdf8', margin: '0 0 6px 0' }}>Workspace 01: Historical Ticker Extraction</h2>
          <p style={{ color: '#94a3b8', marginBottom: 20 }}>Supports stocks (AAPL), Forex (EURUSD=X, GBPUSD=X), Gold (GC=F). Interval affects chart resolution.</p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
            {/* Same as before... */}
            <div style={{ minWidth: 120, flex: 1 }}>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Symbol</label>
              <input type="text" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} style={{ width: '100%', padding: 8, background: '#334155', border: '1px solid #475569', borderRadius: 6, color: '#fff' }} />
            </div>
            <div style={{ minWidth: 120, flex: 1 }}>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Period</label>
              <select value={dataPeriod} onChange={e => setDataPeriod(e.target.value)} style={{ width: '100%', padding: 8, background: '#334155', border: '1px solid #475569', borderRadius: 6, color: '#fff' }}>
                {Object.entries(periods).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
            <div style={{ minWidth: 120, flex: 1 }}>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Interval</label>
              <select value={dataInterval} onChange={e => setDataInterval(e.target.value)} style={{ width: '100%', padding: 8, background: '#334155', border: '1px solid #475569', borderRadius: 6, color: '#fff' }}>
                {Object.entries(intervals).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
            <div style={{ minWidth: 120, flex: 1 }}>
              <label style={{ fontSize: 11, color: '#94a3b8' }}>Chart Type</label>
              <select value={chartType} onChange={e => setChartType(e.target.value)} style={{ width: '100%', padding: 8, background: '#334155', border: '1px solid #475569', borderRadius: 6, color: '#fff' }}>
                <option value="line">Line / Area Trace</option>
                <option value="candlestick">Candlestick</option>
              </select>
            </div>
            <button onClick={handleFetchData} disabled={dataLoading} style={{ background: '#3b82f6', border: 'none', borderRadius: 6, padding: '8px 20px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', height: 38, opacity: dataLoading ? 0.7 : 1 }}>
              {dataLoading ? 'Fetching...' : 'Fetch Data'}
            </button>
          </div>

          {dataError && <div style={{ background: '#7f1d1d40', border: '1px solid #7f1d1d', padding: 10, borderRadius: 6, marginBottom: 16, color: '#f87171' }}>{dataError}</div>}

          {stockData.length > 0 && (
            <>
              <div style={{ background: '#0f172a', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, color: '#10b981' }}>{symbol} - {intervals[dataInterval] || dataInterval}</h4>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Showing {paginatedData.length} of {stockData.length} points</span>
                </div>
                {renderChart()}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                  <button onClick={() => setCurrentPage(p => Math.max(0, p-1))} disabled={currentPage === 0} style={{ padding: '6px 12px', background: currentPage === 0 ? '#1e293b' : '#334155', border: '1px solid #475569', borderRadius: 4, color: currentPage === 0 ? '#64748b' : '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}>◀ Previous</button>
                  <span style={{ alignSelf: 'center', color: '#94a3b8', fontSize: 14 }}>Page {currentPage + 1} of {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages-1, p+1))} disabled={currentPage === totalPages-1} style={{ padding: '6px 12px', background: currentPage === totalPages-1 ? '#1e293b' : '#334155', border: '1px solid #475569', borderRadius: 4, color: currentPage === totalPages-1 ? '#64748b' : '#fff', cursor: currentPage === totalPages-1 ? 'not-allowed' : 'pointer' }}>Next ▶</button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Section 2: PCA (MODIFIED WITH TAGS AND DUAL CHARTS) */}
        <section style={{ backgroundColor: '#1e293b', borderRadius: 10, padding: 20, border: '1px solid #334155' }}>
          <h2 style={{ color: '#38bdf8', margin: '0 0 16px 0' }}>Workspace 02: PCA Covariance Engine</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            
            {/* Tag / Pill Display */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {pcaSymbols.map(sym => (
                <div key={sym} style={{ background: '#3b82f6', color: '#fff', padding: '4px 10px', borderRadius: '14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {sym}
                  <button onClick={() => handleRemovePcaSymbol(sym)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontSize: '14px', fontWeight: 'bold' }}>×</button>
                </div>
              ))}
            </div>

            {/* Input Controls */}
            <div style={{ display: 'flex', gap: 12 }}>
              <form onSubmit={handleAddPcaSymbol} style={{ flex: 2, display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={newPcaSymbol} 
                  onChange={e => setNewPcaSymbol(e.target.value)} 
                  placeholder="Add pair (e.g., TSLA)" 
                  style={{ width: '100%', background: '#334155', border: '1px solid #475569', color: '#fff', padding: '8px 12px', borderRadius: 6, fontFamily: 'monospace' }} 
                />
                <button type="submit" style={{ background: '#475569', border: 'none', borderRadius: 6, padding: '0 16px', color: '#fff', cursor: 'pointer' }}>Add</button>
              </form>

              <select value={pcaPeriod} onChange={e => setPcaPeriod(e.target.value)} style={{ flex: 1, padding: 8, background: '#334155', border: '1px solid #475569', borderRadius: 6, color: '#fff' }}>
                <option value="1mo">1 Month</option>
                <option value="3mo">3 Months</option>
                <option value="6mo">6 Months</option>
                <option value="1y">1 Year</option>
                <option value="2y">2 Years</option>
              </select>

              <select value={pcaInterval} onChange={e => setPcaInterval(e.target.value)} style={{ flex: 1, padding: 8, background: '#334155', border: '1px solid #475569', borderRadius: 6, color: '#fff' }}>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">Daily</option>
                <option value="1wk">Weekly</option>
              </select>

              <button onClick={handleComputePCA} disabled={pcaLoading} style={{ background: '#10b981', border: 'none', borderRadius: 6, padding: '8px 20px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', opacity: pcaLoading ? 0.7 : 1 }}>
                {pcaLoading ? 'Processing...' : 'Compute PCA'}
              </button>
            </div>
          </div>
          
          {pcaError && <div style={{ background: '#7f1d1d40', border: '1px solid #7f1d1d', padding: 10, borderRadius: 6, marginBottom: 16, color: '#f87171' }}>{pcaError}</div>}
          
          {pcaResults && pcaValues.length > 0 && (
            <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
              
              {/* Chart 1: Explained Variance */}
              <div style={{ background: '#0f172a', borderRadius: 8, padding: 16, border: '1px solid #334155' }}>
                <h4 style={{ color: '#38bdf8', margin: '0 0 4px 0' }}>Explained Variance Ratio</h4>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 12px 0' }}>Percentage of market movement explained by each component.</p>
                <BarChart 
                  xAxis={[{ data: pcaLabels, scaleType: 'band', tickLabelStyle: { fill: '#94a3b8' } }]} 
                  series={[{ data: pcaValues, label: 'Variance %', color: '#3b82f6' }]} 
                  height={220}
                  slotProps={{ legend: { labelStyle: { fill: '#f8fafc' } } }}
                />
              </div>

              {/* Chart 2: PC1 Loadings */}
              <div style={{ background: '#0f172a', borderRadius: 8, padding: 16, border: '1px solid #334155' }}>
                <h4 style={{ color: '#10b981', margin: '0 0 4px 0' }}>Component 1 (PC1) Asset Weights</h4>
                <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 12px 0' }}>How much each specific ticker influences the primary trend.</p>
                <BarChart 
                  xAxis={[{ data: validPcaSymbols, scaleType: 'band', tickLabelStyle: { fill: '#94a3b8' } }]} 
                  series={[{ data: pc1Weights, label: 'Weight Score', color: '#10b981' }]} 
                  height={220}
                  slotProps={{ legend: { labelStyle: { fill: '#f8fafc' } } }}
                />
              </div>

            </div>
          )}
        </section>
        
      </div>
    </div>
  );
}