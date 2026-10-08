import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  GraduationCap,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { sietEmblem } from "@/components/branding/SIETLogo";
import { AuthDynamicSidePanel } from "@/components/auth/AuthDynamicSidePanel";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const signupSchema = z
  .object({
    role: z.enum(["student", "hod"]),
    email: z
      .string()
      .email("Valid email required")
      .endsWith("@sriniet.edu.in", "Must use official @sriniet.edu.in email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
    name: z.string().min(2, "Full name is required"),
    phone: z
      .string()
      .min(10, "Valid 10-digit phone required")
      .max(10, "Maximum 10 digits")
      .regex(/^[0-9]+$/, "Digits only"),
    department: z.enum(["CSE", "ECE", "EEE", "ME", "CE", "S&H"]),

    // Student specific
    rollNumber: z.string().optional(),
    year: z.string().optional(),
    semester: z.string().optional(),
    section: z.string().optional(),

    // HOD specific
    employeeId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }

    if (data.role === "student") {
      if (!data.rollNumber || data.rollNumber.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Roll number is required (e.g. 21B91A0501)",
          path: ["rollNumber"],
        });
      }
      if (!data.year) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select academic year",
          path: ["year"],
        });
      }
      if (!data.semester) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select semester",
          path: ["semester"],
        });
      }
      if (!data.section) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select section",
          path: ["section"],
        });
      }
    } else if (data.role === "hod") {
      if (!data.employeeId || data.employeeId.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Employee ID is required for HODs",
          path: ["employeeId"],
        });
      }
    }
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: "student",
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      phone: "",
      department: "CSE",
      rollNumber: "",
      year: "1",
      semester: "1",
      section: "A",
      employeeId: "",
    },
  });

  const selectedRole = form.watch("role");

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const uid = userCredential.user.uid;

      const userData: any = {
        uid,
        email: values.email,
        name: values.name,
        role: values.role,
        department: values.department,
        phone: values.phone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (values.role === "student") {
        userData.rollNumber = values.rollNumber?.toUpperCase().trim();
        userData.year = values.year ? Number(values.year) : 1;
        userData.semester = values.semester ? Number(values.semester) : 1;
        userData.section = values.section?.toUpperCase().trim() || "A";
      } else {
        userData.employeeId = values.employeeId?.toUpperCase().trim();
      }

      await setDoc(doc(db, "users", uid), userData);

      toast.success("Account created successfully!", {
        description: `Welcome to SIET Leave Tracker, ${values.name}`,
      });

      navigate(`/${values.role}/dashboard`);
    } catch (err: any) {
      console.error("Signup error:", err);
      let friendlyMsg = "Failed to create account. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        friendlyMsg = "This college email is already registered. Please sign in.";
      } else if (err.code === "auth/weak-password") {
        friendlyMsg = "Password is too weak. Please use at least 6 characters.";
      } else if (err.code === "auth/network-request-failed") {
        friendlyMsg = "Network error. Please check your internet connection.";
      }
      setError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors">
      {/* Dynamic Institutional Left Branding Panel */}
      <AuthDynamicSidePanel pageType="signup" />

      {/* Right Form Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto relative">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 shadow-xl border border-zinc-200/80 dark:border-zinc-800 my-auto transition-colors">
          {/* Mobile Header with Emblem */}
          <div className="lg:hidden flex items-center gap-3 mb-6 pb-4 border-b border-border dark:border-zinc-800">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 p-1 border border-border dark:border-zinc-700 shadow-sm flex items-center justify-center flex-shrink-0">
              <img
                src={sietEmblem}
                alt="SIET Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="font-bold text-lg text-siet-primary dark:text-red-400 font-display">SIET Portal</h2>
              <p className="text-[11px] text-muted-foreground dark:text-zinc-400">Srinivasa Institute • Cheyyeru</p>
            </div>
          </div>

          <div className="space-y-1 mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-display">
              Register Academic Account
            </h1>
            <p className="text-xs text-muted-foreground dark:text-zinc-400">
              Sign up using your official institutional email (
              <span className="font-mono text-siet-primary dark:text-red-400 font-semibold">@sriniet.edu.in</span>
              ).
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Role & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                        Account Role
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 text-xs bg-muted/20 border-border">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="hod">Head of Department (HOD)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                        Department
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 text-xs bg-muted/20 border-border">
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CSE">CSE - Computer Science</SelectItem>
                          <SelectItem value="ECE">ECE - Electronics &amp; Comm.</SelectItem>
                          <SelectItem value="EEE">EEE - Electrical &amp; Electronics</SelectItem>
                          <SelectItem value="ME">ME - Mechanical Engg.</SelectItem>
                          <SelectItem value="CE">CE - Civil Engineering</SelectItem>
                          <SelectItem value="S&H">S&amp;H - Basic Sciences</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Ramesh Kumar"
                          className="h-10 text-xs bg-muted/20 border-border"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="10-digit mobile"
                          maxLength={10}
                          className="h-10 text-xs bg-muted/20 border-border"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Student Specific Fields */}
              {selectedRole === "student" && (
                <div className="p-3.5 bg-muted/30 border border-border/80 rounded-2xl space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-siet-primary flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Student Academic Information
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="rollNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold text-muted-foreground uppercase">
                            Roll Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. 21B91A0501"
                              className="h-9 text-xs bg-white border-border uppercase"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[11px]" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-muted-foreground uppercase">
                              Year
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-9 text-xs bg-white border-border">
                                  <SelectValue placeholder="Yr" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1st</SelectItem>
                                <SelectItem value="2">2nd</SelectItem>
                                <SelectItem value="3">3rd</SelectItem>
                                <SelectItem value="4">4th</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[11px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="semester"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-muted-foreground uppercase">
                              Sem
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-9 text-xs bg-white border-border">
                                  <SelectValue placeholder="Sem" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1st</SelectItem>
                                <SelectItem value="2">2nd</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[11px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="section"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[11px] font-bold text-muted-foreground uppercase">
                              Sec
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-9 text-xs bg-white border-border">
                                  <SelectValue placeholder="Sec" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="A">A</SelectItem>
                                <SelectItem value="B">B</SelectItem>
                                <SelectItem value="C">C</SelectItem>
                                <SelectItem value="D">D</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[11px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* HOD Specific Field */}
              {selectedRole === "hod" && (
                <div className="p-3.5 bg-muted/30 border border-border/80 rounded-2xl">
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                          Faculty Employee ID
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. FAC-CSE-001"
                            className="h-10 text-xs bg-white border-border uppercase"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                      College Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="yourname@sriniet.edu.in"
                        className="h-10 text-xs bg-muted/20 border-border"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                        Password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-10 text-xs bg-muted/20 border-border pr-9"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="h-10 text-xs bg-muted/20 border-border"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                style={{
                  background: "linear-gradient(135deg, #8B1A1A 0%, #6B1414 100%)",
                }}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Registering Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Create Official Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-4 border-t border-border/80 text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-siet-primary font-bold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
