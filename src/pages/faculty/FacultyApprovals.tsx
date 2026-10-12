import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { LeaveRequest, ApprovalChainEntry } from "@/types/leave";
import { canFacultyApproveDirectly } from "@/lib/escalation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Check, X, Forward, Clock, Phone } from "lucide-react";
import LeaveAuditStepper from "@/components/leave/LeaveAuditStepper";

export default function FacultyApprovals() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!userData?.department) return;

    const q = query(
      collection(db, "leaveRequests"),
      where("department", "==", userData.department),
      where("status", "==", "pending_faculty")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as LeaveRequest[];

      const filtered = data.filter(
        (l) => l.year === userData.assignedYear && l.section === userData.assignedSection
      );

      setLeaves(filtered);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleAction = async (action: "approved" | "forwarded" | "rejected") => {
    if (!selectedLeave || !userData) return;

    if (action === "rejected" && !remarks.trim()) {
      toast.error("Please provide remarks for rejection");
      return;
    }

    setIsProcessing(true);
    try {
      const docRef = doc(db, "leaveRequests", selectedLeave.id);

      const chainEntry: ApprovalChainEntry = {
        stage: "faculty",
        action,
        approverUid: userData.uid,
        approverName: userData.name,
        approverRole: "faculty",
        remarks: remarks.trim() || (action === "forwarded" ? "Recommended by Class Advisor" : "Approved by Class Advisor"),
        timestamp: new Date(),
      };

      const updatedChain = [...(selectedLeave.approvalChain || []), chainEntry];

      let nextStatus = selectedLeave.status;
      let nextApprover = selectedLeave.currentApprover;

      if (action === "approved") {
        nextStatus = "approved";
        nextApprover = "completed";
      } else if (action === "forwarded") {
        nextStatus = "pending_hod";
        nextApprover = "hod";
      } else if (action === "rejected") {
        nextStatus = "rejected";
        nextApprover = "completed";
      }

      await updateDoc(docRef, {
        status: nextStatus,
        currentApprover: nextApprover,
        facultyRemarks: remarks.trim() || null,
        approvalChain: updatedChain,
        updatedAt: serverTimestamp(),
      });

      toast.success(
        action === "approved"
          ? "Leave application approved!"
          : action === "forwarded"
          ? "Forwarded to HOD successfully!"
          : "Leave application rejected."
      );

      setSelectedLeave(null);
      setRemarks("");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to process leave request");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout pendingCount={leaves.length}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Class Advisor Approvals</h1>
          <p className="text-sm text-muted-foreground">
            Reviewing leaves for {userData?.department} Year {userData?.assignedYear} Section {userData?.assignedSection}
          </p>
        </div>

        {leaves.length === 0 ? (
          <Card className="p-8 text-center bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="font-bold">No pending leaves for your class</p>
            <p className="text-xs text-muted-foreground mt-1">All applications have been reviewed.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaves.map((l) => (
              <Card key={l.id} className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base">{l.studentName}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{l.rollNumber}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    {l.totalDays} Day{l.totalDays > 1 ? "s" : ""}
                  </span>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">
                  <span className="font-semibold text-foreground">Reason:</span> {l.reason}
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setSelectedLeave(l)} 
                    className="text-xs font-semibold flex-1"
                  >
                    View &amp; Action
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal for Action */}
        {selectedLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{selectedLeave.studentName}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{selectedLeave.rollNumber} • {selectedLeave.type}</p>
                </div>
                <button onClick={() => setSelectedLeave(null)} className="text-zinc-400 hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <LeaveAuditStepper leave={selectedLeave} />

              <div className="text-xs space-y-2 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200/50 dark:border-zinc-800">
                <p><span className="font-bold">Duration:</span> {selectedLeave.totalDays} day(s)</p>
                <p><span className="font-bold">Reason:</span> {selectedLeave.reason}</p>
                {selectedLeave.emergencyPhone && (
                  <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedLeave.emergencyPhone}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Advisor Remarks</label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks or recommendation for HOD..."
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedLeave(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  disabled={isProcessing}
                  onClick={() => handleAction("rejected")}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>
                {canFacultyApproveDirectly(selectedLeave.totalDays) ? (
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" 
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => handleAction("approved")}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Approve (1-2 Days)
                  </Button>
                ) : (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold" 
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => handleAction("forwarded")}
                  >
                    <Forward className="h-3.5 w-3.5 mr-1" /> Forward to HOD ({selectedLeave.totalDays} Days)
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
