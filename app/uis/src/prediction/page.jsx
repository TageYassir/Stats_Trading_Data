import React, { useState } from 'react';

export default function PredictionPage() {

  const [symbol, setSymbol] = useState('MSFT');
  const [prediction, setPrediction] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const inputStyle = {
    padding: '10px 12px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none'
  };

  const runPrediction = async () => {

    setLoading(true);
    setError(null);

    try {

      const response = await fetch(
        `http://localhost:8000/prediction/train?symbol=${symbol}`
      );

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        throw new Error(
          data.error || 'Prediction failed'
        );
      }

      setPrediction(data);

    } catch (err) {
    console.error(err);
    setError(err.message);
    } finally {

      setLoading(false);

    }
  };

  return (

    <div>

      <h2
        style={{
          marginTop: 0,
          fontSize: '22px',
          color: '#f59e0b'
        }}
      >
        Workspace 04: Market Prediction Engine
      </h2>

      <p
        style={{
          color: '#94a3b8',
          fontSize: '14px',
          marginBottom: '24px'
        }}
      >
        Predict future market direction using Technical Indicators, PCA Factors and Random Forest Classification.
      </p>

      <div
        style={{
          background: '#0f172a',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #334155',
          marginBottom: '24px'
        }}
      >

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '16px',
            alignItems: 'end'
          }}
        >

          <div>

            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '12px',
                color: '#94a3b8',
                fontWeight: 'bold'
              }}
            >
              Asset Symbol
            </label>

            <input
              value={symbol}
              onChange={(e) =>
                setSymbol(
                  e.target.value.toUpperCase()
                )
              }
              placeholder="MSFT / AAPL / BTC-USD"
              style={{
                ...inputStyle,
                width: '100%'
              }}
            />

          </div>

          <button
            onClick={runPrediction}
            disabled={loading}
            style={{
              backgroundColor: '#f59e0b',
              color: '#0f172a',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              height: '42px'
            }}
          >
            {loading
              ? 'Analyzing Market...'
              : 'Generate Forecast'}
          </button>

        </div>

      </div>

      {error && (

        <div
          style={{
            color: '#f87171',
            padding: '12px',
            backgroundColor: '#7f1d1d40',
            borderRadius: '8px',
            border: '1px solid #7f1d1d',
            marginBottom: '24px'
          }}
        >
          {error}
        </div>

      )}

      {prediction && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(250px,1fr))',
              gap: '20px'
            }}
          >

          <div
            style={{
              background: '#0f172a',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #334155'
            }}
          >
            <h3 style={{ color: '#f59e0b' }}>
              Asset
            </h3>

            <div
              style={{
                fontSize: '34px',
                fontWeight: 'bold'
              }}
            >
              {prediction.symbol}
            </div>
          </div>

          <div
            style={{
              background: '#0f172a',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #334155'
            }}
          >
            <h3 style={{ color: '#38bdf8' }}>
              Accuracy
            </h3>

            <div
              style={{
                fontSize: '34px',
                fontWeight: 'bold'
              }}
            >
              {prediction.accuracy}%
            </div>
          </div>

          <div
            style={{
              background: '#0f172a',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #334155'
            }}
          >
            <h3 style={{ color: '#10b981' }}>
              Confidence
            </h3>

            <div
              style={{
                fontSize: '34px',
                fontWeight: 'bold'
              }}
            >
              {prediction.confidence}%
            </div>
          </div>

          <div
            style={{
              background: '#0f172a',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #334155'
            }}
          >
            <h3 style={{ color: '#a855f7' }}>
              Forecast
            </h3>

            <div
              style={{
                fontSize: '34px',
                fontWeight: 'bold',
                color:
                  prediction.prediction === 'Bullish'
                    ? '#10b981'
                    : '#ef4444'
              }}
            >
              {prediction.prediction}
            </div>
          </div>

        </div>

        <div
          style={{
            marginTop: '24px',
            display: 'grid',
            gap: '20px',
            gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))'
          }}
        >
          <div
            style={{
              background: '#0f172a',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #334155'
            }}
          >
            <h3 style={{ color: '#38bdf8' }}>
              Training Rows
            </h3>
            <div style={{ fontSize: '34px', fontWeight: 'bold' }}>
              {prediction.training_rows}
            </div>
          </div>

          <div
            style={{
              background: '#0f172a',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #334155'
            }}
          >
            <h3 style={{ color: '#7c3aed' }}>
              Features Used
            </h3>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>
              {prediction.features_used?.join(', ')}
            </div>
          </div>

          <div
            style={{
              background: '#0f172a',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #334155'
            }}
          >
            <h3 style={{ color: '#f97316' }}>
              Feature Importance
            </h3>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>
              {prediction.feature_importance &&
                Object.entries(prediction.feature_importance).map(
                  ([feature, value]) => (
                    <div key={feature}>
                      {feature}: {value}
                    </div>
                  )
                )}
            </div>
          </div>
        </div>
      </>

      )}

    </div>
  );
}