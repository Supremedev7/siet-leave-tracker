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
        // Staff Login: Using Employee ID (e.g., F26AIML0S001) or Registered Staff Email
        if (rawIdentifier.includes("@")) {
          // Allow direct authentication using registered personal or institutional email
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
    <div className="min-h-[100dvh] flex bg-zinc-50 dark:bg-zinc-950 transition-colors font-sans">
      {/* ═══ DYNAMIC LEFT PANEL — SIET Institutional Branding ═══ */}
      <AuthDynamicSidePanel pageType="login" />

      {/* ═══ RIGHT PANEL — Authentication Console ═══ */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-y-auto">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 p-6 sm:p-10 my-auto transition-colors">
          {/* Header with Emblem */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700 mb-3">
              <img
                src={sietEmblem}
                alt="SIET Emblem"
                width={56}
                height={56}
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display tracking-tight">
              Academic Portal Sign In
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-xs">
              Srinivasa Institute of Engineering &amp; Technology
            </p>
          </div>

          {/* Institutional Portal Switcher (Student vs Faculty/Staff) */}
          <div className="grid grid-cols-2 p-1 mb-6 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80">
            <button
              type="button"
              onClick={() => handlePortalSwitch("student")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                activePortal === "student"
                  ? "bg-white dark:bg-zinc-900 text-siet-primary dark:text-red-400 font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              <span>Student Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handlePortalSwitch("staff")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${
                activePortal === "staff"
                  ? "bg-white dark:bg-zinc-900 text-siet-primary dark:text-red-400 font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Briefcase className="h-4 w-4" aria-hidden="true" />
              <span>Faculty &amp; Staff Desk</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Dynamic Identifier Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-identifier"
                  className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  {activePortal === "student" ? "College email address" : "Staff employee ID or email"}
                </label>
                <span className="text-[11px] font-normal text-zinc-400">
                  {activePortal === "student" ? "JNTUK roll format" : "Assigned staff code"}
                </span>
              </div>
              <div className="relative">
                {activePortal === "student" ? (
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" aria-hidden="true" />
                ) : (
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" aria-hidden="true" />
                )}
                <input
                  id="login-identifier"
                  type={activePortal === "student" ? "email" : "text"}
                  placeholder={
                    activePortal === "student"
                      ? "256N5A0511@sriniet.edu.in"
                      : "Employee ID (e.g. F26AIML0S001) or Email"
                  }
                  autoComplete={activePortal === "student" ? "email" : "username"}
                  spellCheck={false}
                  {...form.register("identifier")}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium placeholder:text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siet-primary ${
                    activePortal === "staff" && !form.watch("identifier")?.includes("@") ? "uppercase tabular-nums tracking-wide" : ""
                  }`}
                />
              </div>
              {form.formState.errors.identifier && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1" aria-live="polite">
                  <AlertCircle className="h-3 w-3 inline shrink-0" aria-hidden="true" />
                  <span>{form.formState.errors.identifier.message}</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...form.register("password")}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium placeholder:text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siet-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1" aria-live="polite">
                  <AlertCircle className="h-3 w-3 inline shrink-0" aria-hidden="true" />
                  <span>{form.formState.errors.password.message}</span>
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
                  className="w-4 h-4 rounded text-siet-primary focus:ring-siet-primary accent-siet-primary cursor-pointer"
                />
                <span>Remember this session</span>
              </label>

              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                TLS Verified
              </span>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-200 leading-relaxed flex items-start gap-2.5"
                aria-live="assertive"
              >
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-white text-xs bg-siet-primary hover:bg-siet-primary-dark transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siet-primary focus-visible:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin text-white shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Verifying credentials…</span>
                </>
              ) : (
                <>
                  <span>
                    {activePortal === "student" ? "Sign In to Student Portal" : "Sign In to Staff Desk"}
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Don't have an institutional account?{" "}
            <Link to="/signup" className="font-semibold text-siet-primary dark:text-red-400 hover:underline transition-colors">
              Register here
            </Link>
          </p>

          {/* Instructions note */}
          <div className="mt-6 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 text-[11px] text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
            {activePortal === "student" ? (
              <span>
                Students must use their official JNTUK roll email (<strong className="text-zinc-800 dark:text-zinc-200">[RollNo]@sriniet.edu.in</strong>). Personal domains (Gmail, Yahoo) are prohibited.
              </span>
            ) : (
              <span>
                Faculty and HODs sign in with their assigned <strong className="text-zinc-800 dark:text-zinc-200">Employee ID</strong> (e.g. F26AIML0S001) or registered personal/official email.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
