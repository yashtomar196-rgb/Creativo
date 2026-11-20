"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export default function AccountRegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't create account.");
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
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "#17142A" }}>Create your account</h1>
        <p className="text-sm mb-6" style={{ color: "#615C79" }}>Track orders and check out faster next time.</p>
        <form onSubmit={submit} className="space-y-3">
          <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none border" style={{ borderColor: "#E7E3F5" }} />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none border" style={{ borderColor: "#E7E3F5" }} />
          <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none border" style={{ borderColor: "#E7E3F5" }} />
          <input required type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none border" style={{ borderColor: "#E7E3F5" }} />
          {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "#6D28D9" }}>
            <UserPlus size={15} /> {loading ? "Creating…" : "Create Account"}
          </button>
        </form>
        <p className="text-sm mt-5 text-center" style={{ color: "#615C79" }}>
          Already have an account? <Link href="/account/login" style={{ color: "#6D28D9" }}>Sign in</Link>
        </p>
        <p className="text-sm mt-2 text-center"><Link href="/" style={{ color: "#615C79" }}>← Back to Creativo</Link></p>
      </div>
    </div>
  );
}
