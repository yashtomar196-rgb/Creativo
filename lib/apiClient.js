"use client";

async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const apiGet = (url) => request(url);
export const apiPost = (url, body) => request(url, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) });
export const apiPatch = (url, body) => request(url, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = (url) => request(url, { method: "DELETE" });
