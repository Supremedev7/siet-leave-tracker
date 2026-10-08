import React from "react";
import { format } from "date-fns";
import { Printer, X, CheckCircle, ShieldCheck } from "lucide-react";
import { sietEmblem, sietFullLogo } from "@/components/branding/SIETLogo";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface LeaveCertificateProps {
  leave: {
    id: string;
    studentName: string;
    rollNumber: string;
    department: string;
    year: number | string;
    section: string;
    type: string;
    startDate: any;
    endDate: any;
    reason: string;
    status: string;
    createdAt?: any;
    updatedAt?: any;
    hodRemarks?: string;
  };
  onClose: () => void;
}

const safeFormatDate = (dateVal: any, pattern = "dd MMMM yyyy"): string => {
  if (!dateVal) return "N/A";
  try {
    if (typeof dateVal.toDate === "function") {
      return format(dateVal.toDate(), pattern);
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return format(d, pattern);
    }
  } catch {
    // fallback
  }
  return "N/A";
};

export const LeaveCertificate: React.FC<LeaveCertificateProps> = ({
  leave,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-200"
      >
        {/* Modal Top Actions - Hidden in Print */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-50 border-b border-zinc-200 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-siet-primary" />
            <h3 className="font-bold text-zinc-900 text-sm">
              Official Student Leave Pass &amp; Clearance
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-siet-primary hover:bg-siet-primary-dark text-white flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Print Pass
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Printable Pass Body */}
        <div id="printable-gate-pass" className="p-8 space-y-6 text-zinc-900 bg-white">
          {/* Institution Header */}
          <div className="text-center border-b-2 border-siet-primary pb-5 space-y-2">
            <div className="flex justify-center mb-2">
              <img
                src={sietFullLogo}
                alt="SIET Official Banner"
                className="h-14 sm:h-16 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-zinc-600 font-medium">
              Approved by AICTE, New Delhi &amp; Affiliated to JNTUK, Kakinada • Autonomous
            </p>
            <p className="text-[11px] text-zinc-500">
              NH-216, Cheyyeru, Amalapuram, Konaseema Dist., Andhra Pradesh - 533216
            </p>
            <div className="inline-block mt-1 px-4 py-1 bg-siet-primary/10 text-siet-primary text-xs font-bold tracking-wider rounded uppercase">
              Official Student Gate Pass / Leave Authorization
            </div>
          </div>

          {/* Pass Meta */}
          <div className="flex justify-between items-center text-xs text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            <div>
              <span className="font-bold text-zinc-800">Pass ID: </span>
              <span className="font-mono">{leave.id.slice(0, 10).toUpperCase()}</span>
            </div>
            <div>
              <span className="font-bold text-zinc-800">Date Issued: </span>
              <span>{format(new Date(), "dd-MM-yyyy HH:mm")}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-700 font-bold">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>OFFICIALLY APPROVED</span>
            </div>
          </div>

          {/* Student & Leave Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-zinc-50/50 rounded-xl border border-zinc-100 space-y-1.5">
              <p className="text-xs font-medium text-zinc-500 uppercase">Student Information</p>
              <p className="font-bold text-zinc-900">{leave.studentName}</p>
              <p className="text-xs text-zinc-700">
                <span className="font-semibold">Roll No:</span> {leave.rollNumber}
              </p>
              <p className="text-xs text-zinc-700">
                <span className="font-semibold">Dept:</span> {leave.department} ({leave.year} Year - Sec {leave.section})
              </p>
            </div>

            <div className="p-3 bg-zinc-50/50 rounded-xl border border-zinc-100 space-y-1.5">
              <p className="text-xs font-medium text-zinc-500 uppercase">Leave Particulars</p>
              <p className="font-bold text-siet-primary">{leave.type} Leave</p>
              <p className="text-xs text-zinc-700">
                <span className="font-semibold">From:</span> {safeFormatDate(leave.startDate)}
              </p>
              <p className="text-xs text-zinc-700">
                <span className="font-semibold">To:</span> {safeFormatDate(leave.endDate)}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50/30">
            <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">Purpose / Reason</p>
            <p className="text-xs text-zinc-800 italic leading-relaxed">
              "{leave.reason}"
            </p>
            {leave.hodRemarks && (
              <p className="text-xs text-siet-primary font-medium mt-2">
                HOD Note: {leave.hodRemarks}
              </p>
            )}
          </div>

          {/* Signatures & Security Stamp with SIET Emblem */}
          <div className="pt-6 border-t border-dashed border-zinc-300 grid grid-cols-3 gap-4 items-end text-center">
            <div className="space-y-1">
              <div className="h-10"></div>
              <div className="border-t border-zinc-400 pt-1 text-[11px] font-semibold text-zinc-700">
                Student Signature
              </div>
            </div>

            <div className="space-y-1 text-center">
              <div className="inline-flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-emerald-600 bg-emerald-50 text-emerald-800 rotate-[-4deg] shadow-sm">
                <img src={sietEmblem} alt="SIET Seal" className="w-9 h-9 object-contain" />
                <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">VERIFIED &amp; APPROVED</span>
              </div>
              <p className="text-[10px] text-zinc-500">Security / Warden Stamp</p>
            </div>

            <div className="space-y-1">
              <div className="h-10 flex items-center justify-center font-serif italic text-xs text-siet-primary font-bold">
                Digitally Authorized
              </div>
              <div className="border-t border-zinc-400 pt-1 text-[11px] font-semibold text-zinc-700">
                Head of Department ({leave.department})
              </div>
            </div>
          </div>

          {/* Instructions note */}
          <p className="text-[10px] text-zinc-400 text-center italic">
            * This document is generated through the SIET Official Portal. Present this gate pass at the main campus security outpost when exiting or re-entering college premises.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LeaveCertificate;
