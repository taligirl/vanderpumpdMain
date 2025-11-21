// src/bridge-env.ts
declare global {
  interface Window { __ENV?: any }
}
;(window as any).__ENV = import.meta.env