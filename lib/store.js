"use client";

// Simple localStorage-backed persistence so data added on the storefront
// (like a new order) shows up on the /admin route too, and vice versa
// (like an admin uploading a product photo or changing a price).

export const STORE_KEYS = {
  products: "creativo_products_v1",
  orders: "creativo_orders_v1",
  reviews: "creativo_reviews_v1",
  leads: "creativo_leads_v1",
};

export function loadState(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveState(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — fail silently, app still works in-memory
  }
}
