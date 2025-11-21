import React, { useState } from 'react';
import { pushToast } from './Toast';

export function NewCollectionForm({ onAdd }: {
  onAdd: (c: any) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [kw, setKw] = useState("");
  return (
    <div className="episode-card" style={{ marginBottom: 12 }}>
      <div className="episode-header">
        <div>
          <h3 style={{ margin:0 }}>Create a Collection</h3>
          <p style={{ marginTop:6 }}>Name it and (optionally) add comma-separated keywords for smart matching.</p>
        </div>
      </div>
      <div className="review-box" style={{ marginTop: 10, display:'grid', gap:8 }}>
        <input className="input" placeholder="Collection name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Keywords, comma separated" value={kw} onChange={(e) => setKw(e.target.value)} />
        <textarea
          className="input"
          placeholder="Short description (optional)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={2}
        />
        <button
          type="button"
          onClick={() => {
            const cleanName = name.trim();
            const keywords = kw.split(",").map((s) => s.trim()).filter(Boolean);
            if (!cleanName) return pushToast("Please add a name");
            onAdd({
              id: `${Date.now()}`,
              name: cleanName,
              keywords,
              description: desc.trim() || undefined,
              episodeIds: [],
            });
            setName(''); setKw(''); setDesc('');
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}