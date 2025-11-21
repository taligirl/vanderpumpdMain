import React from 'react';

export function CoverCropModal({ src, onSave, onClose }: {
  src: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const boxRef = React.useRef(null);
  const [cx, setCx] = React.useState(0.5);
  const [cy, setCy] = React.useState(0.5);
  const [scale, setScale] = React.useState(1);
  const [dragging, setDragging] = React.useState(false);

  const onPointer = (e: React.PointerEvent) => {
    if (!boxRef.current || (!dragging && e.type !== 'pointerdown')) return;
    const rect = boxRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setCx(Math.max(0, Math.min(1, x)));
    setCy(Math.max(0, Math.min(1, y)));
  };

  const doSave = async () => {
    const out = await cropToAspectDataURLAt(src, 1500, 500, cx, cy, scale);
    onSave(out);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Crop cover">
      <div className="modal-panel">
        <h3 style={{ marginTop:0 }}>Crop cover (drag to position, zoom)</h3>
        <p className="review-meta" style={{ marginTop:6 }}>Final export is 3:1.</p>
        <div style={{ display:'grid', gap:10, marginTop:10 }}>
          <div
            ref={boxRef}
            onPointerDown={(e)=>{ setDragging(true); (e.target as HTMLElement).setPointerCapture(e.pointerId); onPointer(e); }}
            onPointerMove={onPointer}
            onPointerUp={(e)=>{ setDragging(false); try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {} }}
            style={{
              width:480, height:160, border:'1px solid #333', borderRadius:12, overflow:'hidden',
              touchAction:'none', cursor:'grab', position:'relative', background:'#111'
            }}
          >
            <img
              src={src}
              alt=""
              style={{
                position:'absolute', inset:0, width:'100%', height:'100%',
                objectFit:'cover',
                objectPosition: `${cx*100}% ${cy*100}%`,
                transformOrigin: `${cx*100}% ${cy*100}%`,
                transform: `scale(${scale})`,
                userSelect:'none', pointerEvents:'none'
              }}
            />
          </div>

          <label style={{ display:'grid', gap:6 }}>
            Zoom
            <input
              type="range" min={1} max={3} step={0.01}
              value={scale}
              onChange={(e)=>setScale(parseFloat(e.target.value))}
            />
          </label>

          <div style={{ display:'flex', gap:8 }}>
            <button type="button" onClick={doSave}>Save crop</button>
            <button type="button" className="clear-btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}