import React from 'react';

export default function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ background: '#1e293b', padding: '40px', borderRadius: '16px', border: '1px solid #334155', maxWidth: '600px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ fontSize: '36px', color: '#f8fafc', margin: '0 0 16px 0', fontWeight: 'bold' }}>
          Hi to our Statistic App! 👋
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
          Welcome to your Advanced Market Analysis System. This quantitative terminal is designed to help you extract historical tickers, perform PCA, and analyze Pearson correlation matrices across various assets.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <span style={{ background: '#0f172a', border: '1px solid #334155', padding: '8px 16px', borderRadius: '20px', color: '#10b981', fontSize: '13px', fontWeight: 'bold' }}>
            Data Ingestion Ready
          </span>
          <span style={{ background: '#0f172a', border: '1px solid #334155', padding: '8px 16px', borderRadius: '20px', color: '#a855f7', fontSize: '13px', fontWeight: 'bold' }}>
            Matrix Engine Online
          </span>
        </div>
      </div>
    </div>
  );
}