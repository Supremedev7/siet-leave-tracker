import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { LeaveRequest } from "@/types/leave";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ShieldAlert, Users, CheckCircle2, Clock } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants/academic";

const COLORS = ["#8B1A1A", "#2563EB", "#059669", "#D97706", "#7C3AED", "#DB2777"];

export default function AdminDashboard() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

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

  const pendingAdminLeaves = leaves.filter((l) => l.status === "pending_admin");
  const approvedLeaves = leaves.filter((l) => l.status === "approved");

  // Dept distribution
  const deptData = DEPARTMENTS.map((dept) => ({
    name: dept.code,
    count: leaves.filter((l) => l.department === dept.code).length,
  }));

  return (
    <DashboardLayout pendingCount={pendingAdminLeaves.length}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Central Administration Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Srinivasa Institute of Engineering &amp; Technology — Institutional Leave Control &amp; Analytics
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                Pending Principal Clearance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-red-600 dark:text-red-400">
                {pendingAdminLeaves.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Total Approved Leaves
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {approvedLeaves.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                Total College Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {leaves.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-purple-500" />
                Departments Monitored
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {DEPARTMENTS.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 p-4">
            <h3 className="font-bold text-sm mb-4">Department-wise Leave Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B1A1A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 p-4">
            <h3 className="font-bold text-sm mb-4">Leave Types Ratio</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Medical", value: leaves.filter(l => l.type === "Medical").length },
                      { name: "Personal", value: leaves.filter(l => l.type === "Personal").length },
                      { name: "Half-Day", value: leaves.filter(l => l.type === "Half-Day").length },
                      { name: "Emergency", value: leaves.filter(l => l.type === "Emergency").length },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
