import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Phone, Building } from "lucide-react";

export default function AdminProfile() {
  const { userData } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black">Principal / Administrative Profile</h1>
          <p className="text-sm text-muted-foreground">Executive administration credentials and permissions</p>
        </div>

        <Card className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-siet-primary" />
              {userData?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>Jurisdiction: <strong>Campus-Wide (All Departments)</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span>Role: <strong>Principal / Central Administrator</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>Email: <strong>{userData?.email}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>Emergency Office Contact: <strong>{userData?.phone || "N/A"}</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
