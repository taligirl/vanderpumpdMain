import React from 'react';

let pushFn: ((msg: string) => void) | null = null;

export function pushToast(msg: string) {
  try { pushFn?.(msg); } catch {}
}

export function ToastHost() {
  const [items, setItems] = React.useState<{ id:number; text:string }[]>([]);

  React.useEffect(() => {
    pushFn = (text: string) => {
      const id = Date.now() + Math.random();
      setItems(prev => [...prev, { id, text }]);
      setTimeout(() => {
        setItems(prev => prev.filter(it => it.id !== id));
      }, 2200);
    };
    return () => { pushFn = null; };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        display: 'grid',
        gap: 8,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {items.map(it => (
        <div
          key={it.id}
          style={{
            pointerEvents: 'auto',
            background: 'linear-gradient(135deg, rgba(255,92,200,0.9), rgba(123,184,255,0.9))',
            color: '#05060b',
            padding: '10px 14px',
            borderRadius: 999,
            boxShadow: '0 0 18px rgba(255,92,200,0.45)',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: 0.2,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 0,
            maxWidth: 320,
            backdropFilter: 'blur(6px)',
          }}
        >
          {it.text}
        </div>
      ))}
    </div>
  );
}