import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  Receipt,
  ArrowRight,
  Lock,
  Zap,
  Globe2,
  CheckCircle2,
  ChevronRight,
  Scale,
  Handshake,
  FileSpreadsheet,
} from "lucide-react";
import SilverInterlockingGrid from "../components/SilverInterlockingGrid";
import Footer from "../components/Footer";

function GitHubIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [navigating, setNavigating] = useState(false);

  const handleContinueDemo = () => {
    setNavigating(true);
    setTimeout(() => {
      navigate("/dashboard");
    }, 150);
  };

  // Keyboard shortcut: Press Enter or Space to quickly enter demo mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && !navigating) {
        handleContinueDemo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigating]);

  return (
    <div className="dark relative min-h-screen bg-[#070b14] text-slate-100 flex flex-col overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* 1. Interactive Silver Square Interlocking Grid Background */}
      <SilverInterlockingGrid />

      {/* Subtle radial ambient gradients for depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* 2. Top Navigation Bar (without theme toggle) */}
      <header
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between"
        data-no-grid="true"
      >
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 p-1.5 shadow-lg shadow-indigo-500/10 group-hover:border-indigo-500/50 transition-colors">
            <img
              src="/favicon.svg"
              alt="SponsorLedger Emblem"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-indigo-300 transition-colors">
              SponsorLedger
            </span>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Event Financial Ledger & Audit
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <a
            href="https://github.com/diptodeepb/SponsorLedger"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
          >
            <GitHubIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          <button
            type="button"
            onClick={handleContinueDemo}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Launch App</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 3. Hero Section (Humanized, No AI Slop) */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 sm:px-6 pt-4 sm:pt-6 pb-12 sm:pb-16 text-center max-w-5xl mx-auto w-full">
        {/* Main Logo & Glowing Ring */}
        <div
          className="relative mb-6 group cursor-default emblem-box"
          data-interactive="true"
        >
          <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/20 via-blue-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-900 border border-slate-700/80 p-3 shadow-2xl flex items-center justify-center backdrop-blur-xl">
            <img
              src="/favicon.svg"
              alt="SponsorLedger Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(99,102,241,0.35)] transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Humanized Headline */}
        <h1
          className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-4xl leading-[1.15] drop-shadow-sm"
          data-interactive="true"
        >
          Clean event finances.{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
            Zero spreadsheet chaos.
          </span>
        </h1>

        {/* Humanized Subtitle */}
        <p
          className="mt-4 text-base sm:text-lg text-slate-200 font-medium max-w-2xl leading-relaxed"
          data-interactive="true"
        >
          Built for hackathon leads, student clubs, and tech conference teams.
          Track who pledged what, collect every receipt, catch double-billing
          before it happens, and turn messy chat notes into clean expense
          records in seconds.
        </p>

        {/* Humanized Feature Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-slate-200">
          <span
            className="badge-pill px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-1.5 font-bold shadow-sm"
            data-interactive="true"
          >
            <Handshake className="w-3.5 h-3.5 text-emerald-400" />
            Sponsor pledges & deliverable proof
          </span>
          <span
            className="badge-pill px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-1.5 font-bold shadow-sm"
            data-interactive="true"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Raw chat notes to CSV via Gemma AI
          </span>
          <span
            className="badge-pill px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-1.5 font-bold shadow-sm"
            data-interactive="true"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            14 automated audit invariant checks
          </span>
        </div>

        {/* 4. Action Cards: High Weight Solid Contrast */}
        <div className="mt-4 sm:mt-5 w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Card 1: Continue via Guest Mode (MAX WEIGHT, 100% SOLID OPAQUE) */}
          <div className="relative group landing-card" data-interactive="true">
            {/* Cornered Tilted Blue Header Badge */}
            <div
              className="absolute -top-3.5 -right-3 px-3.5 py-1 bg-blue-600 text-white text-[11px] font-black tracking-wider rounded-lg shadow-xl shadow-blue-500/60 transform rotate-12 border border-blue-400/60 select-none z-30 pointer-events-none"
              style={{
                boxShadow: "0 4px 18px 0 rgba(37, 99, 235, 0.65)",
              }}
            >
              RECOMMENDED
            </div>

            <div
              onClick={handleContinueDemo}
              className="w-full h-full text-left p-7 sm:p-8 rounded-2xl bg-[#0c1322] border-2 border-indigo-500 hover:border-indigo-400 shadow-[0_20px_50px_rgba(0,0,0,0.95)] hover:shadow-[0_20px_50px_rgba(99,102,241,0.3)] transition-all duration-200 cursor-pointer relative z-20 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 mb-4 group-hover:scale-105 transition-transform">
                  <Zap className="w-6 h-6 text-indigo-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug drop-shadow-sm group-hover:text-indigo-200 transition-colors">
                  Continue via Guest Mode
                </h2>
                <p className="text-sm sm:text-base font-bold text-slate-200 mt-3 leading-relaxed">
                  Explore pre-loaded hackathon books, sponsor receipts, and live
                  Gemma AI. No signup needed.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-indigo-500/40">
                <div className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white font-black text-sm tracking-wide flex items-center justify-between shadow-xl shadow-indigo-600/40 transition-all">
                  <span>Try it out!</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Login / Signup (Solid Opaque, Disabled with SOON badge) */}
          <div className="relative landing-card" data-interactive="true">
            {/* Cornered Tilted Blue Header Badge */}
            <div
              className="absolute -top-3.5 -right-3 px-3 py-1 bg-blue-600 text-white text-[11px] font-black tracking-wider rounded-lg shadow-xl shadow-blue-500/50 transform rotate-12 border border-blue-400/50 select-none z-30 pointer-events-none"
              style={{
                boxShadow: "0 4px 16px 0 rgba(37, 99, 235, 0.55)",
              }}
            >
              SOON
            </div>

            <div
              className="w-full h-full text-left p-7 sm:p-8 rounded-2xl bg-[#0c1322] border border-slate-800 text-slate-400 select-none cursor-not-allowed opacity-80 relative z-20 overflow-hidden flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
              title="Enterprise & Member Authentication is coming soon"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-4">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-300 tracking-tight leading-snug">
                  Log In / Sign Up
                </h2>
                <p className="text-sm sm:text-base font-semibold text-slate-400 mt-3 leading-relaxed">
                  Team workspaces, custom roles, and multi-event ledger
                  management.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="w-full py-3.5 px-5 rounded-xl bg-slate-800/80 text-slate-400 font-bold text-sm flex items-center justify-between border border-slate-700/50">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    Authentication Locked
                  </span>
                  <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-950/70 px-2 py-0.5 rounded border border-blue-800/50">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Clean, Real Features (No AI Slop) */}
        <div className="mt-16 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div
            className="feature-card p-5 rounded-2xl border border-slate-800 bg-[#0c1322] shadow-xl"
            data-interactive="true"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <Handshake className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Sponsor Pledges & Proof
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
              Track promised pledges against received wire transfers, attach
              fulfillment proof links, and verify tier perks before closing
              books.
            </p>
          </div>

          <div
            className="feature-card p-5 rounded-2xl border border-slate-800 bg-[#0c1322] shadow-xl"
            data-interactive="true"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">
              AI Chat & Notes Parser
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
              Turn messy Slack or WhatsApp logs into clean expense records in
              seconds. Google Gemma extracts vendors, dates, and amounts with
              instant duplicate checks.
            </p>
          </div>

          <div
            className="feature-card p-5 rounded-2xl border border-slate-800 bg-[#0c1322] shadow-xl"
            data-interactive="true"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">
              14 Automated Audits & Reports
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
              Catch double-billing, budget overruns, and missing receipts in
              real time, then generate an audit-ready sponsor closeout report
              with one click.
            </p>
          </div>
        </div>
      </main>

      {/* 6. Global Professional Footer */}
      <Footer />
    </div>
  );
}
