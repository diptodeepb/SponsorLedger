import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Handshake,
  Receipt,
  ShieldAlert,
  FileSpreadsheet,
  Scale,
  ShieldCheck,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import CurrencySwitcher from "./CurrencySwitcher";
import ThemeToggle from "./ThemeToggle";
import SandboxControls from "./SandboxControls";
import Footer from "./Footer";

function GitHubIcon({ className = "w-3.5 h-3.5" }) {
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

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/sponsors", label: "Sponsors", icon: Handshake, end: false },
  { to: "/expenses", label: "Expenses", icon: Receipt, end: false },
  { to: "/audit", label: "Audit & Findings", icon: ShieldAlert, end: false },
  {
    to: "/report",
    label: "Closeout Report",
    icon: FileSpreadsheet,
    end: false,
  },
];

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-slate-900 md:bg-white/95 md:dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-800 shadow-xl md:shadow-none backdrop-blur-xl md:sticky md:top-0 md:h-screen md:shrink-0 transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        } ${collapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className="flex flex-col h-full px-4 py-6">
          {/* Sidebar Header (PermLens style for both Desktop and Mobile) */}
          <div
            className={`flex items-center mb-8 ${
              collapsed ? "md:justify-center justify-between" : "justify-between"
            }`}
          >
            <NavLink
              to="/"
              className={`flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-800 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white transition select-none ${
                collapsed ? "md:hidden flex" : "flex"
              }`}
              title="Return to Landing Page"
            >
              <img src="/favicon.svg" alt="" className="w-5 h-5 object-contain" />
              <span>SponsorLedger</span>
            </NavLink>

            {/* Desktop Collapse / Expand Button */}
            <button
              type="button"
              onClick={() => {
                const next = !collapsed;
                setCollapsed(next);
                try {
                  localStorage.setItem("sidebar-collapsed", String(next));
                } catch (e) {
                  console.error(e);
                }
              }}
              className="hidden md:flex rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 p-2 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen size={18} strokeWidth={1.8} />
              ) : (
                <PanelLeftClose size={18} strokeWidth={1.8} />
              )}
            </button>

            {/* Mobile Close Button (matching PermLens rounded button style) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden flex rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 p-2 text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              aria-label="Close menu"
            >
              <X size={18} strokeWidth={1.8} />
            </button>
          </div>

          {/* Navigation Items (Exact PermLens layout & interactions) */}
          <nav className="flex-1 flex flex-col gap-3 text-sm font-semibold tracking-wide">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileMenuOpen(false)}
              >
                {({ isActive }) => (
                  <div
                    className={`group relative flex items-center ${
                      collapsed ? "md:justify-center" : ""
                    } rounded px-3 py-2 transition ${
                      isActive
                        ? "text-indigo-600 dark:text-white"
                        : "text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {/* Active vertical pill indicator */}
                    <span
                      className={`absolute left-0 top-0 h-full w-1 rounded-r bg-indigo-600 dark:bg-white transition-all duration-200 ease-out ${
                        isActive
                          ? "opacity-100 scale-y-100"
                          : "opacity-0 scale-y-50"
                      }`}
                      style={{ transformOrigin: "top" }}
                    />

                    {/* Icon with hover scale */}
                    <span className="transition-transform duration-200 group-hover:scale-110 shrink-0">
                      <Icon size={20} strokeWidth={1.6} />
                    </span>

                    {/* Label when expanded */}
                    <span
                      className={`ml-3 transition-opacity duration-200 truncate ${
                        collapsed ? "md:hidden" : "inline"
                      }`}
                    >
                      {label}
                    </span>

                    {/* Tooltip when collapsed (PermLens style) */}
                    {collapsed && (
                      <span className="hidden md:block absolute left-full ml-3 whitespace-nowrap rounded bg-slate-900 dark:bg-black/90 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50 pointer-events-none">
                        {label}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            ))}

            {/* Horizontal line dash divider right below Closeout Report */}
            <div className="border-t border-dashed border-slate-200 dark:border-slate-800 my-1 mx-1" />

            {/* Terms of Service */}
            <NavLink
              to="/tos"
              end={false}
              onClick={() => setMobileMenuOpen(false)}
            >
              {({ isActive }) => (
                <div
                  className={`group relative flex items-center ${
                    collapsed ? "md:justify-center" : ""
                  } rounded px-3 py-2 transition ${
                    isActive
                      ? "text-indigo-600 dark:text-white"
                      : "text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-0 h-full w-1 rounded-r bg-indigo-600 dark:bg-white transition-all duration-200 ease-out ${
                      isActive
                        ? "opacity-100 scale-y-100"
                        : "opacity-0 scale-y-50"
                    }`}
                    style={{ transformOrigin: "top" }}
                  />

                  <span className="transition-transform duration-200 group-hover:scale-110 shrink-0">
                    <Scale size={20} strokeWidth={1.6} />
                  </span>

                  <span
                    className={`ml-3 transition-opacity duration-200 truncate ${
                      collapsed ? "md:hidden" : "inline"
                    }`}
                  >
                    Terms of Service
                  </span>

                  {collapsed && (
                    <span className="hidden md:block absolute left-full ml-3 whitespace-nowrap rounded bg-slate-900 dark:bg-black/90 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50 pointer-events-none">
                      Terms of Service
                    </span>
                  )}
                </div>
              )}
            </NavLink>

            {/* Privacy Policy */}
            <NavLink
              to="/privacy"
              end={false}
              onClick={() => setMobileMenuOpen(false)}
            >
              {({ isActive }) => (
                <div
                  className={`group relative flex items-center ${
                    collapsed ? "md:justify-center" : ""
                  } rounded px-3 py-2 transition ${
                    isActive
                      ? "text-indigo-600 dark:text-white"
                      : "text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-0 h-full w-1 rounded-r bg-indigo-600 dark:bg-white transition-all duration-200 ease-out ${
                      isActive
                        ? "opacity-100 scale-y-100"
                        : "opacity-0 scale-y-50"
                    }`}
                    style={{ transformOrigin: "top" }}
                  />

                  <span className="transition-transform duration-200 group-hover:scale-110 shrink-0">
                    <ShieldCheck size={20} strokeWidth={1.6} />
                  </span>

                  <span
                    className={`ml-3 transition-opacity duration-200 truncate ${
                      collapsed ? "md:hidden" : "inline"
                    }`}
                  >
                    Privacy Policy
                  </span>

                  {collapsed && (
                    <span className="hidden md:block absolute left-full ml-3 whitespace-nowrap rounded bg-slate-900 dark:bg-black/90 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50 pointer-events-none">
                      Privacy Policy
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          </nav>

          {/* Footer info */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            {collapsed ? (
              <div className="hidden md:flex flex-col items-center gap-3 w-full py-1">
                <span
                  className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
                  title="System Verified"
                />
                <a
                  href="https://github.com/diptodeepb/SponsorLedger"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                  title="GitHub"
                >
                  <GitHubIcon className="w-4 h-4" />
                </a>
              </div>
            ) : null}

            <div
              className={`flex items-center justify-between w-full ${
                collapsed ? "md:hidden" : "flex"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  System Verified
                </span>
              </div>
              <a
                href="https://github.com/diptodeepb/SponsorLedger"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <GitHubIcon className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        {/* Top Header Bar */}
        <header className="relative h-16 px-4 sm:px-8 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Left Header: Customize Sandbox Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:inline">
                Customize:
              </span>
              <SandboxControls />
            </div>
          </div>

          {/* Right Header: Currency Switcher & Theme Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:inline">
                Currency:
              </span>
              <CurrencySwitcher />
            </div>

            {/* Top Right Corner Theme Toggle */}
            <ThemeToggle />
          </div>

          {/* Modern Ambient Bottom Border Line */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent dark:via-slate-800/80 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent dark:via-indigo-400/25 blur-[0.5px] pointer-events-none" />
        </header>

        {/* Page Content */}
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 flex-1">
          {children}
        </div>

        {/* Global Professional Footer */}
        <Footer />
      </main>
    </div>
  );
}
