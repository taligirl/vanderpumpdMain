import React, { useState } from 'react';
import { pushToast } from './Toast';

export function CollectionPicker({
  collections,
  episodeId,
  onAdd,
  onNew,
}: {
  collections: any[];
  episodeId: string;
  onAdd: (collectionId: string, episodeId: string) => void;
  onNew: (name: string) => void;
}) {
  const [sel, setSel] = useState("");
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <select className="select" value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Add episode to collection">
        <option value="">Add to collection…</option>
        {collections.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
        <option value="__new">➕ New collection…</option>
      </select>
      <button
        type="button"
        onClick={() => {
          if (sel === '__new') {
            const name = prompt('Name the new collection');
            if (name && name.trim()) onNew(name.trim());
            setSel('');
            return;
          }
          if (!sel) {
            pushToast('Pick a collection first');
            return;
          }
          onAdd(sel, episodeId);
          setSel('');
        }}
      >
        Add
      </button>
    </div>
  );
}