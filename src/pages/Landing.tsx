import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sietFullLogo } from "@/components/branding/SIETLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  Building2,
  ChevronRight,
  Calculator,
} from "lucide-react";

export const Landing: React.FC = () => {
  // Live Thing: Interactive Institutional Attendance Calculator
  const [workingDays, setWorkingDays] = useState<number>(24);
  const [leavesTaken, setLeavesTaken] = useState<number>(2);

  const attendedDays = Math.max(0, workingDays - leavesTaken);
  const attendancePercentage =
    workingDays > 0 ? ((attendedDays / workingDays) * 100).toFixed(1) : "0.0";
  const numPercentage = parseFloat(attendancePercentage);

  const isSafeCap = leavesTaken <= 2;
  const isJNTUKEligible = numPercentage >= 75;

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col selection:bg-siet-primary selection:text-white transition-colors">
      {/* ─── Accessibility Skip Link ─── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-siet-primary text-white rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Skip to main content
      </a>

      {/* ─── Institutional Header ─── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & College Identity */}
          <Link
            to="/"
            className="flex items-center gap-3 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siet-primary rounded-xl"
            aria-label="Srinivasa Institute of Engineering & Technology Home"
          >
            <div className="bg-white rounded-xl p-1.5">
              <img
                src={sietFullLogo}
                alt="Srinivasa Institute of Engineering & Technology"
                width={200}
                height={48}
                className="h-10 sm:h-11 w-auto object-contain"
              />
            </div>
          </Link>

          {/* Institutional Navigation */}
          <nav
            aria-label="Portal Navigation"
            className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-600 dark:text-zinc-400"
          >
            <a
              href="#policy"
              className="hover:text-siet-primary dark:hover:text-red-400 transition-colors"
            >
              Attendance Governance
            </a>
            <a
              href="#cap"
              className="hover:text-siet-primary dark:hover:text-red-400 transition-colors"
            >
              Monthly 2-Day Cap
            </a>
            <a
              href="#departments"
              className="hover:text-siet-primary dark:hover:text-red-400 transition-colors"
            >
              Academic Departments
            </a>
          </nav>

          {/* Action Navigation */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siet-primary"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 text-xs font-semibold text-white rounded-xl bg-siet-primary hover:bg-siet-primary-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siet-primary focus-visible:ring-offset-2"
            >
              <span>Register</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main id="main-content" className="flex-1">
        {/* ─── Hero Section ─── */}
        <section className="pt-12 pb-20 lg:pt-20 lg:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-start">
            {/* Left Column: Authoritative Editorial Heading & Statements */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display leading-tight text-balance">
                Autonomous Academic Leave &amp; Attendance Governance
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
                Official digital ERP portal for Srinivasa Institute of Engineering &amp;
                Technology (Autonomous, JNTUK College Code: 6N). Paperless leave clearance,
                monthly 2-day safe allowance enforcement, and real-time semester examination eligibility tracking.
              </p>

              {/* Portal Entry Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-siet-primary hover:bg-siet-primary-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siet-primary focus-visible:ring-offset-2"
                >
                  <GraduationCap className="h-4 w-4" aria-hidden="true" />
                  <span>Student Portal</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siet-primary"
                >
                  <Building2 className="h-4 w-4 text-siet-primary dark:text-red-400" aria-hidden="true" />
                  <span>Faculty &amp; HOD Desk</span>
                </Link>
              </div>

              {/* Institutional Core Directives */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>2-Day Monthly Safe Cap</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>JNTUK ≥75% Exam Norm</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>HOD Department Sync</span>
                </div>
              </div>
            </div>

            {/* Right Column: The Live Thing (Interactive Attendance & Leave Impact Calculator) */}
            <div className="lg:col-span-5" data-ui="true">
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-siet-primary/10 dark:bg-red-500/15 text-siet-primary dark:text-red-400 flex items-center justify-center">
                      <Calculator className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Attendance &amp; Leave Simulator
                      </h2>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        JNTUK Norms &amp; Monthly Cap Calculation
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    Live Model
                  </span>
                </div>

                {/* Interactive Controls */}
                <div className="space-y-4">
                  {/* Working Days Selector */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      <label htmlFor="working-days-input">
                        Official Monthly Working Days
                      </label>
                      <span className="tabular-nums font-bold text-siet-primary dark:text-red-400">
                        {workingDays} Days
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[22, 24, 26].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setWorkingDays(days)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                            workingDays === days
                              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-750"
                          }`}
                        >
                          {days} Days
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Leaves Requested Selector */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      <label htmlFor="leaves-count">
                        Monthly Leaves Requested
                      </label>
                      <span className="tabular-nums font-bold text-zinc-900 dark:text-zinc-100">
                        {leavesTaken} {leavesTaken === 1 ? "Day" : "Days"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3, 4].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setLeavesTaken(count)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors ${
                            leavesTaken === count
                              ? "bg-siet-primary text-white"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-750"
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Real-time Calculation Result Box */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      Calculated Attendance
                    </span>
                    <span
                      className={`text-3xl font-bold tabular-nums leading-none ${
                        isJNTUKEligible
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-rose-700 dark:text-rose-400"
                      }`}
                    >
                      {attendancePercentage}%
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      {isSafeCap ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
                      )}
                      <span className={isSafeCap ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"}>
                        {isSafeCap
                          ? "Within Monthly 2-Day Safe Cap"
                          : "Exceeds Monthly 2-Day Permissible Cap"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-medium">
                      {isJNTUKEligible ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
                      )}
                      <span className={isJNTUKEligible ? "text-emerald-800 dark:text-emerald-300" : "text-rose-800 dark:text-rose-300"}>
                        {isJNTUKEligible
                          ? "Cleared for JNTUK Regular Examination Norms (≥75%)"
                          : "Critical: Falls below JNTUK Condonation Threshold (<75%)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Link */}
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siet-primary"
                >
                  <span>Access Portal Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Regulatory Framework Section ─── */}
        <section id="policy" className="py-16 bg-white dark:bg-zinc-900 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-3xl space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 font-display">
                Autonomous Attendance Governance
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                Srinivasa Institute of Engineering &amp; Technology operates under strict
                JNTUK Autonomous academic regulations. The digital portal automates
                quota enforcement to prevent semester condonation and detention.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Directive 1 */}
              <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-850 space-y-3">
                <span className="text-xs font-bold text-siet-primary dark:text-red-400 block">
                  Directive 01
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-display">
                  Monthly 2-Day Safe Cap
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Students are limited to a maximum of 2 leaves per calendar month.
                  Regular student On-Duty leaves are disabled, ensuring consistent
                  classroom hours across the semester.
                </p>
              </div>

              {/* Directive 2 */}
              <div id="cap" className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-850 space-y-3">
                <span className="text-xs font-bold text-siet-gold block">
                  Directive 02
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-display">
                  HOD Working Days Sync
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Department Heads configure verified monthly working days.
                  Student attendance denominators calculate against these official
                  sessions, preventing discrepancy during semester audits.
                </p>
              </div>

              {/* Directive 3 */}
              <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-850 space-y-3">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                  Directive 03
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-display">
                  Digital Security Clearance
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Approved leaves generate a verifiable digital pass with unique
                  authorization tokens for campus security verification at the main gate.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Academic Departments ─── */}
        <section id="departments" className="py-16 bg-zinc-50 dark:bg-zinc-950 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display">
                  Academic Engineering Departments
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Autonomous curricula and department-level leave registries
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {[
                { code: "CSE", name: "Computer Science" },
                { code: "AIML", name: "AI & Machine Learning" },
                { code: "ECE", name: "Electronics & Comm." },
                { code: "EEE", name: "Electrical & Electronics" },
                { code: "MECH", name: "Mechanical Engg." },
                { code: "CIVIL", name: "Civil Engineering" },
                { code: "S&H", name: "Science & Humanities" },
              ].map((dept) => (
                <div
                  key={dept.code}
                  className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-center transition-colors"
                >
                  <span className="text-base font-bold text-siet-primary dark:text-red-400 font-display block">
                    {dept.code}
                  </span>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium block mt-0.5">
                    {dept.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer: Institutional Information ─── */}
      <footer className="mt-auto bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xs py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
            <div className="space-y-2">
              <div className="bg-white rounded-lg p-1 w-fit">
                <img
                  src={sietFullLogo}
                  alt="SIET Logo"
                  width={160}
                  height={38}
                  className="h-9 w-auto object-contain"
                />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal max-w-md">
                Srinivasa Institute of Engineering &amp; Technology (Autonomous).
                Approved by AICTE, New Delhi &amp; Permanently Affiliated to JNTUK, Kakinada.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-siet-primary text-white font-semibold text-xs hover:bg-siet-primary-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siet-primary"
              >
                Access Portal
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-750 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siet-primary"
              >
                Register Account
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-400 dark:text-zinc-500 text-[11px]">
            <p>
              Campus: NH-216, Cheyyeru, Amalapuram, Dr. B.R. Ambedkar Konaseema Dist., AP — 533216
            </p>
            <p className="tabular-nums">
              © {new Date().getFullYear()} SIET Leave Tracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
