"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";

export default function AccountLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      window.location.href = "/";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: "#FAFAFC" }}>
      <div className="w-full max-w-sm rounded-2xl p-8 border" style={{ background: "#FFFFFF", borderColor: "#E7E3F5" }}>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "#17142A" }}>Welcome back</h1>
        <p className="text-sm mb-6" style={{ color: "#615C79" }}>Log in to track your orders.</p>
        <form onSubmit={submit} className="space-y-3">
          <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none border" style={{ borderColor: "#E7E3F5" }} />
          <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none border" style={{ borderColor: "#E7E3F5" }} />
          {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "#6D28D9" }}>
            <LogIn size={15} /> {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="text-sm mt-5 text-center" style={{ color: "#615C79" }}>
          New here? <Link href="/account/register" style={{ color: "#6D28D9" }}>Create an account</Link>
        </p>
        <p className="text-sm mt-2 text-center"><Link href="/" style={{ color: "#615C79" }}>← Back to Creativo</Link></p>
      </div>
    </div>
  );
}
