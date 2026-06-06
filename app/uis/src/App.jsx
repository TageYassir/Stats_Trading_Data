import React, { useEffect, useState } from 'react';
import HomePage from './home/page'; // Adjust path if needed
import DataPage from './data/page';
import PCAPage from './PCA/page';
import CorrelationPage from './correlation/page';
import StatisticsPage from './statistics/page';

export default function App() {
  const [status, setStatus] = useState('loading');
  const [activeTab, setActiveTab] = useState('home'); // Default to home

  // Global Health check
  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then(r => r.json())
      .then(j => setStatus(j.status || 'ok'))
      .catch(() => setStatus('error'));
  }, []);

  const navItems = [
  { id: 'home', label: 'Home', color: '#f8fafc' },
  { id: 'data', label: '1. Data Ingestion', color: '#10b981' },
  { id: 'pca', label: '2. PCA Engine', color: '#38bdf8' },
  { id: 'correlation', label: '3. Correlation Matrix', color: '#a855f7' },
  { id: 'statistics', label: '4. Statistics', color: '#f59e0b' }
];

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: '32px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Global Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '20px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px 0', fontWeight: '800', tracking: '-0.5px' }}>Quantitative Terminal</h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>Advanced Market Analysis System</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', padding: '8px 16px', borderRadius: '24px', border: '1px solid #334155', fontSize: '13px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: status === 'ok' ? '#10b981' : '#ef4444' }}></div>
          API Status: <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{status.toUpperCase()}</span>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
        {navItems.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            style={{ 
              padding: '12px 24px', 
              background: activeTab === tab.id ? '#1e293b' : 'transparent', 
              border: '1px solid',
              borderColor: activeTab === tab.id ? '#334155' : 'transparent',
              borderRadius: '8px',
              color: activeTab === tab.id ? tab.color : '#64748b', 
              fontSize: '15px', 
              fontWeight: '600', 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render Active Workspace */}
      <main style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '32px', border: '1px solid #334155', minHeight: '60vh', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'data' && <DataPage />}
        {activeTab === 'pca' && <PCAPage />}
        {activeTab === 'correlation' && <CorrelationPage />}
        {activeTab === 'statistics' && <StatisticsPage />}
      </main>
    </div>
  );
}