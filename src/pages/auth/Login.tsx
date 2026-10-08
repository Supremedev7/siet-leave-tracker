import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import SIETLoadingScreen from "@/components/ui/LoadingScreen";
import { sietEmblem } from "@/components/branding/SIETLogo";
import { AuthDynamicSidePanel } from "@/components/auth/AuthDynamicSidePanel";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const loginSchema = z.object({
  email: z
    .string()
    .email("Enter a valid email address")
    .endsWith("@sriniet.edu.in", "Must use your @sriniet.edu.in college email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

// Human-readable Firebase error messages
const firebaseErrorMap: Record<string, string> = {
  "auth/wrong-password":         "Incorrect password. Please try again.",
  "auth/invalid-credential":     "Incorrect email or password.",
  "auth/user-not-found":         "No account found with this email.",
  "auth/invalid-email":          "Please enter a valid email address.",
  "auth/too-many-requests":      "Too many failed attempts. Please wait and try again.",
  "auth/network-request-failed": "Network error. Check your internet connection.",
  "auth/user-disabled":          "This account has been disabled. Contact admin.",
};

function getErrorMessage(code: string): string {
  return firebaseErrorMap[code] ?? "Login failed. Please check your credentials.";
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { userData, loading } = useAuth();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Redirect if already logged in
  React.useEffect(() => {
    if (!loading && userData) {
      navigate(`/${userData.role}/dashboard`, { replace: true });
    }
  }, [userData, loading, navigate]);

  if (loading) return <SIETLoadingScreen />;

  const onSubmit = async (values: LoginForm) => {
    setIsLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast.success("Authentication successful. Redirecting to portal...");
    } catch (err: any) {
      const code = err.code ?? "";
      const msg = getErrorMessage(code);
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50/50 dark:bg-zinc-950 transition-colors">
      {/* ═══ DYNAMIC LEFT PANEL — SIET Institutional Branding ═══ */}
      <AuthDynamicSidePanel pageType="login" />

      {/* ═══ RIGHT PANEL — Authentication Console ═══ */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none p-8 sm:p-10 transition-colors">
          {/* Header with Circular Emblem and Full Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700 shadow-md mb-4">
              <img
                src={sietEmblem}
                alt="SIET Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 font-display tracking-tight">
              Academic Portal Sign In
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-xs">
              Enter your official college email credentials to proceed
            </p>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                College Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="rollno@sriniet.edu.in"
                  autoComplete="email"
                  {...form.register("email")}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-foreground dark:text-zinc-100 text-sm font-medium placeholder:text-muted-foreground/60 dark:placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              {form.formState.errors.email && (
                <p className="mt-1.5 text-xs text-destructive font-medium">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...form.register("password")}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-foreground dark:text-zinc-100 text-sm font-medium placeholder:text-muted-foreground/60 dark:placeholder:text-zinc-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                <p className="mt-1.5 text-xs text-destructive font-medium">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 animate-slide-down">
                <p className="text-destructive text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-white text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: isLoading ? '#A52A2A' : 'linear-gradient(135deg, #8B1A1A, #6B1414)',
                boxShadow: isLoading ? 'none' : '0 4px 16px rgba(139,26,26,0.35)',
              }}
              onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-muted-foreground dark:text-zinc-400">
            Don't have an account?{" "}
            <Link to="/signup" className="font-bold text-siet-primary dark:text-red-400 hover:underline transition-colors">
              Register here
            </Link>
          </p>

          {/* Domain notice */}
          <div className="mt-8 p-4 rounded-xl border border-border dark:border-zinc-800 bg-muted/40 dark:bg-zinc-850/60">
            <p className="text-xs text-muted-foreground dark:text-zinc-400 text-center leading-relaxed flex items-center justify-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
              <span>
                Only <strong className="text-foreground dark:text-zinc-200">@sriniet.edu.in</strong> email addresses are permitted. Contact your college admin if you need assistance.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
