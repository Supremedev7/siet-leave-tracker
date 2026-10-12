import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { UserData, UserRole } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Edit2 } from "lucide-react";

export default function AdminManageUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as any),
      })) as UserData[];
      setUsers(data);
    });

    return () => unsubscribe();
  }, []);

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    try {
      await updateDoc(doc(db, "users", selectedUser.uid), {
        role: selectedRole,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Updated ${selectedUser.name}'s role to ${selectedRole}`);
      setSelectedUser(null);
    } catch {
      toast.error("Failed to update user role");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Institution User Role Management</h1>
          <p className="text-sm text-muted-foreground">
            Promote or manage permissions for Students, Faculty Advisors, HODs, and Administrators
          </p>
        </div>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Dept</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.uid}>
                  <TableCell className="font-bold">{u.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                  <TableCell>{u.department || "N/A"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      u.role === "admin" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" :
                      u.role === "hod" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" :
                      u.role === "faculty" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}>
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(u);
                        setSelectedRole(u.role);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
              <h3 className="font-bold text-lg">Modify User Role</h3>
              <p className="text-xs text-muted-foreground">{selectedUser.name} ({selectedUser.email})</p>

              <div>
                <label className="text-xs font-bold text-muted-foreground">Select Role</label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="faculty">Faculty (Class Advisor)</SelectItem>
                    <SelectItem value="hod">Head of Department (HOD)</SelectItem>
                    <SelectItem value="admin">Administrator (Principal/Dean)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>Cancel</Button>
                <Button size="sm" onClick={handleRoleChange} className="bg-siet-primary hover:bg-siet-primary-dark text-white font-bold">
                  Update Role
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
