import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { sendPasswordResetEmail, updatePassword } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  Building2,
  Lock,
  ShieldCheck,
  Save,
  GraduationCap,
  Award,
} from "lucide-react";
import { sietEmblem, sietFullLogo } from "@/components/branding/SIETLogo";

export default function FacultyProfile() {
  const { userData, user, refreshUserData } = useAuth();
  const [phone, setPhone] = useState(userData?.phone || "");
  const [isUpdating, setIsUpdating] = useState(false);

  // Password reset state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;

    if (phone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsUpdating(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        phone,
        updatedAt: new Date(),
      });
      await refreshUserData();
      toast.success("Faculty contact details updated successfully");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile", { description: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(user, newPassword);
      toast.success("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Error updating password:", err);
      if (err.code === "auth/requires-recent-login") {
        toast.error("Please re-login to update your password");
      } else {
        toast.error("Failed to update password", { description: err.message });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success("Password reset email sent!", {
        description: `Check your inbox at ${user.email}`,
      });
    } catch (err: any) {
      toast.error("Failed to send reset email", { description: err.message });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-siet-primary/10 text-siet-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Award className="h-3.5 w-3.5" />
            Faculty Advisor Credentials
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
            Faculty Profile
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your faculty institutional profile, contact numbers, and security credentials.
          </p>
        </div>

        {/* SIET Faculty Identity Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#8B1A1A] via-[#6B1414] to-[#3B0707] text-white p-6 sm:p-8 shadow-xl border border-white/10">
          {/* Top Institutional Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/15">
            <div className="bg-white/95 rounded-xl px-3 py-1.5 shadow-md flex items-center">
              <img
                src={sietFullLogo}
                alt="SIET Full Logo"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-siet-gold block">
                Autonomous • Affiliated to JNTUK
              </span>
              <span className="text-[11px] text-white/70 font-mono">
                Academic Year 2025–26
              </span>
            </div>
          </div>

          {/* Faculty Credentials and Official Seal */}
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-lg border-2 border-siet-gold/40 flex items-center justify-center flex-shrink-0">
                <img
                  src={sietEmblem}
                  alt="Official SIET Seal Emblem"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-bold font-display">
                    {userData?.name || "Faculty Member"}
                  </h3>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full bg-siet-gold text-zinc-900">
                    Faculty
                  </span>
                </div>
                <p className="text-xs text-white/80 font-mono mt-0.5">
                  Employee ID: {userData?.employeeId || "FAC-01"}
                </p>
                <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-siet-gold" />
                  Department of {userData?.department} Engineering
                </p>
                {/* Degrees Chips */}
                {userData?.degrees && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {userData.degrees.split(",").map((deg, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/20"
                      >
                        {deg.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1 bg-black/25 p-3 rounded-2xl border border-white/10">
              <p className="text-[10px] text-white/60 uppercase font-semibold">Assigned Class</p>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <GraduationCap className="h-3.5 w-3.5" />
                Year {userData?.assignedYear || 1} • Section {userData?.assignedSection || "A"}
              </div>
              <p className="text-[10px] text-white/50 font-mono mt-1">Class Advisor</p>
            </div>
          </div>
        </div>

        {/* Institutional Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Institutional Info Card */}
          <Card className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-500/5 dark:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-siet-primary dark:text-red-400" />
                Institutional Assignment
              </CardTitle>
              <CardDescription className="text-xs">
                Official academic allocation verified by Head of the Department
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 dark:bg-zinc-800/40 border border-border/40">
                <span className="text-muted-foreground font-medium">Department</span>
                <span className="font-bold text-foreground">{userData?.department}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 dark:bg-zinc-800/40 border border-border/40">
                <span className="text-muted-foreground font-medium">Assigned Class</span>
                <span className="font-bold text-foreground">
                  Year {userData?.assignedYear || 1} — Section {userData?.assignedSection || "A"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 dark:bg-zinc-800/40 border border-border/40">
                <span className="text-muted-foreground font-medium">Designation</span>
                <span className="font-bold text-foreground">{userData?.designation || "Class Advisor"}</span>
              </div>
              {userData?.degrees && (
                <div className="p-3 rounded-xl bg-muted/20 dark:bg-zinc-800/40 border border-border/40 space-y-1.5">
                  <span className="text-muted-foreground font-medium block">Qualifications / Degrees</span>
                  <div className="flex flex-wrap gap-1.5">
                    {userData.degrees.split(",").map((deg, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-siet-primary/10 text-siet-primary dark:bg-red-500/10 dark:text-red-400 border border-siet-primary/20 dark:border-red-500/20"
                      >
                        {deg.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Details Card */}
          <Card className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-500/5 dark:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Phone className="h-4 w-4 text-siet-primary dark:text-red-400" />
                Contact Information
              </CardTitle>
              <CardDescription className="text-xs">
                Official contact details for departmental communication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateContact} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Institutional Email
                  </Label>
                  <Input
                    type="email"
                    value={userData?.email || ""}
                    disabled
                    className="h-10 text-xs bg-muted/30 border-border opacity-75 font-mono cursor-not-allowed"
                  />
                  <p className="text-[10px] text-muted-foreground">College email cannot be changed</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    Mobile Number
                  </Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className="h-10 text-xs bg-muted/20 dark:bg-zinc-800/60 border-border"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full h-10 text-xs font-bold text-white rounded-xl shadow-sm"
                  style={{ background: "linear-gradient(135deg, #8B1A1A 0%, #6B1414 100%)" }}
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {isUpdating ? "Saving Changes..." : "Save Contact Info"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Security & Password Card */}
        <Card className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-500/5 dark:shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Lock className="h-4 w-4 text-siet-primary dark:text-red-400" />
              Security & Credentials
            </CardTitle>
            <CardDescription className="text-xs">
              Manage your password and security credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="h-10 text-xs bg-muted/20 dark:bg-zinc-800/60 border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="h-10 text-xs bg-muted/20 dark:bg-zinc-800/60 border-border"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={isChangingPassword || !newPassword}
                  className="w-full sm:w-auto h-10 text-xs font-bold text-white rounded-xl shadow-sm px-6"
                  style={{ background: "linear-gradient(135deg, #8B1A1A 0%, #6B1414 100%)" }}
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendResetEmail}
                  className="w-full sm:w-auto h-10 text-xs font-bold border-zinc-200 dark:border-zinc-700 rounded-xl"
                >
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  Send Password Reset Link
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
