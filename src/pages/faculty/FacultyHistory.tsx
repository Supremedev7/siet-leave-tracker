import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { LeaveRequest } from "@/types/leave";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function FacultyHistory() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    if (!userData?.department) return;

    const q = query(
      collection(db, "leaveRequests"),
      where("department", "==", userData.department)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      })) as LeaveRequest[];

      const filtered = data.filter(
        (l) => l.year === userData.assignedYear && l.section === userData.assignedSection
      );

      setLeaves(filtered);
    });

    return () => unsubscribe();
  }, [userData]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Class Review Archive</h1>
          <p className="text-sm text-muted-foreground">
            Complete history of leave applications processed for Year {userData?.assignedYear} Section {userData?.assignedSection}
          </p>
        </div>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Final Authority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-bold">{l.studentName}</TableCell>
                  <TableCell className="font-mono text-xs">{l.rollNumber}</TableCell>
                  <TableCell>{l.type}</TableCell>
                  <TableCell>{l.totalDays}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-zinc-100 dark:bg-zinc-800">
                      {l.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs uppercase font-mono">{l.finalAuthority}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
