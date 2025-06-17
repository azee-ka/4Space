// utils/GlobalEvent.js

export function emitGlobalEvent(type, detail = {}) {
  window.dispatchEvent(new CustomEvent(type, { detail }));
}
