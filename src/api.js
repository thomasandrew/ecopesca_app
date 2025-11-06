// src/api.js
const BASE_URL = "http://192.168.0.5:3333"; // ou seu IP da máquina na mesma rede

export async function api(path, { method = "GET", body, auth } = {}) {
  const headers = { "Content-Type": "application/json" };
  // (se tiver token e precisar)
  const opts = {
    method,
    headers,
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* ignore */ }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}${data?.message ? " – " + data.message : ""}`);
  }
  return data;
}
