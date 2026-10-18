import { Link } from 'react-router-dom';
import {
  Scale,
  ShieldCheck,
  Server,
  Database,
  Sparkles,
  GitBranch,
  Bug,
  Globe2,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '../components/UI';

export default function TermsOfService() {
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
        title="Terms of Service"
        subtitle="Standard operating terms, developer liability protections, and AGPLv3 open-source licensing."
      />

      {/* Cross-link banner between ToS and Privacy */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <span className="pb-3 text-sm font-bold flex items-center gap-2 border-b-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400">
          <Scale className="w-4 h-4" />
          <span>Terms of Service</span>
        </span>
        <Link
          to="/privacy"
          className="pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Privacy Policy</span>
        </Link>
      </div>

      {/* Critical Developer Protection Notice Banner */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>IMPORTANT NOTICE: NO FINANCIAL, ACCOUNTING, OR LEGAL ADVICE</span>
        </div>
        <p>
          SponsorLedger is an open-source software project provided strictly on an <strong>&ldquo;AS IS&rdquo;</strong> and <strong>&ldquo;AS AVAILABLE&rdquo;</strong> basis. SponsorLedger is not a registered financial advisor, CPA firm, or legal fiduciary. All ledger balances, multi-currency conversions, audit anomaly checks, and AI data transformations are operational aids and must be independently verified by authorized human organizers before taking financial action or submitting reports.
        </p>
      </div>

      <div className="card p-6 sm:p-8 space-y-8 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">1</span>
            <span>Acceptance of Terms</span>
          </h2>
          <p>
            By accessing, browsing, interacting with, or running the SponsorLedger web interface, API, or underlying scripts (collectively, the &ldquo;Service&rdquo;), you acknowledge that you have read, understood, and agreed to be legally bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not accept all terms contained herein, you are not authorized to use the Service and must immediately discontinue access.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">2</span>
            <span>Unilateral Modifications Without Prior Notice (Guest Mode Operation)</span>
          </h2>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            SponsorLedger operates entirely in demonstration and guest mode. The Service does not harvest user credentials, require mandatory account registration, or collect user email addresses.
          </p>
          <p>
            Because we do not collect or store user contact information, we possess no technical means or legal obligation to transmit individualized electronic notices, emails, or updates regarding modifications to these Terms.
          </p>
          <p>
            We reserve the right, at our sole discretion, to modify, amend, update, or replace any portion of these Terms at any time without prior individual notice. Any revised Terms will be posted directly to this URL with an updated &ldquo;Effective as of&rdquo; date. <strong>It is your affirmative responsibility and legal duty as a user to periodically inspect and review this page for updates.</strong> Your continued access to or use of the Service following the publication of any modifications constitutes binding acceptance of the updated Terms.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">3</span>
            <span>Disclaimer of Warranties (&ldquo;AS IS&rdquo;)</span>
          </h2>
          <p className="uppercase font-semibold text-xs text-slate-800 dark:text-slate-200">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:
          </p>
          <p>
            THE SERVICE, SOFTWARE CODE, DOCUMENTATION, AND ALL OUTPUTS ARE PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS, WITH ALL FAULTS AND DEFECTS. THE DEVELOPER, AUTHORS, MAINTAINERS, AND CONTRIBUTORS SPECIFICALLY DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, ACCURACY, SYSTEM INTEGRATION, AND NON-INFRINGEMENT.
          </p>
          <p>
            NO WARRANTY IS MADE THAT THE SERVICE WILL SATISFY YOUR ORGANIZATIONAL OR EVENT REQUIREMENTS, THAT THE SERVICE WILL OPERATE UNINTERRUPTED OR ERROR-FREE, OR THAT ARITHMETIC RECONCILIATIONS OR AI TRANSFORMATIONS WILL BE COMPLETELY ACCURATE OR RELIABLE UNDER ALL CIRCUMSTANCES.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">4</span>
            <span>Comprehensive Limitation of Liability</span>
          </h2>
          <p>
            UNDER NO CIRCUMSTANCES SHALL THE DEVELOPER, MAINTAINERS, CONTRIBUTORS, OR COPYRIGHT HOLDERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, WITHOUT LIMITATION, LOSS OF EVENT REVENUE, SPONSOR WITHDRAWALS, TAX LIABILITIES, LOSS OF DATA, CORRUPTION OF RECORDS, BUSINESS INTERRUPTION, OR PROCUREMENT OF SUBSTITUTE SERVICES) ARISING OUT OF OR IN CONNECTION WITH THE USE OF OR INABILITY TO USE THIS SERVICE, UNDER ANY THEORY OF LIABILITY (WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT INCLUDING NEGLIGENCE), EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
          </p>
          <p>
            WHERE APPLICABLE LAW DOES NOT ALLOW THE COMPLETE EXCLUSION OF CERTAIN LIABILITIES, THE TOTAL AGGREGATE LIABILITY OF THE DEVELOPER AND CONTRIBUTORS TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING TO THE SERVICE SHALL BE STRICTLY LIMITED TO ONE UNITED STATES DOLLAR ($1.00 USD).
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">5</span>
            <span>Integrated External Cloud Services</span>
          </h2>
          <p>
            To deliver live cloud hosting, database persistence, artificial intelligence processing, version control, and diagnostic telemetry, SponsorLedger relies on independent third-party service providers in the following order of application execution:
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
                  Cloud Hosting & Web Runtime
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Hosts containerized backend services and routes HTTP/HTTPS network traffic. Server logs containing client IP addresses and network connection headers are processed in compliance with Render&rsquo;s Terms of Service and Privacy Policy.
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
                  Encrypted Database Persistence
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Stores structured event profiles, financial ledger entries, sponsor pledges, and audit logs. Data is encrypted in transit via TLS 1.3 and encrypted at rest in MongoDB cloud clusters.
              </p>
            </div>

            {/* 3. Google Gemma via Google GenAI */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>3. Google Gemma (Google LLC via Google GenAI)</span>
                </div>
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded font-medium">
                  AI Text Extraction & Closeout Summaries
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Parses user-submitted unstructured <code>.txt</code> expense notes into CSV rows and drafts narrative event summaries via the <code>gemma-4-26b-a4b-it</code> model. Inputs and outputs are handled under Google Generative AI API terms. Payloads are not used to train Google foundational models under standard commercial API terms.
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
                  Source Code & Issue Tracking
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Maintains open-source repository releases, version tags, public issues, and community contributions.
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
                  Runtime Diagnostics & Error Logging
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Captures uncaught browser and backend runtime exceptions strictly to identify bugs and crashes. Telemetry includes stack traces and browser metadata; no financial payment credentials or secret API tokens are transmitted.
              </p>
            </div>

            {/* 6. Currency Providers */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-xs">
                  <Globe2 className="w-4 h-4 text-sky-500" />
                  <span>6. Foreign Exchange Reference Feeds</span>
                </div>
                <span className="text-[10px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-300 px-2 py-0.5 rounded font-medium">
                  Forex Rate Conversion Reference
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Provides reference foreign exchange conversion rates for visualization. Converted amounts are informative approximations and do not constitute guaranteed commercial banking rates.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">6</span>
            <span>User Responsibilities & Evaluation Sandbox</span>
          </h2>
          <p>
            Users are strictly prohibited from uploading authentic financial credentials, online banking passwords, payment card security codes (CVV), or classified government personal identifiers.
          </p>
          <p>
            SponsorLedger provisions isolated evaluation sandboxes keyed to ephemeral client session tokens. While guest sandboxes are strictly isolated from concurrent users, sandboxes are designed for testing and review. Sandbox records are subject to automated 48-hour TTL deletion or user-initiated resets. You are solely responsible for maintaining verified offline backup copies of all authentic accounting records, tax documents, and original expense vouchers.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">7</span>
            <span>User Indemnification</span>
          </h2>
          <p>
            You agree to defend, indemnify, and hold harmless the developer, contributors, and maintainers against any claims, liabilities, damages, losses, expenses, or legal costs (including attorney fees) arising from: (a) your use of or access to the Service; (b) your violation of these Terms; or (c) any claim that financial records or data submitted by you caused damage to a sponsor, event partner, or third party.
          </p>
        </section>

        {/* Section 8 - ACTUAL LICENSE: AGPL-3.0 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">8</span>
            <span>Open Source License: GNU AGPLv3</span>
          </h2>
          <p>
            SponsorLedger is free, open-source software distributed under the terms of the <strong>GNU Affero General Public License Version 3 (AGPL-3.0)</strong>.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Under the GNU AGPLv3, you are free to run, study, modify, and distribute this software. If you modify SponsorLedger and run it on a network server to provide services to users, you are legally required to make the complete corresponding source code of your modified version available to all network users under the AGPLv3. The full license text is maintained in the root <code>LICENSE</code> file of the repository.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">9</span>
            <span>Governing Law, Grievance Redressal & Inquiries</span>
          </h2>
          <p>
            These Terms shall be governed by and interpreted under the laws of the jurisdiction in which the developer resides, without regard to conflict of law rules.
          </p>
          <p>
            For any legal inquiries, concerns regarding these Terms, or grievance redressal, you may contact the developer directly at{' '}
            <a
              href="mailto:diptodeepbofficial@gmail.com"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              diptodeepbofficial@gmail.com
            </a>{' '}
            or submit an issue via the official repository at{' '}
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
      </div>
    </div>
  );
}
