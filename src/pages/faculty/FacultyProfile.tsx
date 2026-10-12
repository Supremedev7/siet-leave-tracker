import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, Building, GraduationCap, Shield } from "lucide-react";

export default function FacultyProfile() {
  const { userData } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black">Faculty Advisor Profile</h1>
          <p className="text-sm text-muted-foreground">Class advisory credentials and institutional assignments</p>
        </div>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-siet-primary" />
              {userData?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>Department: <strong>{userData?.department}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span>
                Assigned Class: <strong>Year {userData?.assignedYear || 1} — Section {userData?.assignedSection || "A"}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span>Employee ID: <strong>{userData?.employeeId || "N/A"}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>Email: <strong>{userData?.email}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>Phone: <strong>{userData?.phone || "N/A"}</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
