import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { LeaveRequest, ApprovalChainEntry } from "@/types/leave";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, ShieldAlert, Phone, Paperclip } from "lucide-react";
import LeaveAuditStepper from "@/components/leave/LeaveAuditStepper";
import { sendLeaveNotification } from "@/lib/notifications";

export default function AdminApprovals() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "leaveRequests"),
      where("status", "==", "pending_admin")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      })) as LeaveRequest[];
      setLeaves(data);
    });

    return () => unsubscribe();
  }, []);

  const handleAction = async (action: "approved" | "rejected") => {
    if (!selectedLeave || !userData) return;

    if (action === "rejected" && !remarks.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsProcessing(true);
    try {
      const docRef = doc(db, "leaveRequests", selectedLeave.id);

      const chainEntry: ApprovalChainEntry = {
        stage: "admin",
        action,
        approverUid: userData.uid,
        approverName: userData.name,
        approverRole: "admin",
        remarks: remarks.trim() || (action === "approved" ? "Institutional Clearance Granted" : "Rejected by Principal"),
        timestamp: new Date(),
      };

      await updateDoc(docRef, {
        status: action === "approved" ? "approved" : "rejected",
        currentApprover: "completed",
        adminRemarks: remarks.trim() || null,
        approvalChain: [...(selectedLeave.approvalChain || []), chainEntry],
        updatedAt: serverTimestamp(),
      });

      // Dispatch notification
      sendLeaveNotification({
        recipientUid: selectedLeave.studentUid,
        title: action === "approved" ? "Executive Clearance Granted" : "Leave Rejected by Principal",
        body: action === "approved"
          ? `Your extended leave (${selectedLeave.startDate} to ${selectedLeave.endDate}) was approved by Principal / Executive Admin.`
          : `Your extended leave request was rejected by Principal / Executive Admin.`,
        type: action === "approved" ? "approval" : "rejection",
        leaveId: selectedLeave.id,
        metadata: {
          actorName: userData.name,
          actorRole: "admin",
          leaveType: selectedLeave.type,
          remarks: remarks.trim(),
        },
      });

      toast.success(action === "approved" ? "Institutional clearance granted!" : "Leave application rejected.");
      setSelectedLeave(null);
      setRemarks("");
    } catch {
      toast.error("Failed to process executive action");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout pendingCount={leaves.length}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Principal / Executive Clearance Queue</h1>
          <p className="text-sm text-muted-foreground">
            Extended student leaves (6+ days) requiring institutional clearance
          </p>
        </div>

        {leaves.length === 0 ? (
          <Card className="p-8 text-center bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="font-bold">No executive leaves awaiting clearance</p>
            <p className="text-xs text-muted-foreground mt-1">All long-duration applications are cleared.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaves.map((l) => (
              <Card key={l.id} className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base">{l.studentName}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {l.rollNumber} • {l.department} Y{l.year}-{l.section}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                    {l.totalDays} Days
                  </span>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">
                  <span className="font-semibold text-foreground">Reason:</span> {l.reason}
                </p>

                <Button size="sm" variant="outline" onClick={() => setSelectedLeave(l)} className="w-full text-xs font-semibold">
                  Review Audit Trail &amp; Decide
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Action Modal */}
        {selectedLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{selectedLeave.studentName}</h3>
                  <p className="text-xs text-muted-foreground">{selectedLeave.department} • {selectedLeave.totalDays} Days ({selectedLeave.type})</p>
                </div>
                <button onClick={() => setSelectedLeave(null)} className="text-zinc-400 hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <LeaveAuditStepper leave={selectedLeave} />

              <div className="text-xs space-y-2 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800">
                <p><span className="font-bold">Stated Reason:</span> {selectedLeave.reason}</p>
                {selectedLeave.emergencyPhone && (
                  <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedLeave.emergencyPhone}</p>
                )}
                {selectedLeave.attachmentUrl && (
                  <a
                    href={selectedLeave.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-siet-primary dark:text-red-400 font-bold hover:underline"
                  >
                    <Paperclip className="h-3.5 w-3.5" /> View Medical Proof / Document
                  </a>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Executive Remarks</label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter institutional clearance or rejection remarks..."
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedLeave(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" disabled={isProcessing} onClick={() => handleAction("rejected")}>
                  <X className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" size="sm" disabled={isProcessing} onClick={() => handleAction("approved")}>
                  <Check className="h-3.5 w-3.5 mr-1" /> Grant Institutional Approval
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
