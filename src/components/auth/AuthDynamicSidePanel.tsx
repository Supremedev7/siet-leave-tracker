import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sietFullLogo } from "@/components/branding/SIETLogo";
import {
  CalendarDays,
  ShieldCheck,
  Sparkles,
  Award,
} from "lucide-react";

interface AuthDynamicSidePanelProps {
  pageType: "login" | "signup";
}

const HIGHLIGHTS = [
  {
    icon: CalendarDays,
    title: "Monthly 2-Day Safe Leave Cap",
    tag: "Academic Rule",
    description:
      "Students are permitted a maximum of 2 leaves per month without penalty. Leaves beyond 2 days impact examination attendance.",
  },
  {
    icon: ShieldCheck,
    title: "JNTUK 75% Attendance Guard",
    tag: "Autonomous Norm",
    description:
      "Automated attendance denominator calculation against HOD configured working days to ensure semester exam eligibility.",
  },
  {
    icon: Award,
    title: "Instant Digital Gate Passes",
    tag: "Digital Clearance",
    description:
      "One-click HOD approvals with verified QR code gate passes for secure, authorized campus egress.",
  },
];

export const AuthDynamicSidePanel: React.FC<AuthDynamicSidePanelProps> = ({
  pageType,
}) => {
  const [activeHighlight, setActiveHighlight] = useState(0);

  // Auto-cycle through highlights every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHighlight((prev) => (prev + 1) % HIGHLIGHTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = HIGHLIGHTS[activeHighlight];
  const Icon = current.icon;

  return (
    <div
      className="hidden lg:flex lg:w-1/2 xl:w-5/12 flex-col justify-between p-10 xl:p-12 text-white relative overflow-hidden select-none"
      style={{
        background:
          "linear-gradient(155deg, #8B1A1A 0%, #5A1010 45%, #2D0707 100%)",
      }}
    >
      {/* ── Dynamic Ambient Geometry & Glow Orbs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.28, 0.15],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(247,148,29,0.3) 0%, transparent 70%)",
          }}
        />

        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.25, 0.1],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(139,26,26,0.5) 0%, transparent 70%)",
          }}
        />

        {/* Subtle geometric ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-white/5 pointer-events-none" />
      </div>

      {/* ── Top Header: Brand Lockup & Accreditation ── */}
      <div className="relative z-10 space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-white/20 inline-block"
        >
          <img
            src={sietFullLogo}
            alt="Srinivasa Institute of Engineering & Technology"
            className="h-12 w-auto object-contain"
          />
        </motion.div>

        <div className="flex items-center gap-2 text-white/75 text-xs font-mono tracking-wider uppercase">
          <span className="font-semibold text-white">Autonomous</span>
          <span>•</span>
          <span>NAAC 'A' Grade</span>
          <span>•</span>
          <span>Affiliated to JNTUK</span>
        </div>
      </div>

      {/* ── Middle: Main Dynamic Presentation ── */}
      <div className="relative z-10 my-auto py-6 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-siet-gold/20 border border-siet-gold/30 text-siet-gold text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Official ERP • Academic Governance</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight font-display leading-tight">
            {pageType === "login"
              ? "Institutional Attendance & Leave Clearance"
              : "Register for Official SIET Portal"}
          </h2>
          <p className="text-white/75 text-xs xl:text-sm leading-relaxed mt-2 max-w-md">
            Unified digital pass issuance, monthly leave quota compliance, and
            HOD academic clearance for Srinivasa Institute of Engineering &amp; Technology.
          </p>
        </div>

        {/* ── Dynamic Floating Interactive Highlight Card ── */}
        <motion.div
          className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 shadow-2xl relative overflow-hidden"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-siet-gold text-zinc-950 font-mono">
              {current.tag}
            </span>
            <div className="flex items-center gap-1.5">
              {HIGHLIGHTS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveHighlight(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === activeHighlight
                      ? "w-6 bg-siet-gold"
                      : "w-1.5 bg-white/30 hover:bg-white/60"
                  }`}
                  aria-label={`Highlight ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeHighlight}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-1.5"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-siet-gold/20 text-siet-gold">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-base text-white font-display">
                  {current.title}
                </h4>
              </div>
              <p className="text-xs text-white/80 leading-relaxed pl-10">
                {current.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ── Key Metrics Pills ── */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-black/20 border border-white/10 text-center">
            <span className="text-[10px] text-white/60 font-bold uppercase block">
              Monthly Cap
            </span>
            <span className="text-xl font-extrabold text-white font-mono mt-0.5 block">
              2 Days
            </span>
            <span className="text-[9px] text-siet-gold font-medium">Safe Limit</span>
          </div>

          <div className="p-3 rounded-xl bg-black/20 border border-white/10 text-center">
            <span className="text-[10px] text-white/60 font-bold uppercase block">
              JNTUK Target
            </span>
            <span className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5 block">
              ≥ 75%
            </span>
            <span className="text-[9px] text-emerald-400/80 font-medium">Mandatory</span>
          </div>

          <div className="p-3 rounded-xl bg-black/20 border border-white/10 text-center">
            <span className="text-[10px] text-white/60 font-bold uppercase block">
              Pass Approval
            </span>
            <span className="text-xl font-extrabold text-white font-mono mt-0.5 block">
              Direct
            </span>
            <span className="text-[9px] text-white/60 font-medium">HOD Desk</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Footer: Institutional Details ── */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
        <div>
          <span className="font-semibold text-white/90">
            Srinivasa Institute of Engineering &amp; Technology
          </span>
          <p className="text-[11px] text-white/50">
            NH-216, Cheyyeru, Amalapuram, East Godavari - 533216
          </p>
        </div>
        <div className="text-right font-mono text-[11px] text-white/50">
          AY 2025–26
        </div>
      </div>
    </div>
  );
};

export default AuthDynamicSidePanel;
