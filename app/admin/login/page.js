"use client";

import { useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      window.location.href = "/admin";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0B0B14", minHeight: "100vh" }} className="flex items-center justify-center p-5">
      <div style={{ background: "#14131F", border: "1px solid #2A273E" }} className="w-full max-w-sm rounded-2xl p-8">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: "#241E3D" }}>
          <ShieldCheck size={20} color="#A78BFA" />
        </div>
        <h1 style={{ color: "#F2EFFB" }} className="text-2xl font-semibold mb-1">Creativo Admin</h1>
        <p style={{ color: "#A69FC4" }} className="text-sm mb-6">Sign in to manage products, orders and more.</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "#0B0B14", border: "1px solid #2A273E", color: "#F2EFFB" }}
          />
          <input
            required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "#0B0B14", border: "1px solid #2A273E", color: "#F2EFFB" }}
          />
          {error && <p className="text-sm" style={{ color: "#F87171" }}>{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
            style={{ background: "#A78BFA", color: "#0B0B14" }}
          >
            <LogIn size={15} /> {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
