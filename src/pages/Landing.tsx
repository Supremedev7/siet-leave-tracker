import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { sietFullLogo } from "@/components/branding/SIETLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Building2,
  ChevronRight,
  Sparkles,
  FileCheck2,
  TrendingUp,
} from "lucide-react";

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col selection:bg-siet-primary selection:text-white transition-colors">
      {/* ─── Top Floating Institutional Header ─── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 py-1">
            <div className="bg-white/95 dark:bg-white rounded-xl p-1.5 shadow-2xs">
              <img
                src={sietFullLogo}
                alt="Srinivasa Institute of Engineering & Technology"
                className="h-10 sm:h-11 w-auto object-contain"
              />
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-zinc-600 dark:text-zinc-400">
            <a
              href="#policy"
              className="hover:text-siet-primary dark:hover:text-red-400 transition-colors uppercase tracking-wider"
            >
              Monthly 2-Day Policy
            </a>
            <a
              href="#attendance"
              className="hover:text-siet-primary dark:hover:text-red-400 transition-colors uppercase tracking-wider"
            >
              Attendance Governance
            </a>
            <a
              href="#departments"
              className="hover:text-siet-primary dark:hover:text-red-400 transition-colors uppercase tracking-wider"
            >
              Departments
            </a>
          </nav>

          {/* Action Buttons & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <Link
              to="/login"
              className="px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 shadow-2xs transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all"
              style={{
                background: "linear-gradient(135deg, #8B1A1A, #5A1010)",
              }}
            >
              <span>Register</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero Section with Dynamic Framer Motion Aesthetics ─── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Dynamic Background Geometry & Subtle Gradient Waves */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.08, 0.16, 0.08],
              x: [0, 20, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, #8B1A1A 0%, transparent 70%)",
            }}
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.12, 0.05],
              x: [0, -20, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, #F7941D 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Accreditation Badge */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-siet-primary/10 dark:bg-red-500/10 border border-siet-primary/20 dark:border-red-500/20 text-siet-primary dark:text-red-400 text-xs font-bold tracking-wide uppercase"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Autonomous • NAAC 'A' Grade • JNTUK Affiliated</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-display leading-[1.12]"
              >
                Automated Academic{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-siet-primary via-siet-primary-dark to-siet-primary dark:from-red-400 dark:via-red-300 dark:to-red-400">
                  Leave &amp; Attendance
                </span>{" "}
                Governance
              </motion.h1>

              {/* Sub-description */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium"
              >
                Official ERP portal for Srinivasa Institute of Engineering &amp;
                Technology. Paperless leave clearance, monthly 2-day safe allowance
                enforcement, and real-time JNTUK attendance percentage monitoring.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2"
              >
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-siet-primary/20 hover:shadow-xl transition-all hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #8B1A1A, #5A1010)",
                  }}
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Student Portal</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <Building2 className="h-4 w-4 text-siet-primary dark:text-red-400" />
                  <span>Faculty &amp; HOD Desk</span>
                </Link>
              </motion.div>

              {/* Quick Policy Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-semibold"
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>2-Day Monthly Cap</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>JNTUK ≥75% Attendance Guard</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>HOD Department Working Days Sync</span>
                </div>
              </motion.div>
            </div>

            {/* Right Dynamic Live Interactive Preview Showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              {/* Glassmorphic Portal Preview Card */}
              <div className="relative rounded-3xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 space-y-5 transition-colors">
                {/* Header Lockup */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-siet-primary/10 dark:bg-red-500/10 text-siet-primary dark:text-red-400 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 font-display">
                        SIET Leave Intelligence
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                        Live Attendance &amp; Absentee Engine
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Live Status: Online
                  </span>
                </div>

                {/* Simulated Attendance Scorecard */}
                <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                      Monthly Attendance
                    </span>
                    <span className="text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400 leading-none">
                      92.3%
                    </span>
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block mt-1">
                      ✓ JNTUK Regular Exam Norm Met
                    </span>
                  </div>
                  <div className="text-right text-xs space-y-1">
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 font-mono font-bold block">
                      24 / 26 Days
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono block">
                      2 Leaves Used (Safe)
                    </span>
                  </div>
                </div>

                {/* Calendar Legend Preview */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block uppercase tracking-wide">
                    Live Absentee Calendar Protocol
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-center">
                      <span className="h-3 w-3 rounded-md bg-white border border-zinc-300 mx-auto block mb-1" />
                      <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-200 block">White</span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500">Working Day</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 text-center">
                      <span className="h-3 w-3 rounded-md bg-zinc-300 dark:bg-zinc-600 mx-auto block mb-1" />
                      <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-200 block">Grey</span>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500">Sunday Off</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-center">
                      <span className="h-3 w-3 rounded-md bg-red-600 mx-auto block mb-1" />
                      <span className="text-[10px] font-bold text-red-700 dark:text-red-300 block">Red</span>
                      <span className="text-[9px] text-red-600/80 dark:text-red-400">Leave / Absent</span>
                    </div>
                  </div>
                </div>

                {/* Instant Link CTA */}
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>Launch Portal Sign In</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Institutional Core Governance Pillars ─── */}
      <section id="policy" className="py-16 bg-white dark:bg-zinc-900 border-y border-zinc-200/80 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-siet-primary dark:text-red-400 font-mono">
              Academic Regulatory Framework
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 font-display">
              Built for JNTUK Autonomous Excellence
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              Eliminate paper leave slips and unrecorded absences with an automated,
              verifiable digital authorization grid.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-lg transition-all space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-siet-primary/10 dark:bg-red-500/10 text-siet-primary dark:text-red-400 flex items-center justify-center font-bold">
                <CalendarDays className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 font-display">
                Monthly 2-Day Safe Cap
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Students are permitted a maximum of 2 leaves per calendar month.
                On-Duty (OD) is not available for regular students, safeguarding
                their mandatory semester attendance.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-lg transition-all space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-siet-gold/20 text-siet-gold flex items-center justify-center font-bold">
                <TrendingUp className="h-6 w-6 text-amber-700 dark:text-amber-400" />
              </div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 font-display">
                HOD Working Days Sync
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Department Heads configure official monthly working days.
                Students' monthly and cumulative percentages are computed in
                real-time against verified working sessions.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-lg transition-all space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 font-display">
                Digital Pass Verification
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Approved leave applications immediately produce tamper-proof
                clearance certificates with verification codes for security personnel
                at the main campus gate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Academic Departments Supported ─── */}
      <section id="departments" className="py-16 bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display">
                Academic Engineering Departments
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Multi-tenant departmental leave approval and attendance registries
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-siet-primary dark:text-red-400 uppercase tracking-wider">
              Autonomous Curricula
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { code: "CSE", name: "Computer Science" },
              { code: "ECE", name: "Electronics & Comm." },
              { code: "EEE", name: "Electrical & Electronics" },
              { code: "MECH", name: "Mechanical Engg." },
              { code: "CIVIL", name: "Civil Engineering" },
              { code: "AI&DS", name: "AI & Data Science" },
            ].map((dept) => (
              <div
                key={dept.code}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center shadow-2xs hover:border-siet-primary/60 dark:hover:border-red-500/60 transition-all"
              >
                <span className="text-base font-extrabold text-siet-primary dark:text-red-400 font-display block">
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

      {/* ─── Footer: Institutional Information ─── */}
      <footer className="mt-auto bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="space-y-2">
              <div className="bg-white rounded-lg p-1 w-fit">
                <img
                  src={sietFullLogo}
                  alt="SIET Logo"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium max-w-md">
                Srinivasa Institute of Engineering &amp; Technology (Autonomous)
                Approved by AICTE, New Delhi &amp; Permanently Affiliated to JNTUK, Kakinada.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-siet-primary text-white font-bold text-xs shadow-sm hover:shadow transition-all"
              >
                Access Portal
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
              >
                Register Account
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-400 dark:text-zinc-500 text-[11px]">
            <p>
              Campus: NH-216, Cheyyeru, Amalapuram, Konaseema Dist., AP - 533216
            </p>
            <p className="font-mono">
              © {new Date().getFullYear()} SIET Leave Tracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
