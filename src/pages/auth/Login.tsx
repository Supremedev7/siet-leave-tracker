import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { recordSessionLogin } from "@/lib/session";
import SIETLoadingScreen from "@/components/ui/LoadingScreen";
import { sietEmblem } from "@/components/branding/SIETLogo";
import { AuthDynamicSidePanel } from "@/components/auth/AuthDynamicSidePanel";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { validateStudentRegistration } from "@/lib/validation/academicAuth";

type LoginPortalType = "student" | "staff";

const loginFormSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

// Human-readable Firebase error messages
const firebaseErrorMap: Record<string, string> = {
  "auth/wrong-password": "Incorrect password. Please verify your credentials and try again.",
  "auth/invalid-credential": "Invalid credentials provided. Please verify and try again.",
  "auth/user-not-found": "No registered account found with these credentials.",
  "auth/invalid-email": "Please enter a valid official institutional address.",
  "auth/too-many-requests": "Too many failed attempts. Access temporarily restricted. Try again later.",
  "auth/network-request-failed": "Network connection error. Please check your network and retry.",
  "auth/user-disabled": "This institutional account has been deactivated. Contact the Admin.",
};

function getErrorMessage(code: string): string {
  return firebaseErrorMap[code] ?? "Authentication failed. Please verify your credentials.";
}

export default function Login() {
  const [activePortal, setActivePortal] = useState<LoginPortalType>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { userData, loading } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { identifier: "", password: "" },
  });

  // Redirect if already logged in and active
  React.useEffect(() => {
    if (!loading && userData) {
      if (
        (userData.role === "faculty" || userData.role === "hod") &&
        userData.approvalStatus &&
        userData.approvalStatus !== "approved"
      ) {
        // Pending or rejected staff shouldn't auto-redirect
        return;
      }
      navigate(`/${userData.role}/dashboard`, { replace: true });
    }
  }, [userData, loading, navigate]);

  if (loading) return <SIETLoadingScreen />;

  const handlePortalSwitch = (portal: LoginPortalType) => {
    setActivePortal(portal);
    setError("");
    form.reset({ identifier: "", password: "" });
  };

  const onSubmit = async (values: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      let targetEmail = "";
      const rawIdentifier = values.identifier.trim();

      if (activePortal === "student") {
        // Student Login Validation: Strictly [RollNumber]@sriniet.edu.in
        const studentVal = validateStudentRegistration(rawIdentifier);
        if (!studentVal.isValid) {
          setError(studentVal.error || "Invalid student email format.");
          toast.error("Invalid student email");
          setIsLoading(false);
          return;
        }
        targetEmail = rawIdentifier.toLowerCase();
      } else {
        // Staff Login: Using Employee ID (e.g., F26AIML0S001) or Administrator Email
        if (rawIdentifier.includes("@")) {
          // Support admin / faculty direct college email sign in
          if (!rawIdentifier.toLowerCase().endsWith("@sriniet.edu.in")) {
            setError("Staff and administrators must sign in using @sriniet.edu.in institutional email or Employee ID.");
            toast.error("Invalid domain");
            setIsLoading(false);
            return;
          }
          targetEmail = rawIdentifier.toLowerCase();
        } else {
          // Resolve Employee ID from staffLookups index
          const cleanEmployeeId = rawIdentifier.toUpperCase();
          const lookupRef = doc(db, "staffLookups", cleanEmployeeId);
          const lookupSnap = await getDoc(lookupRef);

          if (!lookupSnap.exists()) {
            setError(
              `Employee ID "${cleanEmployeeId}" was not found. Please verify your ID or complete registration.`
            );
            toast.error("Employee ID not found");
            setIsLoading(false);
            return;
          }

          const lookupData = lookupSnap.data();
          targetEmail = lookupData.email;
        }
      }

      // Configure persistence
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      // Authenticate with Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, targetEmail, values.password);

      if (cred.user) {
        // Retrieve User profile from Firestore to enforce Approval Gate
        const userDocRef = doc(db, "users", cred.user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const profile = userDocSnap.data();

          // Gatekeeper for Faculty & HOD accounts
          if (profile.role === "faculty" || profile.role === "hod") {
            const approvalStatus = profile.approvalStatus || "approved"; // fallback for legacy accounts

            if (approvalStatus === "pending") {
              await signOut(auth);
              const pendingMsg = `Account Pending Clearance: Your staff account (${profile.employeeId || rawIdentifier}) is awaiting approval from the Central Administrator. You will be able to log in once your account is accepted.`;
              setError(pendingMsg);
              toast.error("Account pending administrator approval", {
                description: "Contact the administrative office for expedited clearance.",
              });
              setIsLoading(false);
              return;
            }

            if (approvalStatus === "rejected") {
              await signOut(auth);
              const rejectedMsg = `Account Declined: Your staff registration (${profile.employeeId || rawIdentifier}) was declined by the Administrator. Please contact the administrative cell.`;
              setError(rejectedMsg);
              toast.error("Registration was rejected");
              setIsLoading(false);
              return;
            }
          }

          // Approved or student/admin account
          await recordSessionLogin(cred.user.uid, targetEmail, rememberMe);
          toast.success("Authentication successful. Redirecting to portal...");
          navigate(`/${profile.role}/dashboard`, { replace: true });
        } else {
          // User document not created yet
          await recordSessionLogin(cred.user.uid, targetEmail, rememberMe);
          toast.success("Authentication successful.");
        }
      }
    } catch (err: any) {
      console.error("Login authentication failure:", err);
      const code = err.code ?? "";
      const msg = getErrorMessage(code);
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50/50 dark:bg-zinc-950 transition-colors font-sans">
      {/* ═══ DYNAMIC LEFT PANEL — SIET Institutional Branding ═══ */}
      <AuthDynamicSidePanel pageType="login" />

      {/* ═══ RIGHT PANEL — Authentication Console ═══ */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-y-auto">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none p-6 sm:p-10 my-auto transition-colors">
          {/* Header with Emblem */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700 shadow-md mb-3">
              <img
                src={sietEmblem}
                alt="SIET Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 font-display tracking-tight">
              Academic Portal Sign In
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-xs">
              Srinivasa Institute of Engineering &amp; Technology
            </p>
          </div>

          {/* Institutional Portal Switcher (Student vs Faculty/Staff) */}
          <div className="grid grid-cols-2 p-1.5 mb-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">
            <button
              type="button"
              onClick={() => handlePortalSwitch("student")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activePortal === "student"
                  ? "bg-white dark:bg-zinc-900 text-siet-primary dark:text-red-400 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Student Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handlePortalSwitch("staff")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activePortal === "staff"
                  ? "bg-white dark:bg-zinc-900 text-siet-primary dark:text-red-400 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Faculty &amp; Staff Desk</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Dynamic Identifier Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  {activePortal === "student" ? "College Email Address" : "Staff Employee ID or Email"}
                </label>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {activePortal === "student" ? "JNTUK Format" : "Assigned ID"}
                </span>
              </div>
              <div className="relative">
                {activePortal === "student" ? (
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                ) : (
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
                <input
                  type={activePortal === "student" ? "email" : "text"}
                  placeholder={
                    activePortal === "student"
                      ? "256N5A0511@sriniet.edu.in"
                      : "e.g. F26AIML0S001 or H26CSE0S001"
                  }
                  autoComplete={activePortal === "student" ? "email" : "username"}
                  {...form.register("identifier")}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-foreground dark:text-zinc-100 text-xs font-medium placeholder:text-muted-foreground/60 dark:placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-siet-primary/20 focus:border-siet-primary ${
                    activePortal === "staff" ? "uppercase font-mono" : ""
                  }`}
                />
              </div>
              {form.formState.errors.identifier && (
                <p className="mt-1.5 text-xs text-destructive font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 inline" />
                  {form.formState.errors.identifier.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...form.register("password")}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-foreground dark:text-zinc-100 text-xs font-medium placeholder:text-muted-foreground/60 dark:placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-siet-primary/20 focus:border-siet-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="mt-1.5 text-xs text-destructive font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 inline" />
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Session Persistence Checkbox */}
            <div className="flex items-center justify-between text-xs py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-siet-primary focus:ring-siet-primary/20 accent-siet-primary cursor-pointer"
                />
                <span>Remember this device</span>
              </label>

              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                TLS Encrypted
              </span>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-200 leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-white text-xs transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              style={{
                background: isLoading ? "#A52A2A" : "linear-gradient(135deg, #8B1A1A, #6B1414)",
              }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials…</span>
                </>
              ) : (
                <>
                  <span>
                    {activePortal === "student" ? "Sign In to Student Portal" : "Sign In to Staff Desk"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <p className="mt-6 text-center text-xs text-muted-foreground dark:text-zinc-400">
            Don't have an institutional account?{" "}
            <Link to="/signup" className="font-bold text-siet-primary dark:text-red-400 hover:underline transition-colors">
              Register here
            </Link>
          </p>

          {/* Instructions note */}
          <div className="mt-6 p-3.5 rounded-xl border border-border dark:border-zinc-800 bg-muted/30 dark:bg-zinc-850/60 text-[11px] text-muted-foreground dark:text-zinc-400 text-center leading-relaxed">
            {activePortal === "student" ? (
              <span>
                Students must use their official JNTUK roll email (<strong className="text-zinc-800 dark:text-zinc-200">[RollNo]@sriniet.edu.in</strong>). Personal domains (Gmail, Yahoo) are prohibited.
              </span>
            ) : (
              <span>
                Faculty and HODs must enter their auto-generated <strong className="text-zinc-800 dark:text-zinc-200">Employee ID</strong> (e.g. F26AIML0S001) or approved staff email.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
