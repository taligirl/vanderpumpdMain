// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './bridge-env';


const rootEl = document.getElementById('root');
if (!rootEl) {
  const msg = document.createElement('div');
  msg.textContent = 'No #root element found';
  document.body.appendChild(msg);
} else {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
