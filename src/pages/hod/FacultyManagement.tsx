import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { UserData } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Edit2 } from "lucide-react";

export default function FacultyManagement() {
  const { userData } = useAuth();
  const [facultyList, setFacultyList] = useState<UserData[]>([]);
  const [editingFaculty, setEditingFaculty] = useState<UserData | null>(null);
  const [assignedYear, setAssignedYear] = useState<number>(1);
  const [assignedSection, setAssignedSection] = useState<string>("A");

  useEffect(() => {
    if (!userData?.department) return;

    const q = query(
      collection(db, "users"),
      where("department", "==", userData.department),
      where("role", "==", "faculty")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as any),
      })) as UserData[];
      setFacultyList(data);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleSave = async () => {
    if (!editingFaculty) return;

    try {
      const userRef = doc(db, "users", editingFaculty.uid);
      await updateDoc(userRef, {
        assignedYear,
        assignedSection,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Assigned ${editingFaculty.name} to Year ${assignedYear} Sec ${assignedSection}`);
      setEditingFaculty(null);
    } catch {
      toast.error("Failed to update class assignment");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Faculty Class Advisory Allocation</h1>
          <p className="text-sm text-muted-foreground">
            Assign {userData?.department} faculty members as Class Advisors for specific Years and Sections
          </p>
        </div>

        {facultyList.length === 0 ? (
          <Card className="p-8 text-center bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="font-bold">No registered faculty found in {userData?.department}</p>
            <p className="text-xs text-muted-foreground mt-1">Faculty must register with role "Faculty (Class Advisor)".</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facultyList.map((f) => (
              <Card key={f.uid} className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base">{f.name}</h3>
                    <p className="text-xs text-muted-foreground">{f.email}</p>
                    <p className="text-xs font-mono text-zinc-500">ID: {f.employeeId || "N/A"}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingFaculty(f);
                      setAssignedYear(f.assignedYear || 1);
                      setAssignedSection(f.assignedSection || "A");
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-xs space-y-1">
                  <p className="font-bold text-foreground">Current Assignment:</p>
                  <p className="text-muted-foreground">
                    Year {f.assignedYear || "Not Set"} — Section {f.assignedSection || "Not Set"}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal for Edit */}
        {editingFaculty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
              <h3 className="font-bold text-lg">Assign Class Advisor</h3>
              <p className="text-xs text-muted-foreground">{editingFaculty.name}</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground">Academic Year</label>
                  <Select value={String(assignedYear)} onValueChange={(v) => setAssignedYear(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground">Section</label>
                  <Select value={assignedSection} onValueChange={setAssignedSection}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Section A</SelectItem>
                      <SelectItem value="B">Section B</SelectItem>
                      <SelectItem value="C">Section C</SelectItem>
                      <SelectItem value="D">Section D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setEditingFaculty(null)}>Cancel</Button>
                <Button size="sm" onClick={handleSave} className="bg-siet-primary hover:bg-siet-primary-dark text-white font-bold">
                  Save Assignment
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
