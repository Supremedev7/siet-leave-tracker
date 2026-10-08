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
  User,
  Mail,
  Phone,
  Building2,
  Lock,
  ShieldCheck,
  Save,
  CheckCircle2,
} from "lucide-react";
import { sietEmblem, sietFullLogo } from "@/components/branding/SIETLogo";

export default function StudentProfile() {
  const { userData, user, refreshUserData } = useAuth();
  const [phone, setPhone] = useState(userData?.phone || "");
  const [section, setSection] = useState(userData?.section || "");
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
        section,
        updatedAt: new Date(),
      });
      await refreshUserData();
      toast.success("Profile details updated successfully");
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
      toast.error("New password must be at least 6 characters");
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
        toast.error("Please log out and re-login to update your password");
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
            <User className="h-3.5 w-3.5" />
            Account Management
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
            Student Profile
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            View your institutional credentials and manage your account contact preferences.
          </p>
        </div>

        {/* SIET Student Identity Badge / Card with Both Logos */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#8B1A1A] via-[#6B1414] to-[#450A0A] text-white p-6 sm:p-8 shadow-xl border border-white/10">
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

          {/* Student Credentials and Seal */}
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
                    {userData?.name || "Student"}
                  </h3>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full bg-siet-gold text-zinc-900">
                    Student
                  </span>
                </div>
                <p className="text-xs text-white/80 font-mono mt-0.5">
                  Roll No: {userData?.rollNumber || "N/A"}
                </p>
                <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-siet-gold" />
                  Dept of {userData?.department} • Year {userData?.year || 1} • Section {userData?.section || "A"}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1 bg-black/25 p-3 rounded-2xl border border-white/10">
              <p className="text-[10px] text-white/60 uppercase font-semibold">Institutional Status</p>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Active Student
              </div>
              <p className="text-[10px] text-white/60 font-mono">Cheyyeru Campus</p>
            </div>
          </div>
        </div>

        {/* Profile Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Details Card */}
          <Card className="border-border dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Phone className="h-4 w-4 text-siet-primary dark:text-red-400" />
                Contact Information
              </CardTitle>
              <CardDescription className="text-xs">
                Update your mobile number and section assignment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateContact} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase">Email Address (Read-only)</Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 dark:bg-zinc-800/60 border border-border dark:border-zinc-700 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{userData?.email}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Phone Number</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className="h-10 text-xs bg-muted/20 dark:bg-zinc-800/80 border-border dark:border-zinc-700 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Class Section</Label>
                  <Input
                    value={section}
                    onChange={(e) => setSection(e.target.value.toUpperCase())}
                    placeholder="e.g. A, B, C, D"
                    maxLength={2}
                    className="h-10 text-xs bg-muted/20 dark:bg-zinc-800/80 border-border dark:border-zinc-700 text-foreground"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full text-xs font-bold bg-siet-primary hover:bg-siet-primary-dark text-white rounded-xl"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {isUpdating ? "Saving..." : "Save Contact Info"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security & Password Card */}
          <Card className="border-border dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-siet-primary dark:text-red-400" />
                Security &amp; Password
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your credentials or send a password reset link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 text-xs bg-muted/20 dark:bg-zinc-800/80 border-border dark:border-zinc-700 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 text-xs bg-muted/20 dark:bg-zinc-800/80 border-border dark:border-zinc-700 text-foreground"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isChangingPassword || !newPassword}
                  className="w-full text-xs font-bold bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-white rounded-xl transition-colors"
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </Button>

                <div className="pt-2 text-center border-t border-border/60 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    className="text-xs text-siet-primary dark:text-red-400 hover:underline font-semibold"
                  >
                    Send password reset link to college email
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
