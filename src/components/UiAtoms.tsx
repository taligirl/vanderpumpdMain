import React, { useRef } from 'react';

export function HeartButton({ active, onToggle }: { active:boolean; onToggle:()=>void }) {
  return (
    <button
      type="button"
      className="clear-btn"
      style={{border:'1px solid #444',borderRadius:999,padding:'6px 10px',background:'#1b1b1b',color:active?'#ff3dbd':'#ddd'}}
      onClick={onToggle}
      title={active?'Unfavorite':'Favorite'}
      aria-pressed={active}
    >
      {active ? '🩷' : '🩶'}
    </button>
  );
}

// [PH-A2] Emoji-based rating UI (⭐️ / ✨ / ☆)
function Star({ filled, onRate, label }: { filled: 0|0.5|1; onRate:(half:0.5|1)=>void; label:string }) {
  const ref = useRef<HTMLSpanElement|null>(null);
  const handleClick = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const half: 0.5|1 = (e.clientX - rect.left) < rect.width/2 ? 0.5 : 1;
    onRate(half);
  };
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { onRate(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { onRate(0.5); e.preventDefault(); }
    if (e.key === 'ArrowRight') { onRate(1); e.preventDefault(); }
  };
  const glyph = filled === 1 ? '⭐️' : filled === 0.5 ? '✨' : '☆';
  return (
    <span
      ref={ref}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKey}
      title={label}
      role="button"
      aria-label={label}
      style={{display:'inline-block', width:26, fontSize:22, lineHeight:'24px', cursor:'pointer', userSelect:'none'}}
    >
      {glyph}
    </span>
  );
}

export function RatingInput({ value, onChange }: { value:number; onChange:(v:number)=>void }) {
  const stars: (0|0.5|1)[] = [0,1,2,3,4].map(i => {
    const diff = value - i;
    if (diff >= 1) return 1;
    if (diff >= 0.5) return 0.5;
    return 0;
  });
  const handle = (index:number, half:0.5|1) => onChange(index + half);
  return (
    <div className="rating" style={{display:'inline-flex',gap:4,alignItems:'center'}}>
      {stars.map((f,i)=>(
        <Star key={i} filled={f} onRate={(h)=>handle(i,h)} label={`Rate ${i+1}`} />
      ))}
      <button type="button" className="clear-btn" onClick={()=>onChange(0)} style={{marginLeft:6}}>Clear</button>
    </div>
  );
}