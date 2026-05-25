"use client";
import { useState } from "react";

export default function PCA() {
    const [result, setResult] = useState(null);
    const [inputText, setInputText] = useState("[[1,2,3],[4,5,6]]");

    async function submit() {
        try {
            const payload = { data: JSON.parse(inputText) };
            const r = await fetch("/api/pca", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const j = await r.json();
            setResult(j);
        } catch (e) {
            setResult({ error: e.message });
        }
    }

    return (
        <div>
            <h1>PCA</h1>
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} rows={8} cols={60} />
            <br />
            <button onClick={submit}>Run PCA</button>
            <pre>{result ? JSON.stringify(result, null, 2) : "No result"}</pre>
        </div>
    );
}
