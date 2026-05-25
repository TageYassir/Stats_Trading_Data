import React, { useState, useEffect } from 'react'

export default function Home() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/fetch_yahoo')
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .catch(() => setData(null))
  }, [])

  if (!data) return <div>Loading home data...</div>

  return (
    <div>
      <h2>Home</h2>
      <div><strong>Symbol:</strong> {data.symbol}</div>
      <div><strong>Prices:</strong> {data.prices.join(', ')}</div>
    </div>
  )
}
