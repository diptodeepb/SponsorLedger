import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Scale,
  Server,
  Database,
  Sparkles,
  GitBranch,
  Bug,
  Lock,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '../components/UI';

export default function PrivacyPolicy() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
          Effective as of: October 19, 2026
        </span>
      </div>

      <PageHeader
        title="Privacy Policy"
        subtitle="Data handling principles, guest mode privacy standards, and third-party processing disclosures."
      />

      {/* Cross-link banner between ToS and Privacy */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <Link
          to="/tos"
          className="pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <Scale className="w-4 h-4" />
          <span>Terms of Service</span>
        </Link>
        <span className="pb-3 text-sm font-bold flex items-center gap-2 border-b-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Privacy Policy</span>
        </span>
      </div>

      <div className="card p-6 sm:p-8 space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">1</span>
            <span>Minimal-Data Principle & Information Processed</span>
          </h2>
          <p>
            SponsorLedger is engineered with a strict minimal-data collection footprint. The Service operates without requiring user accounts or passwords. We process only the information necessary to perform event ledger auditing, multi-currency conversion, and document synthesis:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <li><strong>Financial Ledger Data:</strong> Event names, sponsor pledges, payment receipts, expense dates, categories, voucher references, and memo notes entered by the user.</li>
            <li><strong>Uploaded Files:</strong> Tabular CSV files and unstructured text (<code>.txt</code>) notes submitted for expense ingestion.</li>
            <li><strong>Ephemeral Session Tokens:</strong> An anonymous pseudorandom identifier (<code>X-Guest-Session</code>) generated locally to sandbox your data completely from other concurrent visitors.</li>
            <li><strong>Diagnostic Telemetry:</strong> Uncaught error stack traces, HTTP error response status codes, and browser user-agent strings captured strictly to diagnose application stability issues.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">2</span>
            <span>Policy Modifications Without Prior Notice (Guest Mode Operation)</span>
          </h2>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            SponsorLedger operates in guest and demo mode. We do not maintain a user email registry, mailing list, or notification pipeline.
          </p>
          <p>
            Because we do not collect or store email addresses or user contact coordinates, we have no mechanism or obligation to send individualized email notices regarding revisions to this Privacy Policy.
          </p>
          <p>
            We reserve the right to amend, update, or revise this Privacy Policy at our discretion at any time without prior notice. Any updates will become effective immediately upon posting to this URL, indicated by the revised &ldquo;Effective as of&rdquo; date. <strong>It is your affirmative responsibility as a user to periodically inspect and review this Privacy Policy.</strong> Continued access or use of the application after amendments are published constitutes full acknowledgement and acceptance of the revised policy.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">3</span>
            <span>No Sale of Personal Data & Zero Advertising Trackers</span>
          </h2>
          <p>
            <strong>We do not sell, rent, monetize, or broker user data.</strong> SponsorLedger does not utilize commercial advertising networks, retargeting pixels, social media widgets, or cross-site tracking cookies.
          </p>
          <p>
            Browser <code>localStorage</code> is used strictly for non-tracking client UI and session isolation state:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <li>Anonymous sandbox session identifier (<code>sponsorledger_guest_session</code>) ensuring complete data isolation</li>
            <li>Display currency preference (USD, INR, EUR, GBP, CAD, etc.)</li>
            <li>Dark / Light theme appearance preference</li>
            <li>Sidebar collapsed / expanded preference</li>
            <li>Closeout checklist local checkmark states</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">4</span>
            <span>Third-Party Data Sub-Processors</span>
          </h2>
          <p>
            Data transmitted through SponsorLedger is processed exclusively by the following infrastructure providers in order of application workflow:
          </p>

          <div className="grid grid-cols-1 gap-3.5 pt-1">
            {/* 1. Render */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-xs">
                  <Server className="w-4 h-4 text-purple-500" />
                  <span>1. Render (Render Services, Inc.)</span>
                </div>
                <span className="text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded font-medium">
                  Cloud Infrastructure & Edge Routing
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Processes incoming HTTP requests and handles edge SSL/TLS encryption. Connection IP addresses and transit headers are retained temporarily in standard operational access logs.
              </p>
            </div>

            {/* 2. MongoDB Atlas */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-xs">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span>2. MongoDB Atlas (MongoDB, Inc.)</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded font-medium">
                  Encrypted Database Storage
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Stores application documents, event metadata, and ledger transaction entries. All database traffic is encrypted in transit using TLS 1.3 and encrypted at rest with AES-256.
              </p>
            </div>

            {/* 3. Google Gemma via Google GenAI */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>3. Google Gemma (Google LLC via Google GenAI API)</span>
                </div>
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded font-medium">
                  AI Text Ingestion & Summary Generation
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Processes unstructured expense text into tabular formats and synthesizes closeout reports. Under Google GenAI API policies, customer inputs and outputs are not retained or utilized to train Google foundational AI models.
              </p>
            </div>

            {/* 4. GitHub */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-xs">
                  <GitBranch className="w-4 h-4 text-slate-400" />
                  <span>4. GitHub (GitHub, Inc. / Microsoft Corp.)</span>
                </div>
                <span className="text-[10px] font-mono bg-slate-500/10 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                  Source Code Hosting
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Repository hosting for public code, release downloads, and issue discussions.
              </p>
            </div>

            {/* 5. Sentry */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-xs">
                  <Bug className="w-4 h-4 text-rose-500" />
                  <span>5. Sentry (Functional Software, Inc.)</span>
                </div>
                <span className="text-[10px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-300 px-2 py-0.5 rounded font-medium">
                  Error Logging & Diagnostics
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Receives anonymized technical crash reports and stack traces when unhandled exceptions occur. Data scrubbers prevent sensitive financial numbers or keys from being recorded.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">5</span>
            <span>Data Control, Anonymous Cloned Sandbox & Retention</span>
          </h2>
          <p>
            SponsorLedger implements an <strong>Anonymous Cloned Sandbox</strong> architecture. Every visitor receives an isolated workspace clone in MongoDB keyed to their anonymous client session token. Multiple users can explore, upload statements, clear records, or restore sample demo datasets simultaneously without data collisions or cross-user visibility.
          </p>
          <p>
            <strong>Automated TTL Purges:</strong> Inactive guest sandboxes are automatically pruned and deleted from MongoDB after 48 hours via database Time-To-Live (TTL) index policies.
          </p>
          <p>
            <strong>Immediate User Wipe:</strong> Users retain full sovereignty over their temporary session data. You can instantly wipe all transactions, sponsors, and deliverables to test a clean ledger slate at any time using the &ldquo;Clear All Sandbox Data&rdquo; control in the top navigation bar, or rotate to a brand-new anonymous session token.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">6</span>
            <span>Open Source Transparency & AGPLv3 Governance</span>
          </h2>
          <p>
            SponsorLedger is licensed under the <strong>GNU Affero General Public License Version 3 (AGPL-3.0)</strong>. Because the complete source code is public and transparent, users can independently verify our data practices, audit our dependencies, or self-host private instances completely isolated from any external telemetry.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            For code audits and developer communications, visit{' '}
            <a
              href="https://github.com/diptodeepb/SponsorLedger"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span>github.com/diptodeepb/SponsorLedger</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">7</span>
            <span>Grievance Redressal & Contact Coordinates</span>
          </h2>
          <p>
            For any privacy inquiries, questions regarding data processing practices, or grievance redressal, you may reach out directly to the developer:
          </p>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5 text-xs">
            <p><strong>Grievance Contact:</strong> Diptodeep Biswas</p>
            <p>
              <strong>Direct Email:</strong>{' '}
              <a
                href="mailto:diptodeepbofficial@gmail.com"
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                diptodeepbofficial@gmail.com
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
