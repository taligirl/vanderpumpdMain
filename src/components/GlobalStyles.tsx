import React from 'react';

export function GlobalStyles() {
  return (
    <style>{`
      :root{
  color-scheme: dark;
  --bg:#07080a;
  --surface:#0f1116;
  --panel:#10131d;
  --line:#23283a;
  --ink:#eef1ff;
  --muted:#a9b0c9;
  --lav:#b7a6ff;
  --pink:#ff5cc8;
  --accent:#7ab8ff;
  --success:#67e9b1;
  --danger:#ff6b6b;
  --radius:14px;
  --radius-lg:18px;
  --radius-xl:28px;
  --shadow:0 10px 24px rgba(0,0,0,.35), 0 1px 0 rgba(255,255,255,.02) inset;
}

      * { box-sizing: border-box; }
      html,body { height:100%; }
      body {
        margin:0; background:#0b0a10; color:var(--ink);
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
      }

      .skip-link {
        position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden;
      }
      .skip-link:focus { position:static; width:auto; height:auto; padding:8px 12px; background:#111; border:1px solid #444; border-radius:8px; }

      .input {
        width:100%; background:#111; color:#fff; border:1px solid #2b2b2b; border-radius:8px; padding:8px 10px;
      }
      .select {
        background:#111; color:#fff; border:1px solid #2b2b2b; border-radius:8px; padding:8px 10px;
      }
      .select { appearance:none; }

      .top-bar {
        position:sticky; top:0;
        background:rgba(16,16,16,.85); backdrop-filter:blur(6px); z-index:10; border-bottom:1px solid #1f1f1f;
      }

      .episode-card {
        border:1px solid #2b2b2b; border-radius:12px; padding:12px; background:#121212;
      }
      .episode-header { display:flex; align-items:center; gap:10px; }

      .reviews, .review-list { display:grid; gap:12px; }
      .review-box { border:1px solid #2b2b2b; border-radius:10px; padding:10px; background:#121212; }
      .review-meta { opacity:.8; font-size:12px; }
      .rating { display:flex; align-items:center; gap:4px; }

      /* comments thread base (matches your .vp-* classes) */
      .vp-thread { margin-top:10px; }
      .vp-branch { margin-left:0; }
      .vp-comment {
        padding:8px 10px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);
        margin-top:8px; position:relative;
      }
      .vp-bar { display:flex; justify-content:space-between; align-items:center; gap:8px; }
      .vp-left { display:flex; align-items:center; gap:8px; }
      .vp-toggle { font-size:12px; opacity:.7; cursor:pointer; }
      .vp-text { white-space:pre-wrap; user-select:text; }
      .vp-actions { display:inline-flex; gap:8px; align-items:center; }
         .vp-btn {
     background: transparent;
     border: none;
     color: inherit;
     cursor: pointer;
     padding: 4px 9px;
     border-radius: 999px;
     transition: background 140ms ease-out, transform 140ms ease-out, box-shadow 140ms ease-out;
   }
   .vp-btn:hover {
     background: radial-gradient(circle at 0 0, rgba(255,92,200,0.18), rgba(255,92,200,0.02));
     transform: translateY(-1px);
     box-shadow: 0 0 12px rgba(255,92,200,0.35);
   }
    `}</style>
  );
}
