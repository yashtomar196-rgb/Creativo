"use client";

import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import Link from "next/link";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/apiClient";
import { ROLE_LABELS, canDeleteManagedRole } from "../lib/permissions";
import {
  Sun, Moon, ShoppingCart, Search, Menu, X, Upload, Star, ChevronLeft, ChevronRight,
  Truck, Printer, PackageCheck, PenLine, Phone, Mail, MessageCircle, Plus, Minus,
  Trash2, CheckCircle2, XCircle, LayoutDashboard, ClipboardList, Boxes, MessagesSquare,
  ArrowLeft, Tag, Download, Frame, BookImage, CalendarDays, StickyNote, Bookmark,
  BadgePercent, ShieldCheck, Sparkles, ChevronDown, Filter, Building2, PartyPopper,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/* ---------------------------------- THEME TOKENS ---------------------------------- */
const THEMES = {
  light: {
    "--bg": "#FAFAFC", "--surface": "#FFFFFF", "--surface2": "#F3F0FB",
    "--ink": "#17142A", "--ink-soft": "#615C79", "--border": "#E7E3F5",
    "--accent": "#6D28D9", "--accent2": "#4338CA", "--accent-soft": "#EFE9FE",
    "--warn": "#B45309", "--warn-soft": "#FEF3C7", "--success": "#0E9F6E", "--danger": "#DC2626",
  },
  dark: {
    "--bg": "#0B0B14", "--surface": "#14131F", "--surface2": "#1C1A2B",
    "--ink": "#F2EFFB", "--ink-soft": "#A69FC4", "--border": "#2A273E",
    "--accent": "#A78BFA", "--accent2": "#818CF8", "--accent-soft": "#241E3D",
    "--warn": "#FBBF24", "--warn-soft": "#3A2E14", "--success": "#34D399", "--danger": "#F87171",
  },
};
const F_DISPLAY = "'Fraunces', serif";
const F_BODY = "'Plus Jakarta Sans', sans-serif";
const F_MONO = "'JetBrains Mono', monospace";

const ThemeCtx = createContext(null);
const useThemeMode = () => useContext(ThemeCtx);
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

/* ---------------------------------- MOCK DATA ---------------------------------- */
const CATEGORIES = [
  { id: "posters", label: "Wall Posters", icon: Frame, sub: "Minimalist · F1 Multi-Panel · Framed Art", img: "poster-cat" },
  { id: "magazines", label: "Photo Magazines", icon: BookImage, sub: "Birthday · Anniversary · Friends", img: "mag-cat" },
  { id: "planners", label: "Planners & Calendars", icon: CalendarDays, sub: "Undated · Weekly · Wall Calendars", img: "plan-cat" },
  { id: "memopads", label: "Memo Pads & Lists", icon: StickyNote, sub: "Custom to-do & memo sets", img: "memo-cat" },
  { id: "bookmarks", label: "Aesthetic Bookmarks", icon: Bookmark, sub: "Sets of 5 & 10, laminated", img: "book-cat" },
];

const STATUS_FLOW = ["Pending", "Printing", "Packed", "Dispatched", "Delivered"];
const STATUS_COLOR = { Pending: "--warn", Printing: "--accent2", Packed: "--accent", Dispatched: "--success", Delivered: "--success" };

/* ---------------------------------- SMALL UI PRIMITIVES ---------------------------------- */
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
      * { box-sizing: border-box; }
      .creativo-root { font-family: ${F_BODY}; background: var(--bg); color: var(--ink); transition: background .35s ease, color .35s ease; }
      .creativo-root ::selection { background: var(--accent); color: white; }
      .creativo-root ::-webkit-scrollbar { width: 10px; height: 10px; }
      .creativo-root ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px; }
      .font-display { font-family: ${F_DISPLAY}; }
      .font-mono { font-family: ${F_MONO}; }
      @keyframes riseIn { from { opacity:0; transform: translateY(14px);} to { opacity:1; transform: translateY(0);} }
      .rise-in { animation: riseIn .6s cubic-bezier(.2,.8,.2,1) both; }
      .cut-line { background-image: repeating-linear-gradient(to right, var(--border) 0 10px, transparent 10px 18px); height: 1px; width: 100%; }
      .cut-line-v { background-image: repeating-linear-gradient(to bottom, var(--border) 0 8px, transparent 8px 14px); width: 1px; }
      .reg-mark { position: absolute; width: 16px; height: 16px; opacity: 0; transition: opacity .25s ease; pointer-events: none; }
      .group:hover .reg-mark { opacity: .55; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `}</style>
  );
}

function RegMark({ className = "" }) {
  return (
    <svg viewBox="0 0 16 16" className={`reg-mark ${className}`} fill="none" stroke="var(--accent)" strokeWidth="1.2">
      <line x1="8" y1="0" x2="8" y2="16" /><line x1="0" y1="8" x2="16" y2="8" /><circle cx="8" cy="8" r="4.5" />
    </svg>
  );
}

function Eyebrow({ children, className = "" }) {
  return (
    <div className={`font-mono inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase ${className}`} style={{ color: "var(--accent)" }}>
      <span className="inline-block w-4 h-px" style={{ background: "var(--accent)" }} />
      {children}
    </div>
  );
}

function StarRow({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={i <= Math.round(rating) ? "var(--warn)" : "none"} stroke="var(--warn)" strokeWidth={1.5} />
      ))}
    </div>
  );
}

function Badge({ children, tone = "accent" }) {
  const map = {
    accent: { bg: "var(--accent-soft)", fg: "var(--accent)" },
    warn: { bg: "var(--warn-soft)", fg: "var(--warn)" },
    success: { bg: "var(--accent-soft)", fg: "var(--success)" },
  };
  const c = map[tone] || map.accent;
  return (
    <span className="font-mono text-[10px] tracking-wide uppercase px-2 py-1 rounded-full" style={{ background: c.bg, color: c.fg }}>
      {children}
    </span>
  );
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 active:scale-[.97] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: { background: "var(--accent)", color: "#fff", boxShadow: "0 8px 24px -8px var(--accent)" },
    secondary: { background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--border)" },
    ghost: { background: "transparent", color: "var(--ink)" },
    dark: { background: "var(--ink)", color: "var(--bg)" },
  };
  return (
    <button className={`${base} ${className} hover:brightness-110`} style={styles[variant]} {...props}>
      {children}
    </button>
  );
}

function Section({ children, className = "", id }) {
  return <section id={id} className={`max-w-7xl mx-auto px-5 md:px-8 ${className}`}>{children}</section>;
}

function imgUrl(seedPath) {
  if (!seedPath) return "https://picsum.photos/seed/placeholder/600/750";
  if (seedPath.startsWith("http") || seedPath.startsWith("data:") || seedPath.startsWith("/")) return seedPath;
  return `https://picsum.photos/${seedPath}`;
}

/* ---------------------------------- SITE NAV + FOOTER ---------------------------------- */
function SiteNav() {
  const { theme, toggleTheme } = useThemeMode();
  const { page, goTo, cart, search, setSearch } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customer, setCustomer] = useState(null);
  const cartCount = cart.reduce((a, c) => a + c.qty, 0);
  const links = [
    { id: "home", label: "Home" },
    { id: "shop", label: "Shop" },
    { id: "bulk", label: "Bulk Orders" },
  ];

  useEffect(() => {
    apiGet("/api/auth/me").then((d) => setCustomer(d.customer)).catch(() => {});
  }, []);

  const logoutCustomer = async () => {
    await apiPost("/api/auth/logout", {});
    setCustomer(null);
    goTo("home");
  };
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md border-b" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--bg) 82%, transparent)" }}>
      <Section className="flex items-center justify-between h-16 gap-4">
        <button onClick={() => goTo("home")} className="flex items-center gap-2 shrink-0">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center font-display text-lg font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>C</span>
          <span className="font-display text-xl font-semibold tracking-tight hidden sm:block">Creativo</span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <button key={l.id} onClick={() => goTo(l.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: page === l.id ? "var(--accent)" : "var(--ink-soft)", background: page === l.id ? "var(--accent-soft)" : "transparent" }}>
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center flex-1 max-w-xs relative">
          <Search size={16} className="absolute left-3" style={{ color: "var(--ink-soft)" }} />
          <input value={search} onChange={(e) => { setSearch(e.target.value); goTo("shop"); }} placeholder="Search prints, planners…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none border" style={{ background: "var(--surface2)", borderColor: "var(--border)", color: "var(--ink)" }} />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="w-10 h-10 rounded-lg flex items-center justify-center border transition-transform hover:rotate-12" style={{ borderColor: "var(--border)" }}>
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {customer ? (
            <button onClick={logoutCustomer} className="hidden sm:flex h-10 px-3 rounded-lg items-center gap-1.5 border text-xs font-medium" style={{ borderColor: "var(--border)" }} title="Log out">
              Hi, {customer.name.split(" ")[0]} · Logout
            </button>
          ) : (
            <Link href="/account/login" className="hidden sm:flex h-10 px-3 rounded-lg items-center border text-xs font-medium" style={{ borderColor: "var(--border)" }}>
              Login
            </Link>
          )}
          <button onClick={() => goTo("cart")} className="w-10 h-10 rounded-lg flex items-center justify-center border relative" style={{ borderColor: "var(--border)" }}>
            <ShoppingCart size={17} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--accent)", color: "#fff" }}>{cartCount}</span>
            )}
          </button>
          <button onClick={() => setMobileOpen((v) => !v)} className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center border" style={{ borderColor: "var(--border)" }}>
            {mobileOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </Section>

      {mobileOpen && (
        <div className="md:hidden border-t px-5 py-4 flex flex-col gap-2" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
          <div className="relative mb-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-soft)" }} />
            <input value={search} onChange={(e) => { setSearch(e.target.value); goTo("shop"); }} placeholder="Search…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none border" style={{ background: "var(--surface2)", borderColor: "var(--border)" }} />
          </div>
          {links.map((l) => (
            <button key={l.id} onClick={() => { goTo(l.id); setMobileOpen(false); }} className="text-left px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: page === l.id ? "var(--accent)" : "var(--ink)" }}>
              {l.label}
            </button>
          ))}
          <Link href="/admin" onClick={() => setMobileOpen(false)} className="text-left px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: "var(--ink-soft)" }}>Admin Panel →</Link>
        </div>
      )}
    </header>
  );
}

function SiteFooter() {
  const { goTo } = useApp();
  return (
    <footer className="border-t mt-20" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <Section className="py-14 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center font-display text-lg font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>C</span>
            <span className="font-display text-xl font-semibold">Creativo</span>
          </div>
          <p className="text-sm max-w-xs" style={{ color: "var(--ink-soft)" }}>Premium personalised stationery & wall decor, printed on demand and shipped with care.</p>
        </div>
        <div>
          <Eyebrow className="mb-4">Shop</Eyebrow>
          <ul className="space-y-2 text-sm" style={{ color: "var(--ink-soft)" }}>
            {CATEGORIES.map((c) => <li key={c.id}><button onClick={() => goTo("shop")} className="hover:text-[var(--accent)]">{c.label}</button></li>)}
          </ul>
        </div>
        <div>
          <Eyebrow className="mb-4">Company</Eyebrow>
          <ul className="space-y-2 text-sm" style={{ color: "var(--ink-soft)" }}>
            <li><button onClick={() => goTo("bulk")} className="hover:text-[var(--accent)]">Bulk Orders</button></li>
            <li><Link href="/admin" className="hover:text-[var(--accent)]">Admin Panel</Link></li>
            <li>Track an Order</li>
            <li>Returns & Refunds</li>
          </ul>
        </div>
        <div>
          <Eyebrow className="mb-4">Support</Eyebrow>
          <ul className="space-y-3 text-sm" style={{ color: "var(--ink-soft)" }}>
            <li><a href="https://wa.me/917088795601" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[var(--accent)]"><MessageCircle size={15} /> WhatsApp: +91 70887 95601</a></li>
            <li><a href="tel:+917088795601" className="flex items-center gap-2 hover:text-[var(--accent)]"><Phone size={15} /> +91 70887 95601</a></li>
            <li><a href="mailto:yashtomar196@gmail.com" className="flex items-center gap-2 hover:text-[var(--accent)]"><Mail size={15} /> yashtomar196@gmail.com</a></li>
          </ul>
        </div>
      </Section>
      <div className="cut-line" />
      <Section className="py-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-mono" style={{ color: "var(--ink-soft)" }}>
        <span>© 2026 CREATIVO STUDIO — PRINTED WITH CARE IN INDIA</span>
        <span>SKU-VERIFIED · SECURE CHECKOUT</span>
      </Section>
    </footer>
  );
}

/* ---------------------------------- PRODUCT CARD ---------------------------------- */
function ProductCard({ product }) {
  const { goTo, setSelectedProduct, addToCart } = useApp();
  const discount = Math.round(100 - (product.price / product.mrp) * 100);
  return (
    <div className="group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1" style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "0 1px 2px rgba(0,0,0,.04)" }}>
      <RegMark className="top-2 left-2" /><RegMark className="top-2 right-2" /><RegMark className="bottom-2 left-2" /><RegMark className="bottom-2 right-2" />
      <button onClick={() => { setSelectedProduct(product); goTo("product"); }} className="block w-full text-left">
        <div className="relative aspect-[4/5] overflow-hidden" style={{ background: "var(--surface2)" }}>
          <img src={imgUrl(product.img)} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.badges.map((b) => <Badge key={b} tone={b.includes("off") ? "warn" : "accent"}>{b}</Badge>)}
          </div>
        </div>
        <div className="p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--ink-soft)" }}>{CATEGORIES.find((c) => c.id === product.category)?.label}</div>
          <h3 className="font-display text-base font-medium leading-snug mb-1.5">{product.name}</h3>
          <div className="flex items-center gap-2 mb-2">
            <StarRow rating={product.rating} />
            <span className="text-xs" style={{ color: "var(--ink-soft)" }}>({product.reviewsCount})</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono font-semibold text-lg">{inr(product.price)}</span>
            <span className="font-mono text-xs line-through" style={{ color: "var(--ink-soft)" }}>{inr(product.mrp)}</span>
            <span className="font-mono text-xs" style={{ color: "var(--success)" }}>{discount}% off</span>
          </div>
        </div>
      </button>
      <div className="px-4 pb-4">
        <Button variant="secondary" className="w-full !py-2.5 !text-xs" onClick={() => addToCart(product, product.variants[0], 1)}>
          <ShoppingCart size={14} /> Add to Cart
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------- HOME PAGE ---------------------------------- */
function HeroSection() {
  const { goTo } = useApp();
  const tilt = ["-rotate-6", "rotate-3", "-rotate-2", "rotate-6", "rotate-1"];
  const heroImgs = [1, 2, 3, 4, 5];
  return (
    <Section className="pt-14 pb-20 md:pt-20 md:pb-28 grid lg:grid-cols-2 gap-12 items-center">
      <div className="rise-in">
        <Eyebrow className="mb-5">Premium Personalised Stationery & Wall Decor</Eyebrow>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.05] font-medium tracking-tight mb-6">
          Turn your walls & desks into <span style={{ color: "var(--accent)" }}>proof you were there.</span>
        </h1>
        <p className="text-base max-w-md mb-8" style={{ color: "var(--ink-soft)" }}>
          Minimalist posters, personalised photo magazines, planners and memo pads — designed in minutes, printed on premium stock, and delivered fast.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => goTo("shop")}>Shop Collection <ChevronRight size={16} /></Button>
          <Button variant="secondary" onClick={() => goTo("shop")}>Customize Yours <PenLine size={15} /></Button>
          <Button variant="ghost" onClick={() => goTo("bulk")}>Bulk Orders</Button>
        </div>
        <div className="flex items-center gap-6 mt-10 font-mono text-xs" style={{ color: "var(--ink-soft)" }}>
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> 25,000+ prints shipped</span>
          <span className="flex items-center gap-1.5"><Star size={14} fill="var(--warn)" stroke="var(--warn)" /> 4.8/5 rated</span>
        </div>
      </div>
      <div className="relative h-[420px] hidden lg:block">
        {heroImgs.map((n, i) => (
          <div key={n} className={`absolute rounded-2xl overflow-hidden border-4 shadow-2xl ${tilt[i]}`}
            style={{ borderColor: "var(--surface)", width: 160 + (i % 2) * 20, top: (i * 70) % 300, left: (i * 95) % 320, zIndex: 5 - i }}>
            <img src={imgUrl(`seed/hero${n}/300/380`)} className="w-full h-full object-cover" alt="" />
          </div>
        ))}
      </div>
    </Section>
  );
}

function CategoryGrid() {
  const { goTo, setCategoryFilter } = useApp();
  return (
    <Section className="py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <Eyebrow className="mb-3">Shop by Category</Eyebrow>
          <h2 className="font-display text-3xl font-medium">Five collections, one press.</h2>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => { setCategoryFilter(c.id); goTo("shop"); }}
            className="group relative rounded-2xl overflow-hidden border text-left h-56 flex flex-col justify-end p-4 transition-transform hover:-translate-y-1"
            style={{ borderColor: "var(--border)" }}>
            <img src={imgUrl(`seed/${c.img}/400/500`)} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,8,20,.88), rgba(10,8,20,.15) 60%)" }} />
            <c.icon size={18} className="relative text-white mb-2" />
            <h3 className="relative font-display text-white text-lg font-medium leading-tight">{c.label}</h3>
            <p className="relative text-white/70 text-xs mt-1">{c.sub}</p>
          </button>
        ))}
      </div>
    </Section>
  );
}

function FeaturedCarousel() {
  const { products } = useApp();
  const scrollerRef = useRef(null);
  const scroll = (dir) => scrollerRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  const featured = products.filter((p) => p.badges && p.badges.length > 0);
  return (
    <Section className="py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <Eyebrow className="mb-3">Trending Now</Eyebrow>
          <h2 className="font-display text-3xl font-medium">Featured drops & price cuts.</h2>
        </div>
        <div className="hidden sm:flex gap-2">
          <button onClick={() => scroll(-1)} className="w-10 h-10 rounded-full border flex items-center justify-center" style={{ borderColor: "var(--border)" }}><ChevronLeft size={16} /></button>
          <button onClick={() => scroll(1)} className="w-10 h-10 rounded-full border flex items-center justify-center" style={{ borderColor: "var(--border)" }}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div ref={scrollerRef} className="flex gap-5 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
        {featured.map((p) => (
          <div key={p.id} className="min-w-[260px] w-[260px] shrink-0"><ProductCard product={p} /></div>
        ))}
      </div>
    </Section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Upload, title: "Upload Your Design", text: "Drop your photos, names or messages into any customizable product." },
    { icon: Printer, title: "We Print, You Approve", text: "We send a free digital proof, then print on premium stock in-house." },
    { icon: Truck, title: "Fast, Careful Delivery", text: "Packed to survive the journey and shipped within 24–48 hours." },
  ];
  return (
    <Section className="py-16">
      <Eyebrow className="mb-3">How Customisation Works</Eyebrow>
      <h2 className="font-display text-3xl font-medium mb-10">From upload to unboxing.</h2>
      <div className="grid md:grid-cols-3 gap-6 relative">
        {steps.map((s, i) => (
          <div key={s.title} className="relative rounded-2xl p-7 border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <div className="font-mono text-xs mb-6" style={{ color: "var(--ink-soft)" }}>STEP 0{i + 1}</div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "var(--accent-soft)" }}>
              <s.icon size={20} style={{ color: "var(--accent)" }} />
            </div>
            <h3 className="font-display text-xl font-medium mb-2">{s.title}</h3>
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>{s.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ReviewsSection() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    apiGet("/api/reviews").then((data) => setReviews(data.reviews || [])).catch(() => setReviews([]));
  }, []);

  if (reviews.length === 0) return null;

  return (
    <Section className="py-16">
      <Eyebrow className="mb-3">Loved By 25,000+ Customers</Eyebrow>
      <h2 className="font-display text-3xl font-medium mb-10">What people are saying.</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl p-6 border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <StarRow rating={r.rating} />
            <p className="text-sm mt-3 mb-5 leading-relaxed" style={{ color: "var(--ink)" }}>"{r.text}"</p>
            <div className="flex items-center gap-3">
              {r.photoUrl && <img src={imgUrl(r.photoUrl)} className="w-9 h-9 rounded-full object-cover" alt="" />}
              <div>
                <div className="text-sm font-medium">{r.name}</div>
                <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>{r.productName}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <Section className="py-16">
      <div className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden" style={{ background: "var(--accent)" }}>
        <Sparkles className="absolute top-6 left-8 text-white/30" size={28} />
        <Sparkles className="absolute bottom-8 right-10 text-white/20" size={40} />
        <h2 className="font-display text-white text-3xl font-medium mb-3">Get 10% off your first print.</h2>
        <p className="text-white/80 text-sm mb-7">Join the list for early access to new drops and design tips.</p>
        {sent ? (
          <p className="text-white font-medium">You're on the list — check your inbox for the code ✦</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (email) setSent(true); }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com"
              className="flex-1 px-4 py-3 rounded-xl outline-none text-sm" style={{ background: "white", color: "#17142A" }} />
            <Button variant="dark" type="submit">Subscribe</Button>
          </form>
        )}
      </div>
    </Section>
  );
}

function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoryGrid />
      <FeaturedCarousel />
      <HowItWorks />
      <ReviewsSection />
      <Newsletter />
    </>
  );
}

/* ---------------------------------- SHOP PAGE ---------------------------------- */
function ShopPage() {
  const { search, setSearch, categoryFilter, setCategoryFilter, products } = useApp();
  const [maxPrice, setMaxPrice] = useState(3000);
  const [customOnly, setCustomOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (p.price > maxPrice) return false;
      if (customOnly && !p.customizable) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, categoryFilter, maxPrice, customOnly, search]);

  const FilterPanel = (
    <div className="space-y-7">
      <div>
        <h4 className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: "var(--ink-soft)" }}>Category</h4>
        <div className="space-y-1.5">
          <button onClick={() => setCategoryFilter("all")} className="flex items-center gap-2 text-sm w-full text-left px-2 py-1.5 rounded-lg" style={{ background: categoryFilter === "all" ? "var(--accent-soft)" : "transparent", color: categoryFilter === "all" ? "var(--accent)" : "var(--ink)" }}>All Products</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCategoryFilter(c.id)} className="flex items-center gap-2 text-sm w-full text-left px-2 py-1.5 rounded-lg" style={{ background: categoryFilter === c.id ? "var(--accent-soft)" : "transparent", color: categoryFilter === c.id ? "var(--accent)" : "var(--ink)" }}>{c.label}</button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: "var(--ink-soft)" }}>Max Price: {inr(maxPrice)}</h4>
        <input type="range" min={200} max={3000} step={50} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
      </div>
      <div>
        <label className="flex items-center gap-2.5 text-sm cursor-pointer">
          <input type="checkbox" checked={customOnly} onChange={(e) => setCustomOnly(e.target.checked)} className="accent-[var(--accent)] w-4 h-4" />
          Customizable only
        </label>
      </div>
    </div>
  );

  return (
    <Section className="py-10">
      <div className="mb-8">
        <Eyebrow className="mb-3">Shop All</Eyebrow>
        <h1 className="font-display text-3xl font-medium">{filtered.length} products found</h1>
      </div>
      <div className="grid md:grid-cols-[220px_1fr] gap-8">
        <aside className="hidden md:block">{FilterPanel}</aside>
        <div>
          <div className="flex md:hidden items-center justify-between mb-5">
            <div className="relative flex-1 mr-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-soft)" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: "var(--border)", background: "var(--surface)" }} />
            </div>
            <button onClick={() => setFiltersOpen((v) => !v)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm" style={{ borderColor: "var(--border)" }}><Filter size={14} /> Filters</button>
          </div>
          {filtersOpen && <div className="md:hidden mb-6 p-4 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>{FilterPanel}</div>}
          {filtered.length === 0 ? (
            <div className="text-center py-20" style={{ color: "var(--ink-soft)" }}>No products match those filters yet.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

/* ---------------------------------- PRODUCT DETAIL / CUSTOMIZE PAGE ---------------------------------- */
function ProductPage() {
  const { selectedProduct: p, goTo, addToCart } = useApp();
  const [activeImg, setActiveImg] = useState(0);
  const [variant, setVariant] = useState(p?.variants[0]);
  const [qty, setQty] = useState(1);
  const [customText, setCustomText] = useState("");
  const [customMsg, setCustomMsg] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  if (!p) return <Section className="py-20 text-center">No product selected. <button className="underline" onClick={() => goTo("shop")}>Back to shop</button></Section>;

  const images = [p.img, p.img2];
  const discount = Math.round(100 - (p.price / p.mrp) * 100);

  const handleFile = async (f) => {
    if (!f) return;
    setFile(f);
    setUploadedUrl(null);
    setUploadError("");
    if (f.type.startsWith("image/")) setPreview(URL.createObjectURL(f));
    else setPreview(null);

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await apiPost("/api/upload", fd);
      setUploadedUrl(res.url);
    } catch (err) {
      setUploadError(err.message || "Upload failed — please try a smaller file.");
    } finally {
      setUploading(false);
    }
  };

  const customPayload = { customText, customMsg, fileName: file?.name, fileUrl: uploadedUrl };

  return (
    <Section className="py-10 pb-32">
      <button onClick={() => goTo("shop")} className="flex items-center gap-1.5 text-sm mb-6" style={{ color: "var(--ink-soft)" }}><ArrowLeft size={15} /> Back to shop</button>
      <div className="grid lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div>
          <div className="rounded-2xl overflow-hidden aspect-[4/5] mb-3 border" style={{ borderColor: "var(--border)", background: "var(--surface2)" }}>
            <img src={imgUrl(images[activeImg])} className="w-full h-full object-cover" alt={p.name} />
          </div>
          <div className="flex gap-3">
            {images.map((im, i) => (
              <button key={i} onClick={() => setActiveImg(i)} className="w-20 h-20 rounded-xl overflow-hidden border-2" style={{ borderColor: activeImg === i ? "var(--accent)" : "var(--border)" }}>
                <img src={imgUrl(im)} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
            {preview && (
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 relative" style={{ borderColor: "var(--accent)" }}>
                <img src={preview} className="w-full h-full object-cover" alt="your upload" />
                <span className="absolute bottom-0 inset-x-0 text-[8px] font-mono text-center text-white bg-black/60">YOURS</span>
              </div>
            )}
          </div>
        </div>

        {/* Info + customization */}
        <div>
          <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: "var(--accent)" }}>{CATEGORIES.find((c) => c.id === p.category)?.label}</div>
          <h1 className="font-display text-3xl font-medium mb-3">{p.name}</h1>
          <div className="flex items-center gap-3 mb-4">
            <StarRow rating={p.rating} /> <span className="text-sm" style={{ color: "var(--ink-soft)" }}>{p.rating} ({p.reviewsCount} reviews)</span>
          </div>
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-mono text-2xl font-semibold">{inr(p.price)}</span>
            <span className="font-mono text-sm line-through" style={{ color: "var(--ink-soft)" }}>{inr(p.mrp)}</span>
            <Badge tone="warn">{discount}% off</Badge>
          </div>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--ink-soft)" }}>{p.description}</p>

          <div className="mb-6">
            <h4 className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: "var(--ink-soft)" }}>Choose Size / Variant</h4>
            <div className="flex flex-wrap gap-2">
              {p.variants.map((v) => (
                <button key={v} onClick={() => setVariant(v)} className="px-4 py-2 rounded-lg text-sm border transition-colors"
                  style={{ borderColor: variant === v ? "var(--accent)" : "var(--border)", background: variant === v ? "var(--accent-soft)" : "transparent", color: variant === v ? "var(--accent)" : "var(--ink)" }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {p.customizable && (
            <div className="mb-6 p-5 rounded-2xl border space-y-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <div className="flex items-center gap-2"><PenLine size={16} style={{ color: "var(--accent)" }} /><h4 className="font-medium text-sm">Personalise this item</h4></div>
              <div>
                <label className="text-xs font-mono uppercase tracking-widest block mb-1.5" style={{ color: "var(--ink-soft)" }}>Name / Title</label>
                <input value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder="e.g. Aditi & Rohan" className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-widest block mb-1.5" style={{ color: "var(--ink-soft)" }}>Custom Message (optional)</label>
                <textarea value={customMsg} onChange={(e) => setCustomMsg(e.target.value)} rows={2} placeholder="A little note to include…" className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-widest block mb-1.5" style={{ color: "var(--ink-soft)" }}>Upload Photos / Design</label>
                <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                <button onClick={() => fileInputRef.current.click()} disabled={uploading} className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed text-sm" style={{ borderColor: uploadedUrl ? "var(--success)" : "var(--border)", color: "var(--ink-soft)" }}>
                  <Upload size={20} />
                  {uploading && <span>Uploading…</span>}
                  {!uploading && file && uploadedUrl && <span style={{ color: "var(--success)" }}>✓ {file.name} uploaded</span>}
                  {!uploading && file && !uploadedUrl && !uploadError && <span style={{ color: "var(--accent)" }}>{file.name}</span>}
                  {!uploading && !file && <span>PNG, JPG or PDF — click to upload</span>}
                </button>
                {uploadError && <p className="text-xs mt-1.5" style={{ color: "var(--danger)" }}>{uploadError}</p>}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium">Quantity</span>
            <div className="flex items-center border rounded-lg" style={{ borderColor: "var(--border)" }}>
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center"><Minus size={14} /></button>
              <span className="w-8 text-center text-sm font-mono">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="w-9 h-9 flex items-center justify-center"><Plus size={14} /></button>
            </div>
          </div>

          <div className="hidden md:flex gap-3 mb-8">
            <Button variant="secondary" className="flex-1" onClick={() => addToCart(p, variant, qty, customPayload)}><ShoppingCart size={16} /> Add to Cart</Button>
            <Button className="flex-1" onClick={() => { addToCart(p, variant, qty, customPayload); goTo("checkout"); }}>Buy Now</Button>
          </div>

          <div className="cut-line mb-6" />
          <h4 className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: "var(--ink-soft)" }}>Specs</h4>
          <ul className="space-y-2">
            {p.specs.map((s) => <li key={s} className="flex items-center gap-2 text-sm" style={{ color: "var(--ink-soft)" }}><CheckCircle2 size={14} style={{ color: "var(--success)" }} /> {s}</li>)}
          </ul>
        </div>
      </div>

      {/* Sticky mobile bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 p-3 border-t flex gap-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <Button variant="secondary" className="flex-1 !py-3" onClick={() => addToCart(p, variant, qty, customPayload)}><ShoppingCart size={15} /></Button>
        <Button className="flex-1 !py-3" onClick={() => { addToCart(p, variant, qty, customPayload); goTo("checkout"); }}>Buy Now · {inr(p.price * qty)}</Button>
      </div>
    </Section>
  );
}

/* ---------------------------------- CART PAGE ---------------------------------- */
function CartPage() {
  const { cart, updateQty, removeFromCart, goTo } = useApp();
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState(null);

  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const discount = applied ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 79;
  const total = subtotal - discount + shipping;

  if (cart.length === 0) {
    return (
      <Section className="py-24 text-center">
        <ShoppingCart size={40} className="mx-auto mb-4" style={{ color: "var(--ink-soft)" }} />
        <h2 className="font-display text-2xl mb-2">Your cart is empty</h2>
        <p className="text-sm mb-6" style={{ color: "var(--ink-soft)" }}>Add something beautiful to your walls or desk.</p>
        <Button onClick={() => goTo("shop")}>Browse Collection</Button>
      </Section>
    );
  }

  return (
    <Section className="py-10">
      <h1 className="font-display text-3xl font-medium mb-8">Your Cart</h1>
      <div className="grid lg:grid-cols-[1fr_340px] gap-10">
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.key} className="flex gap-4 p-4 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <img src={imgUrl(item.product.img)} className="w-20 h-24 object-cover rounded-lg shrink-0" alt="" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm mb-1 truncate">{item.product.name}</h3>
                <p className="text-xs font-mono mb-1" style={{ color: "var(--ink-soft)" }}>Variant: {item.variant}</p>
                {item.custom?.customText && <p className="text-xs" style={{ color: "var(--accent)" }}>Name: "{item.custom.customText}"</p>}
                {item.custom?.fileName && <p className="text-xs flex items-center gap-1" style={{ color: "var(--ink-soft)" }}><Upload size={11} /> {item.custom.fileName}</p>}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border rounded-lg" style={{ borderColor: "var(--border)" }}>
                    <button onClick={() => updateQty(item.key, -1)} className="w-7 h-7 flex items-center justify-center"><Minus size={12} /></button>
                    <span className="w-6 text-center text-xs font-mono">{item.qty}</span>
                    <button onClick={() => updateQty(item.key, 1)} className="w-7 h-7 flex items-center justify-center"><Plus size={12} /></button>
                  </div>
                  <span className="font-mono font-semibold text-sm">{inr(item.price * item.qty)}</span>
                </div>
              </div>
              <button onClick={() => removeFromCart(item.key)} className="self-start" style={{ color: "var(--danger)" }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-2xl border h-fit sticky top-24" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h3 className="font-display text-lg font-medium mb-5">Order Summary</h3>
          <div className="flex gap-2 mb-5">
            <input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Promo code" className="flex-1 px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
            <Button variant="secondary" className="!px-4" onClick={() => setApplied(promo.trim().toUpperCase() === "CREATIVO10" ? promo : null)}>Apply</Button>
          </div>
          {promo && !applied && <p className="text-xs mb-4" style={{ color: "var(--danger)" }}>Try "CREATIVO10" for 10% off.</p>}
          {applied && <p className="text-xs mb-4 flex items-center gap-1" style={{ color: "var(--success)" }}><CheckCircle2 size={13} /> CREATIVO10 applied</p>}
          <div className="space-y-2.5 text-sm mb-5">
            <div className="flex justify-between" style={{ color: "var(--ink-soft)" }}><span>Subtotal</span><span className="font-mono">{inr(subtotal)}</span></div>
            {applied && <div className="flex justify-between" style={{ color: "var(--success)" }}><span>Discount</span><span className="font-mono">-{inr(discount)}</span></div>}
            <div className="flex justify-between" style={{ color: "var(--ink-soft)" }}><span>Shipping</span><span className="font-mono">{shipping === 0 ? "Free" : inr(shipping)}</span></div>
          </div>
          <div className="cut-line mb-4" />
          <div className="flex justify-between mb-6 font-semibold"><span>Total</span><span className="font-mono">{inr(total)}</span></div>
          <Button className="w-full" onClick={() => goTo("checkout")}>Proceed to Checkout <ChevronRight size={15} /></Button>
        </div>
      </div>
    </Section>
  );
}

/* ---------------------------------- CHECKOUT PAGE ---------------------------------- */
function CheckoutPage() {
  const { cart, goTo, clearCart } = useApp();
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" });

  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 79;
  const total = subtotal + shipping;

  const placeOrder = async () => {
    setError("");
    setSubmitting(true);
    try {
      const items = cart.map((c) => ({
        productId: c.product.id,
        name: c.product.name,
        variant: c.variant,
        qty: c.qty,
        price: c.price,
        customText: c.custom?.customText || null,
        customMsg: c.custom?.customMsg || null,
        fileUrl: c.custom?.fileUrl || null,
        fileName: c.custom?.fileName || null,
      }));
      const { order } = await apiPost("/api/orders", {
        customerName: form.name,
        email: form.email,
        phone: form.phone,
        address: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
        items,
      });
      setOrderId(order.id);
      setPlaced(true);
      clearCart();
    } catch (err) {
      setError(err.message || "Couldn't place your order — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <Section className="py-24 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "var(--accent-soft)" }}>
          <CheckCircle2 size={30} style={{ color: "var(--accent)" }} />
        </div>
        <h1 className="font-display text-3xl font-medium mb-2">Order placed!</h1>
        <p className="text-sm mb-8" style={{ color: "var(--ink-soft)" }}>A confirmation has been sent to {form.email || "your email"}. Your order ID is <span className="font-mono" style={{ color: "var(--accent)" }}>{orderId}</span>. Pay by cash when it's delivered.</p>
        <Button onClick={() => goTo("home")}>Continue Shopping</Button>
      </Section>
    );
  }

  if (cart.length === 0) {
    return <Section className="py-24 text-center"><p style={{ color: "var(--ink-soft)" }}>Your cart is empty.</p><Button className="mt-5" onClick={() => goTo("shop")}>Shop Now</Button></Section>;
  }

  return (
    <Section className="py-10">
      <button onClick={() => goTo("cart")} className="flex items-center gap-1.5 text-sm mb-6" style={{ color: "var(--ink-soft)" }}><ArrowLeft size={15} /> Back to cart</button>
      <h1 className="font-display text-3xl font-medium mb-8">Checkout</h1>
      <form onSubmit={(e) => { e.preventDefault(); placeOrder(); }} className="grid lg:grid-cols-[1fr_340px] gap-10">
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <h3 className="font-display text-lg font-medium mb-5">Shipping Address</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none sm:col-span-2" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
              <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
              <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
              <input required placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none sm:col-span-2" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
              <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
              <input required placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
              <input required placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none sm:col-span-2" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
            </div>
          </div>
          <div className="p-6 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <h3 className="font-display text-lg font-medium mb-4">Payment Method</h3>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border text-sm" style={{ borderColor: "var(--accent)", background: "var(--accent-soft)", color: "var(--accent)" }}>
              <PackageCheck size={16} /> Cash on Delivery — pay when your order arrives
            </div>
          </div>
          {error && <p className="text-sm px-1" style={{ color: "var(--danger)" }}>{error}</p>}
        </div>
        <div className="p-6 rounded-2xl border h-fit" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h3 className="font-display text-lg font-medium mb-5">Order Summary</h3>
          <div className="space-y-3 mb-5 max-h-48 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.key} className="flex justify-between text-sm">
                <span className="truncate pr-2" style={{ color: "var(--ink-soft)" }}>{item.product.name} × {item.qty}</span>
                <span className="font-mono shrink-0">{inr(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="cut-line mb-4" />
          <div className="flex justify-between text-sm mb-1.5" style={{ color: "var(--ink-soft)" }}><span>Subtotal</span><span className="font-mono">{inr(subtotal)}</span></div>
          <div className="flex justify-between text-sm mb-4" style={{ color: "var(--ink-soft)" }}><span>Shipping</span><span className="font-mono">{shipping === 0 ? "Free" : inr(shipping)}</span></div>
          <div className="flex justify-between font-semibold mb-6"><span>Total</span><span className="font-mono">{inr(total)}</span></div>
          <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Placing Order…" : "Place Order"}</Button>
        </div>
      </form>
    </Section>
  );
}

/* ---------------------------------- BULK ORDERS PAGE ---------------------------------- */
function BulkOrdersPage() {
  const [sent, setSent] = useState(false);
  const [interests, setInterests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", eventType: "", qty: "", message: "" });

  const toggleInterest = (id) => setInterests((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiPost("/api/leads", { ...form, interests });
      setSent(true);
    } catch (err) {
      setError(err.message || "Couldn't submit your inquiry — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Section className="py-24 text-center max-w-lg mx-auto">
        <PartyPopper size={36} className="mx-auto mb-4" style={{ color: "var(--accent)" }} />
        <h1 className="font-display text-3xl font-medium mb-2">Inquiry received!</h1>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Our bulk orders team will reach out within 24 hours with a custom quote.</p>
      </Section>
    );
  }

  return (
    <Section className="py-14 grid lg:grid-cols-2 gap-14">
      <div>
        <Eyebrow className="mb-4">Corporate · Wedding · Events</Eyebrow>
        <h1 className="font-display text-4xl font-medium mb-5 leading-tight">Stationery, at scale — without losing the personal touch.</h1>
        <p className="text-sm mb-8 max-w-md" style={{ color: "var(--ink-soft)" }}>From wedding favour memo pads to branded corporate planners, our bulk team handles design, proofing and delivery end-to-end.</p>
        <div className="space-y-4">
          {[{ icon: Building2, t: "Corporate Gifting", d: "Branded planners, calendars and memo sets for teams and clients." }, { icon: PartyPopper, t: "Weddings & Events", d: "Personalised bookmarks, memo favours and photo magazines." }, { icon: BadgePercent, t: "Volume Pricing", d: "Tiered discounts starting at 50 units, with dedicated support." }].map((f) => (
            <div key={f.t} className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--accent-soft)" }}><f.icon size={17} style={{ color: "var(--accent)" }} /></div>
              <div><h4 className="font-medium text-sm mb-0.5">{f.t}</h4><p className="text-xs" style={{ color: "var(--ink-soft)" }}>{f.d}</p></div>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={submit} className="p-7 rounded-2xl border space-y-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="grid sm:grid-cols-2 gap-4">
          <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
          <input placeholder="Company (optional)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
          <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
        </div>
        <select required value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
          <option value="" disabled>Event Type</option>
          <option>Wedding</option><option>Corporate</option><option>Birthday</option><option>School / Institution</option><option>Other</option>
        </select>
        <div>
          <label className="text-xs font-mono uppercase tracking-widest block mb-2" style={{ color: "var(--ink-soft)" }}>Products of Interest</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button type="button" key={c.id} onClick={() => toggleInterest(c.id)} className="px-3 py-1.5 rounded-full text-xs border" style={{ borderColor: interests.includes(c.id) ? "var(--accent)" : "var(--border)", background: interests.includes(c.id) ? "var(--accent-soft)" : "transparent", color: interests.includes(c.id) ? "var(--accent)" : "var(--ink)" }}>{c.label}</button>
            ))}
          </div>
        </div>
        <input required placeholder="Approximate quantity (e.g. 200 units)" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
        <textarea rows={3} placeholder="Anything else we should know?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
        {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Submitting…" : "Submit Inquiry"}</Button>
      </form>
    </Section>
  );
}

/* ---------------------------------- ADMIN PANEL ---------------------------------- */
function AdminLayout({ children }) {
  const { page, goTo } = useApp();
  const { theme, toggleTheme } = useThemeMode();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const ALL_ITEMS = [
    { id: "admin-dashboard", section: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "admin-orders", section: "orders", label: "Orders & Files", icon: ClipboardList },
    { id: "admin-products", section: "products", label: "Products", icon: Boxes },
    { id: "admin-reviews", section: "reviews", label: "Reviews & Leads", icon: MessagesSquare },
    { id: "admin-admins", section: "admins", label: "Admin Management", icon: ShieldCheck },
  ];

  useEffect(() => {
    apiGet("/api/admin/me")
      .then((data) => {
        setMe(data);
        const items = ALL_ITEMS.filter((it) => data.permissions.includes(it.section));
        const currentAllowed = items.some((it) => it.id === page);
        if (!currentAllowed && items[0]) goTo(items[0].id);
      })
      .catch(() => { window.location.href = "/admin/login"; })
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await apiPost("/api/admin/logout", {});
    window.location.href = "/admin/login";
  };

  if (loading || !me) {
    return <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--ink-soft)" }}>Loading admin panel…</div>;
  }

  const items = ALL_ITEMS.filter((it) => me.permissions.includes(it.section));

  return (
    <div className="min-h-screen grid lg:grid-cols-[240px_1fr]">
      <aside className="border-r p-5 flex lg:flex-col justify-between lg:justify-start gap-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div>
          <Link href="/" className="flex items-center gap-2 mb-6">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center font-display text-lg font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>C</span>
            <span className="font-display text-lg font-semibold hidden sm:block">Creativo Admin</span>
          </Link>
          <div className="hidden sm:block mb-6 px-1">
            <div className="text-sm font-medium truncate">{me.admin.name}</div>
            <div className="text-xs font-mono" style={{ color: "var(--accent)" }}>{ROLE_LABELS[me.admin.role]}</div>
          </div>
          <nav className="flex lg:flex-col gap-1 flex-wrap">
            {items.map((it) => (
              <button key={it.id} onClick={() => goTo(it.id)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: page === it.id ? "var(--accent-soft)" : "transparent", color: page === it.id ? "var(--accent)" : "var(--ink-soft)" }}>
                <it.icon size={16} /><span className="hidden sm:inline">{it.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="flex lg:flex-col gap-2">
          <button onClick={toggleTheme} className="w-10 h-10 rounded-lg flex items-center justify-center border" style={{ borderColor: "var(--border)" }}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button>
          <Link href="/" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border" style={{ borderColor: "var(--border)", color: "var(--ink-soft)" }}><ArrowLeft size={15} /> <span className="hidden sm:inline">Back to Site</span></Link>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border" style={{ borderColor: "var(--border)", color: "var(--danger)" }}><X size={15} /> <span className="hidden sm:inline">Logout</span></button>
        </div>
      </aside>
      <main className="p-6 md:p-9 overflow-x-auto">{children}</main>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="p-5 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--ink-soft)" }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-soft)" }}><Icon size={14} style={{ color: tone || "var(--accent)" }} /></div>
      </div>
      <div className="font-display text-3xl font-medium">{value}</div>
    </div>
  );
}

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiGet("/api/orders"), apiGet("/api/leads")])
      .then(([o, l]) => { setOrders(o.orders || []); setLeads(l.leads || []); })
      .finally(() => setLoading(false));
  }, []);

  const revenue = orders.reduce((a, o) => a + (o.payment === "Paid" ? o.total : 0), 0);
  const pendingPrints = orders.filter((o) => o.status === "Pending" || o.status === "Printing").length;

  const chartData = useMemo(() => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { key: d.toISOString().slice(0, 10), day: d.toLocaleDateString("en-IN", { weekday: "short" }) };
    });
    return days.map(({ key, day }) => ({
      day,
      rev: orders.filter((o) => o.createdAt?.slice(0, 10) === key).reduce((a, o) => a + o.total, 0),
    }));
  }, [orders]);

  if (loading) return <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Loading dashboard…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl font-medium mb-1">Dashboard</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-soft)" }}>Welcome back — here's how Creativo is doing today.</p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Revenue" value={inr(revenue)} icon={BadgePercent} />
        <MetricCard label="Total Orders" value={orders.length} icon={ClipboardList} />
        <MetricCard label="Pending Prints" value={pendingPrints} icon={Printer} tone="var(--warn)" />
        <MetricCard label="Active Leads" value={leads.filter((l) => l.status !== "Closed").length} icon={MessagesSquare} />
      </div>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="p-6 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h3 className="font-display text-lg font-medium mb-5">Revenue — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--ink-soft)" fontSize={12} />
              <YAxis stroke="var(--ink-soft)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="rev" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="p-6 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <h3 className="font-display text-lg font-medium mb-5">Recent Orders</h3>
          <div className="space-y-3">
            {orders.length === 0 && <p className="text-sm" style={{ color: "var(--ink-soft)" }}>No orders yet.</p>}
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-mono text-xs" style={{ color: "var(--accent)" }}>{o.id}</div>
                  <div style={{ color: "var(--ink-soft)" }}>{o.customerName}</div>
                </div>
                <Badge tone="accent">{o.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () => apiGet("/api/orders").then((d) => setOrders(d.orders || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    try { await apiPatch(`/api/orders/${id}`, { status }); } catch { load(); }
  };
  const togglePayment = async (o) => {
    const payment = o.payment === "Paid" ? "Pending" : "Paid";
    setOrders((prev) => prev.map((x) => x.id === o.id ? { ...x, payment } : x));
    try { await apiPatch(`/api/orders/${o.id}`, { payment }); } catch { load(); }
  };

  const rows = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (loading) return <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Loading orders…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl font-medium mb-1">Orders & File Manager</h1>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Track custom uploads and manage the print workflow. Cash on Delivery — tap Payment to mark cash collected.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <option value="all">All statuses</option>
          {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              {["Order", "Customer", "Items", "Total", "Payment", "Design Files", "Print Status", "Date"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: "var(--ink-soft)" }}>No orders yet — they'll show up here as soon as a customer checks out.</td></tr>
            )}
            {rows.map((o) => {
              const files = (o.items || []).filter((it) => it.fileUrl);
              return (
                <tr key={o.id} className="border-t align-top" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <td className="px-4 py-3 font-mono" style={{ color: "var(--accent)" }}>{o.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.customerName}</div>
                    <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{o.email}</div>
                    {o.phone && <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>{o.phone}</div>}
                    {o.address && <div className="text-xs max-w-[220px]" style={{ color: "var(--ink-soft)" }}>{o.address}</div>}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>
                    {(o.items || []).map((it) => `${it.name} (${it.variant || "—"}) × ${it.qty}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 font-mono">{inr(o.total)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePayment(o)}><Badge tone={o.payment === "Paid" ? "success" : "warn"}>{o.payment}</Badge></button>
                  </td>
                  <td className="px-4 py-3">
                    {files.length === 0 ? <span className="text-xs" style={{ color: "var(--ink-soft)" }}>—</span> : (
                      <div className="flex flex-col gap-1">
                        {files.map((it, i) => (
                          <a key={i} href={it.fileUrl} download={it.fileName || true} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-mono" style={{ color: "var(--accent)" }}>
                            <Download size={13} /> {it.fileName || "file"}
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="px-2.5 py-1.5 rounded-lg border text-xs font-medium outline-none" style={{ borderColor: "var(--border)", color: `var(${STATUS_COLOR[o.status]})`, background: "var(--bg)" }}>
                      {STATUS_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--ink-soft)" }}>{o.createdAt?.slice(0, 10)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ name: "", category: "posters", price: "", mrp: "", stock: 100 });
  const [customCategory, setCustomCategory] = useState("");
  const [draftImg, setDraftImg] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const load = () => apiGet("/api/products").then((d) => setProducts(d.products || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const updateField = (id, field, value) => setProducts((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));

  const commitField = async (id, field, value) => {
    setSavingId(id);
    try { await apiPatch(`/api/products/${id}`, { [field]: value }); } catch { load(); } finally { setSavingId(null); }
  };

  const removeProduct = async (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try { await apiDelete(`/api/products/${id}`); } catch { load(); }
  };

  const uploadImage = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await apiPost("/api/upload", fd);
    return res.url;
  };

  const handlePhotoUpload = async (id, file) => {
    if (!file) return;
    try {
      const url = await uploadImage(file);
      updateField(id, "img", url);
      await apiPatch(`/api/products/${id}`, { img: url });
    } catch (err) {
      alert(err.message || "Photo upload failed.");
    }
  };

  const handleDraftPhoto = async (file) => {
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setDraftImg(url);
    } catch (err) {
      alert(err.message || "Photo upload failed.");
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      const { product } = await apiPost("/api/products", {
        name: draft.name,
        category: draft.category === "__other__"
  ? customCategory.trim()
  : draft.category,
        price: Number(draft.price) || 0,
        mrp: Number(draft.mrp) || 0,
        stock: Number(draft.stock) || 0,
        img: draftImg || undefined,
        img2: draftImg || undefined,
      });
      setProducts((prev) => [product, ...prev]);
      setDraft({ name: "", category: "posters", price: "", mrp: "", stock: 100 });
      setDraftImg(null);
      setShowForm(false);
    } catch (err) {
      alert(err.message || "Couldn't add product.");
    }
  };

  if (loading) return <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Loading products…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl font-medium mb-1">Product & Inventory</h1>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Adjust pricing, stock, photos and variants across your catalog.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}><Plus size={15} /> Add Product</Button>
      </div>

      {showForm && (
        <form onSubmit={addProduct} className="p-5 rounded-2xl border mb-6 space-y-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="flex items-center gap-4">
            <label className="w-16 h-20 rounded-lg border-2 border-dashed flex items-center justify-center shrink-0 cursor-pointer overflow-hidden" style={{ borderColor: "var(--border)" }}>
              {draftImg ? <img src={imgUrl(draftImg)} className="w-full h-full object-cover" alt="" /> : <Upload size={16} style={{ color: "var(--ink-soft)" }} />}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDraftPhoto(e.target.files[0])} />
            </label>
            <p className="text-xs" style={{ color: "var(--ink-soft)" }}>Click the box to upload a product photo (PNG/JPG).</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input required placeholder="Product name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none lg:col-span-2" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
            <select
  value={draft.category}
  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
  className="px-3 py-2.5 rounded-lg border text-sm outline-none"
  style={{ borderColor: "var(--border)", background: "var(--bg)" }}
>
  {CATEGORIES.map((c) => (
    <option key={c.id} value={c.id}>{c.label}</option>
  ))}

  <option value="__other__">Other</option>
</select>

{draft.category === "__other__" && (
  <input
    type="text"
    required
    placeholder="Enter your new category"
    value={customCategory}
    onChange={(e) => setCustomCategory(e.target.value)}
    className="px-3 py-2.5 rounded-lg border text-sm outline-none"
    style={{
      borderColor: "var(--border)",
      background: "var(--bg)"
    }}
  />
)}
            <input required type="number" placeholder="Price" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
            <input required type="number" placeholder="MRP" value={draft.mrp} onChange={(e) => setDraft({ ...draft, mrp: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
          </div>
          <Button type="submit" className="w-full sm:w-auto">Save Product</Button>
        </form>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              {["Photo", "Product", "Category", "Price", "MRP", "Stock", ""].map((h) => <th key={h} className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <td className="px-4 py-3">
                  <label className="relative block w-11 h-14 rounded-lg overflow-hidden cursor-pointer group/photo" title="Click to change photo">
                    <img src={imgUrl(p.img)} className="w-full h-full object-cover" alt="" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/photo:opacity-100 transition-opacity">
                      <Upload size={13} className="text-white" />
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(p.id, e.target.files[0])} />
                  </label>
                </td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>{CATEGORIES.find((c) => c.id === p.category)?.label}</td>
                <td className="px-4 py-3">
                  <input type="number" value={p.price} onChange={(e) => updateField(p.id, "price", Number(e.target.value))} onBlur={(e) => commitField(p.id, "price", Number(e.target.value))} className="w-20 px-2 py-1 rounded border font-mono text-xs outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
                </td>
                <td className="px-4 py-3">
                  <input type="number" value={p.mrp} onChange={(e) => updateField(p.id, "mrp", Number(e.target.value))} onBlur={(e) => commitField(p.id, "mrp", Number(e.target.value))} className="w-20 px-2 py-1 rounded border font-mono text-xs outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
                </td>
                <td className="px-4 py-3">
                  <input type="number" value={p.stock ?? 100} onChange={(e) => updateField(p.id, "stock", Number(e.target.value))} onBlur={(e) => commitField(p.id, "stock", Number(e.target.value))} className="w-16 px-2 py-1 rounded border font-mono text-xs outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
                </td>
                <td className="px-4 py-3"><button onClick={() => removeProduct(p.id)} style={{ color: "var(--danger)" }}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");

  useEffect(() => {
    Promise.all([apiGet("/api/reviews?all=1"), apiGet("/api/leads")])
      .then(([r, l]) => { setReviews(r.reviews || []); setLeads(l.leads || []); })
      .finally(() => setLoading(false));
  }, []);

  const shown = reviews.filter((r) => tab === "all" ? true : r.status === tab);

  const setReviewStatus = async (id, status) => {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    try { await apiPatch(`/api/reviews/${id}`, { status }); } catch { /* keep optimistic */ }
  };

  const cycleLead = async (l) => {
    const order = ["New", "Contacted", "Closed"];
    const status = order[(order.indexOf(l.status) + 1) % order.length];
    setLeads((prev) => prev.map((x) => x.id === l.id ? { ...x, status } : x));
    try { await apiPatch(`/api/leads/${l.id}`, { status }); } catch { /* keep optimistic */ }
  };

  if (loading) return <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Loading reviews & leads…</p>;

  return (
    <div>
      <h1 className="font-display text-3xl font-medium mb-1">Reviews & Bulk Leads</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-soft)" }}>Moderate customer reviews and manage inbound bulk inquiries.</p>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            {["pending", "approved", "all"].map((t) => (
              <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-full text-xs font-medium capitalize border" style={{ borderColor: tab === t ? "var(--accent)" : "var(--border)", color: tab === t ? "var(--accent)" : "var(--ink-soft)", background: tab === t ? "var(--accent-soft)" : "transparent" }}>{t}</button>
            ))}
          </div>
          <div className="space-y-3">
            {shown.length === 0 && <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Nothing here.</p>}
            {shown.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="font-medium text-sm">{r.name}</div>
                    <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>{r.productName}</div>
                  </div>
                  <StarRow rating={r.rating} size={12} />
                </div>
                <p className="text-sm mb-3" style={{ color: "var(--ink-soft)" }}>{r.text}</p>
                {r.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" className="!py-1.5 !px-3 !text-xs" onClick={() => setReviewStatus(r.id, "approved")}><CheckCircle2 size={13} /> Approve</Button>
                    <Button variant="ghost" className="!py-1.5 !px-3 !text-xs" style={{ color: "var(--danger)" }} onClick={() => setReviewStatus(r.id, "rejected")}><XCircle size={13} /> Reject</Button>
                  </div>
                ) : <Badge tone={r.status === "approved" ? "success" : "warn"}>{r.status}</Badge>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: "var(--ink-soft)" }}>Bulk Order Inquiries</h3>
          <div className="space-y-3">
            {leads.length === 0 && <p className="text-sm" style={{ color: "var(--ink-soft)" }}>No inquiries yet.</p>}
            {leads.map((l) => (
              <div key={l.id} className="p-4 rounded-2xl border flex items-center justify-between gap-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <div>
                  <div className="font-medium text-sm">{l.name} {l.company && <span style={{ color: "var(--ink-soft)" }}>· {l.company}</span>}</div>
                  <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{l.eventType} — {l.qty}</div>
                  <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>{l.createdAt?.slice(0, 10)}</div>
                </div>
                <button onClick={() => cycleLead(l)}>
                  <Badge tone={l.status === "Closed" ? "success" : l.status === "Contacted" ? "accent" : "warn"}>{l.status}</Badge>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", password: "", role: "ADMIN" });
  const [error, setError] = useState("");

  const load = () => apiGet("/api/admin/admins").then((d) => setAdmins(d.admins || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const addAdmin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { admin } = await apiPost("/api/admin/admins", draft);
      setAdmins((prev) => [...prev, admin]);
      setDraft({ name: "", email: "", password: "", role: "ADMIN" });
      setShowForm(false);
    } catch (err) {
      setError(err.message || "Couldn't create admin.");
    }
  };

  const toggleStatus = async (a) => {
    const status = a.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    setAdmins((prev) => prev.map((x) => x.id === a.id ? { ...x, status } : x));
    try { await apiPatch(`/api/admin/admins/${a.id}`, { status }); } catch { load(); }
  };

  const changeEmail = async (a) => {
    const email = window.prompt(`New email for ${a.name}:`, a.email);
    if (!email || email === a.email) return;
    try {
      const { admin } = await apiPatch(`/api/admin/admins/${a.id}`, { email });
      setAdmins((prev) => prev.map((x) => x.id === a.id ? admin : x));
    } catch (err) {
      alert(err.message || "Couldn't update email.");
    }
  };

  const resetPassword = async (a) => {
    const password = window.prompt(`New password for ${a.name} (min 6 characters):`);
    if (!password) return;
    try {
      await apiPatch(`/api/admin/admins/${a.id}`, { password });
      alert("Password updated.");
    } catch (err) {
      alert(err.message || "Couldn't reset password.");
    }
  };

  const removeAdmin = async (a) => {
    if (!window.confirm(`Delete ${a.name}'s admin account? This can't be undone.`)) return;
    setAdmins((prev) => prev.filter((x) => x.id !== a.id));
    try { await apiDelete(`/api/admin/admins/${a.id}`); } catch { load(); }
  };

  if (loading) return <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Loading admin accounts…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl font-medium mb-1">Admin Management</h1>
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Only you (Super Admin) can create, edit or remove other admin accounts.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}><Plus size={15} /> Add Admin</Button>
      </div>

      {showForm && (
        <form onSubmit={addAdmin} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 p-5 rounded-2xl border mb-6" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <input required placeholder="Full name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
          <input required type="email" placeholder="Email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
          <input required type="password" placeholder="Password (min 6 chars)" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }} />
          <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
            <option value="ADMIN">Admin</option>
            <option value="ORDER_MANAGER">Order Manager</option>
            <option value="PRODUCT_MANAGER">Product Manager</option>
          </select>
          <Button type="submit">Create Account</Button>
          {error && <p className="text-sm sm:col-span-2 lg:col-span-5" style={{ color: "var(--danger)" }}>{error}</p>}
        </form>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              {["Name", "Email", "Role", "Status", ""].map((h) => <th key={h} className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: "var(--ink-soft)" }}>No other admins yet — add one above.</td></tr>
            )}
            {admins.map((a) => (
              <tr key={a.id} className="border-t" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <td className="px-4 py-3 font-medium">{a.name}</td>
                <td className="px-4 py-3" style={{ color: "var(--ink-soft)" }}>{a.email}</td>
                <td className="px-4 py-3"><Badge tone="accent">{ROLE_LABELS[a.role]}</Badge></td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(a)}>
                    <Badge tone={a.status === "ACTIVE" ? "success" : "warn"}>{a.status === "ACTIVE" ? "Active" : "Disabled"}</Badge>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 text-xs">
                    <button onClick={() => changeEmail(a)} style={{ color: "var(--accent)" }}>Email</button>
                    <button onClick={() => resetPassword(a)} style={{ color: "var(--accent)" }}>Password</button>
                    {canDeleteManagedRole(a.role) && (
                      <button onClick={() => removeAdmin(a)} style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------- ROOT APP ---------------------------------- */
export default function CreativoApp({ initialPage = "home" }) {
  const [theme, setTheme] = useState("light");
  const [page, setPage] = useState(initialPage);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [products, setProducts] = useState([]);

  // Storefront product catalog comes straight from the database (public endpoint),
  // so admin changes (price, photo, new products) show up here too.
  useEffect(() => {
    apiGet("/api/products").then((data) => {
      setProducts(data.products || []);
      setSelectedProduct((prev) => prev || data.products?.[0] || null);
    }).catch(() => {});
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const goTo = (p) => { setPage(p); window.scrollTo?.({ top: 0, behavior: "smooth" }); };

  const addToCart = (product, variant, qty, custom = {}) => {
    const key = `${product.id}-${variant}-${custom.customText || ""}-${custom.fileName || ""}`;
    setCart((prev) => {
      const existing = prev.find((c) => c.key === key);
      if (existing) return prev.map((c) => c.key === key ? { ...c, qty: c.qty + qty } : c);
      return [...prev, { key, product, variant, price: product.price, qty, custom }];
    });
  };
  const updateQty = (key, delta) => setCart((prev) => prev.map((c) => c.key === key ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  const removeFromCart = (key) => setCart((prev) => prev.filter((c) => c.key !== key));
  const clearCart = () => setCart([]);

  const appValue = { page, goTo, selectedProduct, setSelectedProduct, cart, addToCart, updateQty, removeFromCart, clearCart, search, setSearch, categoryFilter, setCategoryFilter, products };

  const isAdmin = page.startsWith("admin");

  let content;
  if (page === "home") content = <HomePage />;
  else if (page === "shop") content = <ShopPage />;
  else if (page === "product") content = <ProductPage />;
  else if (page === "cart") content = <CartPage />;
  else if (page === "checkout") content = <CheckoutPage />;
  else if (page === "bulk") content = <BulkOrdersPage />;
  else if (page === "admin-dashboard") content = <AdminDashboard />;
  else if (page === "admin-orders") content = <AdminOrders />;
  else if (page === "admin-products") content = <AdminProducts />;
  else if (page === "admin-reviews") content = <AdminReviews />;
  else if (page === "admin-admins") content = <AdminManagement />;
  else content = <HomePage />;

  return (
    <ThemeCtx.Provider value={{ theme, toggleTheme }}>
      <AppCtx.Provider value={appValue}>
        <div className="creativo-root min-h-screen" style={THEMES[theme]}>
          <GlobalStyle />
          {isAdmin ? (
            <AdminLayout>{content}</AdminLayout>
          ) : (
            <>
              <SiteNav />
              <div key={page} className="rise-in">{content}</div>
              <SiteFooter />
            </>
          )}
        </div>
      </AppCtx.Provider>
    </ThemeCtx.Provider>
  );
}
