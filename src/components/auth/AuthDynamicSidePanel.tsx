import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sietFullLogo } from "@/components/branding/SIETLogo";
import {
  CalendarDays,
  ShieldCheck,
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

  // Auto-cycle through highlights every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHighlight((prev) => (prev + 1) % HIGHLIGHTS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const current = HIGHLIGHTS[activeHighlight];
  const Icon = current.icon;

  return (
    <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 flex-col justify-between p-10 xl:p-12 text-white relative select-none bg-[#6B1414]">
      {/* ── Top Header: Brand Lockup & Accreditation ── */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-3 inline-block">
          <img
            src={sietFullLogo}
            alt="Srinivasa Institute of Engineering & Technology"
            width={180}
            height={44}
            className="h-11 w-auto object-contain"
          />
        </div>

        <div className="text-white/80 text-xs font-semibold">
          Autonomous • NAAC 'A' Grade • Affiliated to JNTUK
        </div>
      </div>

      {/* ── Middle: Main Presentation ── */}
      <div className="my-auto py-8 space-y-6">
        <div>
          <h2 className="text-3xl xl:text-4xl font-bold text-white tracking-tight font-display leading-tight">
            {pageType === "login"
              ? "Institutional Attendance & Leave Clearance"
              : "Register for Official SIET Portal"}
          </h2>
          <p className="text-white/80 text-sm leading-relaxed mt-3 max-w-md">
            Paperless clearance, monthly 2-day safe quota compliance, and
            HOD academic approvals for Srinivasa Institute of Engineering &amp; Technology.
          </p>
        </div>

        {/* ── Active Highlight Block ── */}
        <div className="rounded-2xl bg-white/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-siet-gold text-zinc-950">
              {current.tag}
            </span>

            <div className="flex items-center gap-1.5">
              {HIGHLIGHTS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveHighlight(idx)}
                  className={`h-1.5 rounded-full transition-colors ${
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-siet-gold/20 text-siet-gold">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-base text-white font-display">
                  {current.title}
                </h3>
              </div>
              <p className="text-xs text-white/85 leading-relaxed pl-10">
                {current.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Key Metrics ── */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-black/20 text-center">
            <span className="text-xs text-white/70 font-semibold block">
              Monthly Cap
            </span>
            <span className="text-xl font-bold text-white tabular-nums mt-0.5 block">
              2 Days
            </span>
            <span className="text-[10px] text-siet-gold font-medium">Safe Limit</span>
          </div>

          <div className="p-3 rounded-xl bg-black/20 text-center">
            <span className="text-xs text-white/70 font-semibold block">
              JNTUK Target
            </span>
            <span className="text-xl font-bold text-emerald-300 tabular-nums mt-0.5 block">
              ≥ 75%
            </span>
            <span className="text-[10px] text-emerald-300/80 font-medium">Mandatory</span>
          </div>

          <div className="p-3 rounded-xl bg-black/20 text-center">
            <span className="text-xs text-white/70 font-semibold block">
              Clearance
            </span>
            <span className="text-xl font-bold text-white mt-0.5 block">
              Direct
            </span>
            <span className="text-[10px] text-white/70 font-medium">HOD Desk</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Institutional Note ── */}
      <div className="pt-4 flex items-center justify-between text-xs text-white/70">
        <div>
          <span className="font-semibold text-white">
            Srinivasa Institute of Engineering &amp; Technology
          </span>
          <p className="text-[11px] text-white/60">
            NH-216, Cheyyeru, Amalapuram, AP — 533216
          </p>
        </div>
        <div className="text-right text-[11px] text-white/60 tabular-nums">
          AY 2025–26
        </div>
      </div>
    </div>
  );
};

export default AuthDynamicSidePanel;
