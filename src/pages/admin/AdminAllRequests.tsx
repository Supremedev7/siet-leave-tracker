import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { LeaveRequest } from "@/types/leave";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants/academic";
import { format } from "date-fns";

const formatDate = (val: any): string => {
  if (!val) return "—";
  try {
    if (typeof val.toDate === "function") return format(val.toDate(), "dd/MM/yyyy");
    const d = new Date(val);
    if (!isNaN(d.getTime())) return format(d, "dd/MM/yyyy");
  } catch {
    // fallback
  }
  return "—";
};

export default function AdminAllRequests() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [selectedDept, setSelectedDept] = useState("ALL");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "leaveRequests"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as LeaveRequest[];
      setLeaves(data);
    });

    return () => unsubscribe();
  }, []);

  const filteredLeaves = selectedDept === "ALL" ? leaves : leaves.filter((l) => l.department === selectedDept);

  const exportCSV = () => {
    const headers = "Student,RollNumber,Dept,Year,Section,Type,TotalDays,StartDate,EndDate,Status,FinalAuthority\n";
    const rows = filteredLeaves
      .map((l) => `"${l.studentName}","${l.rollNumber}","${l.department}","${l.year}","${l.section}","${l.type}","${l.totalDays}","${formatDate(l.startDate)}","${formatDate(l.endDate)}","${l.status}","${l.finalAuthority}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `siet-leaves-${selectedDept}.csv`;
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black">College-wide Leave Master Archive</h1>
            <p className="text-sm text-muted-foreground">Comprehensive search across all academic branches</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d.code} value={d.code}>{d.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={exportCSV} className="gap-2 font-bold bg-siet-primary hover:bg-siet-primary-dark text-white">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Dept</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Dates (DD/MM/YYYY)</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Authority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No leave requests found for this filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeaves.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-bold">{l.studentName}</TableCell>
                    <TableCell className="font-mono text-xs">{l.rollNumber}</TableCell>
                    <TableCell>{l.department}</TableCell>
                    <TableCell>Y{l.year}-{l.section}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                      {formatDate(l.startDate)} → {formatDate(l.endDate)}
                    </TableCell>
                    <TableCell>{l.totalDays}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-zinc-100 dark:bg-zinc-800">
                        {l.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono uppercase">{l.finalAuthority}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
