"use client";

import { LineChart } from "@mui/x-charts/LineChart";
import { useState, useEffect } from "react";

export default function Page() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/fetch_yahoo")
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .catch(console.error);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1>Home</h1>
      <div>Symbol: {data.symbol}</div>
      <LineChart series={[{ data: data.prices }]} xAxis={[{}]} />
    </div>
  );
}
