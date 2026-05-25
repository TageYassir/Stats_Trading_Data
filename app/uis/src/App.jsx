import React, { useEffect, useState } from 'react'
import Home from './pages/Home'
import PCA from './pages/PCA'

export default function App() {
  const [status, setStatus] = useState('loading')
  const [page, setPage] = useState('home')

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((j) => setStatus(j.status))
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div style={{fontFamily:'Arial, sans-serif', padding:20}}>
      <h1>FastAPI + React</h1>
      <p>API status: <strong>{status}</strong></p>

      <nav style={{marginBottom:12}}>
        <button onClick={() => setPage('home')} style={{marginRight:8}}>Home</button>
        <button onClick={() => setPage('pca')}>PCA</button>
      </nav>

      <div style={{borderTop:'1px solid #ddd', paddingTop:12}}>
        {page === 'home' && <Home />}
        {page === 'pca' && <PCA />}
      </div>
    </div>
  )
}
