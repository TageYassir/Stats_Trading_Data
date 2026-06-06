import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';

export default function StatisticsPage() {
  const [symbol, setSymbol] = useState(() => localStorage.getItem('stats_symbol') || 'AAPL');
  const [period, setPeriod] = useState(() => localStorage.getItem('stats_period') || '1y');
  const [interval, setIntervalValue] = useState(() => localStorage.getItem('stats_interval') || '1d');
  const [riskFreeRate, setRiskFreeRate] = useState(() => Number(localStorage.getItem('stats_riskFreeRate')) || 0);

  const [results, setResults] = useState(() => {
    const saved = localStorage.getItem('stats_results');
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const intervals = {
    '1h': '1 Hour',
    '4h': '4 Hours',
    '1d': 'Daily',
    '1wk': 'Weekly',
    '1mo': 'Monthly'
  };

  const periods = {
    '1mo': '1 Month',
    '3mo': '3 Months',
    '6mo': '6 Months',
    '1y': '1 Year',
    '2y': '2 Years',
    '5y': '5 Years',
    'max': 'Max'
  };

  useEffect(() => {
    localStorage.setItem('stats_symbol', symbol);
    localStorage.setItem('stats_period', period);
    localStorage.setItem('stats_interval', interval);
    localStorage.setItem('stats_riskFreeRate', riskFreeRate);
    localStorage.setItem('stats_results', JSON.stringify(results));
  }, [symbol, period, interval, riskFreeRate, results]);

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none'
  };

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('http://localhost:8000/api/statistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          period,
          interval,
          risk_free_rate: Number(riskFreeRate)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Statistics calculation failed');
      }

      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!results) return;

    const blob = new Blob(
      [JSON.stringify(results, null, 2)],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${results.symbol}_statistics.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return Number(value).toFixed(4);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return `${(Number(value) * 100).toFixed(2)}%`;
  };

  const stats = results?.statistics || {};
  const returns = results?.returns || [];

  const returnsChartData = returns.map(row => ({
    x: new Date(row.Date).getTime(),
    y: Number((row.Return * 100).toFixed(4))
  }));

  const returnsOptions = {
    chart: {
      type: 'area',
      height: 350,
      background: 'transparent',
      foreColor: '#94a3b8',
      toolbar: { show: true },
      animations: { enabled: false }
    },
    colors: ['#38bdf8'],
    dataLabels: { enabled: false },
    stroke: {
      curve: 'straight',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 100]
      }
    },
    xaxis: {
      type: 'datetime'
    },
    yaxis: {
      labels: {
        formatter: (val) => `${Number(val).toFixed(2)}%`
      }
    },
    grid: {
      borderColor: '#334155',
      strokeDashArray: 4
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val) => `${Number(val).toFixed(4)}%`
      }
    }
  };

  const Card = ({ title, value, color = '#f8fafc' }) => (
    <div style={{
      background: '#0f172a',
      border: '1px solid #334155',
      borderRadius: '10px',
      padding: '18px'
    }}>
      <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>{title}</p>
      <h3 style={{ color, margin: '8px 0 0 0', fontSize: '20px' }}>{value}</h3>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ color: '#f59e0b', margin: '0 0 8px 0', fontSize: '22px' }}>
            Workspace 04: Statistical Analysis
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>
            Compute descriptive and risk statistics using Yahoo Finance historical prices.
          </p>
        </div>

        {results && (
          <button
            onClick={handleDownloadJSON}
            style={{
              background: '#334155',
              border: '1px solid #475569',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            📥 Download Statistics
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
          alignItems: 'end'
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>
            Symbol
          </label>
          <input
            type="text"
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>
            Period
          </label>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={inputStyle}>
            {Object.entries(periods).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>
            Interval
          </label>
          <select value={interval} onChange={e => setIntervalValue(e.target.value)} style={inputStyle}>
            {Object.entries(intervals).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>
            Risk-Free Rate
          </label>
          <input
            type="number"
            step="0.01"
            value={riskFreeRate}
            onChange={e => setRiskFreeRate(e.target.value)}
            style={inputStyle}
          />
        </div>

        <button
          onClick={fetchStatistics}
          disabled={loading}
          style={{
            background: '#f59e0b',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            color: '#0f172a',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            height: '40px',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Computing...' : 'Compute Statistics'}
        </button>
      </div>

      {error && (
        <div style={{
          background: '#7f1d1d40',
          border: '1px solid #7f1d1d',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '24px',
          color: '#f87171'
        }}>
          {error}
        </div>
      )}

      {results && (
        <>
          <div style={{
            background: '#0f172a',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #334155',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: '18px' }}>
              {results.symbol} Statistical Summary
              <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 'normal' }}>
                {' '}| {results.period} | {results.interval} | {results.rows} rows
              </span>
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px'
            }}>
              <Card title="Mean Close" value={formatNumber(stats.mean_close)} color="#10b981" />
              <Card title="Median Close" value={formatNumber(stats.median_close)} color="#10b981" />
              <Card title="Std Close" value={formatNumber(stats.std_close)} color="#38bdf8" />
              <Card title="Variance Close" value={formatNumber(stats.variance_close)} color="#38bdf8" />
              <Card title="Min Close" value={formatNumber(stats.min_close)} color="#f23645" />
              <Card title="Max Close" value={formatNumber(stats.max_close)} color="#10b981" />
              <Card title="Average Return" value={formatPercent(stats.average_return)} color="#f59e0b" />
              <Card title="Annualized Return" value={formatPercent(stats.annualized_return)} color="#f59e0b" />
              <Card title="Volatility" value={formatPercent(stats.volatility)} color="#a855f7" />
              <Card title="Cumulative Return" value={formatPercent(stats.cumulative_return)} color="#10b981" />
              <Card title="Max Drawdown" value={formatPercent(stats.max_drawdown)} color="#f23645" />
              <Card title="Sharpe Ratio" value={formatNumber(stats.sharpe_ratio)} color="#38bdf8" />
              <Card title="Skewness" value={formatNumber(stats.skewness)} color="#f8fafc" />
              <Card title="Kurtosis" value={formatNumber(stats.kurtosis)} color="#f8fafc" />
            </div>
          </div>

          <div style={{
            background: '#0f172a',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #334155',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8', fontSize: '18px' }}>
              Returns Evolution
            </h3>

            <Chart
              options={returnsOptions}
              series={[{ name: 'Return (%)', data: returnsChartData }]}
              type="area"
              height={350}
            />
          </div>

          <div style={{
            background: '#0f172a',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #334155'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: '18px' }}>
              Interpretation
            </h3>

            <ul style={{ color: '#94a3b8', lineHeight: '1.8', margin: 0 }}>
              <li>
                A high volatility means the asset has stronger price fluctuations.
              </li>
              <li>
                A positive cumulative return means the asset increased over the selected period.
              </li>
              <li>
                A negative max drawdown shows the worst historical decline from a previous peak.
              </li>
              <li>
                A higher Sharpe ratio means better return compared to risk.
              </li>
              <li>
                Skewness and kurtosis describe the shape and extremity of return distribution.
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}