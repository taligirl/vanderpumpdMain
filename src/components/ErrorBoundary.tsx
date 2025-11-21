import React from 'react';

export default class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error:any}> {
  constructor(props:any){ super(props); this.state = { error: null as any }; }
  static getDerivedStateFromError(e:any){ return { error: e }; }
  componentDidCatch(e:any, info:any){ if (import.meta.env.DEV) console.error('UI Error:', e, info); }

  render(){
    const err = (this.state && (this.state as any).error) || null;
    if (!err) return (this.props.children as any);
    const msg = String((err as any)?.message ?? err);
    return (
      <div
        style={{
          padding:16, border:'1px solid #333', borderRadius:10,
          background:'#121212', color:'#fff', boxShadow:'0 10px 30px rgba(0,0,0,.4)', margin:12
        }}
        role="alert" aria-live="assertive"
      >
        <h3 style={{margin:'0 0 8px 0'}}>Something went wrong</h3>
        <pre style={{whiteSpace:'pre-wrap', margin:0}}>{msg}</pre>
        <div style={{marginTop:10, display:'flex', gap:8}}>
          <button type="button" className="clear-btn" onClick={()=>location.reload()} aria-label="Reload the app">
            Reload
          </button>
        </div>
      </div>
    );
  }
}
