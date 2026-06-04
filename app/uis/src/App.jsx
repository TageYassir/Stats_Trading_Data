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

  // PCA
  const [pairsText, setPairsText] = useState('AAPL, MSFT, GOOGL, AMZN');
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

  // Reset page when new data arrives
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

  // Safe Data Mappers for ApexCharts
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

  // Line/Area Chart Configuration
  const lineOptions = {
    chart: { 
      type: 'area', 
      height: 400, 
      background: 'transparent',
      foreColor: '#94a3b8',
      toolbar: { show: true, tools: { zoom: true, pan: true, reset: true } }
    },
    colors: ['#089981'], // TradingView Green
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'straight', width: 2 },
    xaxis: { 
      type: 'datetime', // CRITICAL: Ensures X-axis renders as a timeline
      crosshairs: {
        show: true,
        width: 1,
        position: 'back',
        stroke: { color: '#64748b', width: 1, dashArray: 3 }
      },
      tooltip: { enabled: true, style: { background: '#1e293b' } }
    },
    yaxis: { 
      labels: { formatter: (val) => val.toFixed(2) },
      tooltip: { enabled: true }
    },
    grid: { borderColor: '#334155', strokeDashArray: 4 },
    tooltip: { 
      theme: 'dark',
      x: { format: 'dd MMM yyyy' },
      y: { formatter: (value) => value.toFixed(2) }
    }
  };

  // Candlestick Chart Configuration
  const candleOptions = {
    chart: { 
      type: 'candlestick', 
      height: 400, 
      background: 'transparent', 
      foreColor: '#94a3b8',
      toolbar: { show: true, tools: { zoom: true, pan: true, reset: true } }
    },
    xaxis: { 
      type: 'datetime', // CRITICAL: Ensures X-axis renders as a timeline
      tooltip: { enabled: true, style: { background: '#1e293b' } }
    },
    yaxis: { 
      tooltip: { enabled: true }, 
      labels: { formatter: (val) => val.toFixed(2) } 
    },
    grid: { borderColor: '#334155', strokeDashArray: 4 },
    plotOptions: { 
      candlestick: { 
        colors: { upward: '#089981', downward: '#f23645' }, // TradingView Hex Colors
        wick: { useFillColor: true } 
      } 
    },
    tooltip: { theme: 'dark' }
  };

  const renderChart = () => {
    if (paginatedData.length === 0) return <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>No data to display</div>;
    
    switch (chartType) {
      case 'candlestick':
        return <Chart options={candleOptions} series={[{ name: 'Candle', data: candleData }]} type="candlestick" height={400} />;
      default: 
        return <Chart options={lineOptions} series={[{ name: 'Close Price', data: lineData }]} type="area" height={400} />;
    }
  };

  // PCA Engine
  const handleComputePCA = async () => {
    setPcaLoading(true);
    setPcaError(null);
    const symbolsArray = pairsText.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
    
    if (symbolsArray.length < 2) {
      setPcaError('At least 2 symbols are required for PCA computation.');
      setPcaLoading(false);
      return;
    }
    
    try {
      const res = await fetch('http://localhost:8000/api/pca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: symbolsArray, period: pcaPeriod, interval: pcaInterval })
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

  const pcaLabels = pcaResults?.explained_variance_ratio?.map((_, i) => `PC ${i+1}`) || [];
  const pcaValues = pcaResults?.explained_variance_ratio?.map(v => Number((v*100).toFixed(2))) || [];

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
          <p style={{ color: '#94a3b8', marginBottom: 20 }}>
            Supports stocks (AAPL), Forex (EURUSD=X, GBPUSD=X), Gold (GC=F). Interval affects chart resolution.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' }}>
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
                  <h4 style={{ margin: 0, color: '#10b981' }}>
                    {symbol} - {intervals[dataInterval] || dataInterval}
                  </h4>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    Showing {paginatedData.length} of {stockData.length} points
                  </span>
                </div>
                {renderChart()}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                  <button onClick={() => setCurrentPage(p => Math.max(0, p-1))} disabled={currentPage === 0} style={{ padding: '6px 12px', background: currentPage === 0 ? '#1e293b' : '#334155', border: '1px solid #475569', borderRadius: 4, color: currentPage === 0 ? '#64748b' : '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}>
                    ◀ Previous
                  </button>
                  <span style={{ alignSelf: 'center', color: '#94a3b8', fontSize: 14 }}>Page {currentPage + 1} of {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages-1, p+1))} disabled={currentPage === totalPages-1} style={{ padding: '6px 12px', background: currentPage === totalPages-1 ? '#1e293b' : '#334155', border: '1px solid #475569', borderRadius: 4, color: currentPage === totalPages-1 ? '#64748b' : '#fff', cursor: currentPage === totalPages-1 ? 'not-allowed' : 'pointer' }}>
                    Next ▶
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Section 2: PCA */}
        <section style={{ backgroundColor: '#1e293b', borderRadius: 10, padding: 20, border: '1px solid #334155' }}>
          <h2 style={{ color: '#38bdf8', margin: '0 0 16px 0' }}>Workspace 02: PCA Covariance Engine</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <input type="text" value={pairsText} onChange={e => setPairsText(e.target.value)} placeholder="AAPL, MSFT, EURUSD=X, GC=F" style={{ background: '#334155', border: '1px solid #475569', color: '#fff', padding: 10, borderRadius: 6, fontFamily: 'monospace' }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <select value={pcaPeriod} onChange={e => setPcaPeriod(e.target.value)} style={{ flex: 1, padding: 8, background: '#334155', border: '1px solid #475569', borderRadius: 6, color: '#fff' }}>
                <option value="3mo">3 Months</option>
                <option value="6mo">6 Months</option>
                <option value="1y">1 Year</option>
                <option value="2y">2 Years</option>
              </select>
              <select value={pcaInterval} onChange={e => setPcaInterval(e.target.value)} style={{ flex: 1, padding: 8, background: '#334155', border: '1px solid #475569', borderRadius: 6, color: '#fff' }}>
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
            <div style={{ background: '#0f172a', borderRadius: 8, padding: 16 }}>
              <h4 style={{ color: '#38bdf8', marginTop: 0 }}>Explained Variance Ratio</h4>
              <BarChart 
                xAxis={[{ data: pcaLabels, scaleType: 'band' }]} 
                series={[{ data: pcaValues, label: 'Variance %', color: '#3b82f6' }]} 
                height={220} 
              />
            </div>
          )}
        </section>
        
      </div>
    </div>
  );
}