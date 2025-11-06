// src/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";

// src/api.js
export const BASE_URL = "http://10.0.0.182:3333";

export async function api(
  path,
  { method = "GET", body, auth = false } = {}
) {
  const headers = { "Content-Type": "application/json" };

  // se a rota exigir token (auth: true), pega do AsyncStorage e envia
  if (auth) {
    const token = await AsyncStorage.getItem("@token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}
