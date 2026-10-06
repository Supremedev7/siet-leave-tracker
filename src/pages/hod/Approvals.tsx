import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Approvals() {
  const { userData } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, [userData]);

  const fetchLeaves = async () => {
    if (!userData) return;
    
    setLoading(true);
    try {
      const q = query(
        collection(db, "leaveRequests"),
        where("department", "==", userData.department),
        where("status", "==", "pending"),
        orderBy("createdAt", "asc")
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaves(data);
    } catch (error) {
      console.error("Error fetching leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const leaveRef = doc(db, "leaveRequests", id);
      await updateDoc(leaveRef, {
        status,
        updatedAt: new Date(),
        updatedBy: userData?.uid
      });
      // Remove from list
      setLeaves(leaves.filter(leave => leave.id !== id));
    } catch (error) {
      console.error(`Error updating status to ${status}:`, error);
      alert("Failed to update status");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pending Approvals</h2>
          <p className="text-muted-foreground">
            Review and manage leave requests from students.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : leaves.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending leave requests.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell className="font-medium">
                          {leave.studentName}
                          <div className="text-xs text-muted-foreground">{leave.rollNumber}</div>
                        </TableCell>
                        <TableCell>
                          {leave.year} Year / {leave.section}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{leave.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(leave.startDate.toDate(), "MMM dd, yyyy")} - <br/>
                            {format(leave.endDate.toDate(), "MMM dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={leave.reason}>
                          {leave.reason}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                              onClick={() => handleUpdateStatus(leave.id, "approved")}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                              onClick={() => handleUpdateStatus(leave.id, "rejected")}
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
