import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

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

export default function Footer({ className = "" }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      className={`relative z-10 w-full border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#070b14]/95 backdrop-blur-md pt-14 pb-10 px-4 sm:px-8 text-sm text-slate-600 dark:text-slate-400 ${className}`}
      data-no-grid="true"
    >
      <div className="max-w-7xl mx-auto">
        {/* Top 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pb-12 text-left">
          {/* Column 1: Brand & Summary (6 cols) */}
          <div className="space-y-4 md:col-span-6">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 p-1.5 flex items-center justify-center group-hover:border-indigo-500/50 transition-colors">
                <img
                  src="/favicon.svg"
                  alt="SponsorLedger"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                SponsorLedger
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
              Deterministic financial ledger and sponsor deliverable verification
              built for hackathons, student organizations, and tech conference
              teams.
            </p>
            {/* Circular Icon Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://github.com/diptodeepb/SponsorLedger"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-700 transition shadow-xs"
                title="GitHub Repository"
              >
                <GitHubIcon className="w-4 h-4" />
              </a>
              <a
                href="mailto:diptodeepbofficial@gmail.com"
                className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-700 transition shadow-xs"
                title="Contact Developer"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Navigation (3 cols) */}
          <div className="space-y-4 md:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <Link
                  to="/"
                  className="hover:text-slate-900 dark:hover:text-white transition"
                >
                  Home
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/diptodeepb/SponsorLedger#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 dark:hover:text-white transition"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/diptodeepb/SponsorLedger/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 dark:hover:text-white transition"
                >
                  Issue Tracker
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal (3 cols) */}
          <div className="space-y-4 md:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-slate-900 dark:hover:text-white transition"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/tos"
                  className="hover:text-slate-900 dark:hover:text-white transition"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/diptodeepb/SponsorLedger/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 dark:hover:text-white transition"
                >
                  AGPL-3.0 License
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-500">
          <div>© 2026 SponsorLedger. All rights reserved.</div>

          <div>
            <button
              type="button"
              onClick={scrollToTop}
              className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs text-xs sm:text-sm font-medium"
            >
              <span>Back to top</span>
              <span>↑</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
