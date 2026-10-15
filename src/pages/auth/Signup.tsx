import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { recordSessionLogin } from "@/lib/session";
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
  ShieldCheck,
  Copy,
  Check,
  Clock,
  Building2,
  Briefcase,
  Shield,
} from "lucide-react";
import { sietEmblem } from "@/components/branding/SIETLogo";
import { AuthDynamicSidePanel } from "@/components/auth/AuthDynamicSidePanel";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { validateStudentRegistration } from "@/lib/validation/academicAuth";
import { generateEmployeeId, createStaffLookup } from "@/lib/idGenerator";

const signupSchema = z
  .object({
    role: z.enum(["student", "faculty", "hod", "admin"]),
    email: z
      .string()
      .email("Valid email required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
    name: z.string().min(2, "Full name is required"),
    phone: z
      .string()
      .min(10, "Valid 10-digit phone required")
      .max(10, "Maximum 10 digits")
      .regex(/^[0-9]+$/, "Digits only"),
    department: z.string().default("CSE"),

    // Student specific
    rollNumber: z.string().optional(),
    year: z.string().optional(),
    semester: z.string().optional(),
    section: z.string().optional(),

    // Faculty & HOD specific
    employeeId: z.string().optional(),
    degrees: z.string().optional(),
    staffPasscode: z.string().optional(),

    // Admin specific
    adminPasscode: z.string().optional(),
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
      const studentVal = validateStudentRegistration(data.email, data.rollNumber);
      if (!studentVal.isValid && studentVal.error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: studentVal.error,
          path: [studentVal.error.toLowerCase().includes("roll number") && !studentVal.error.toLowerCase().includes("email") ? "rollNumber" : "email"],
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
    } else if (data.role === "admin") {
      const cleanAdminKey = data.adminPasscode?.trim();
      const validAdminKeys = ["SIET@ADMIN", "SIET@ADMIN2026", "SIET2026", "admin123"];
      if (!cleanAdminKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Institutional Admin Passcode is required to register as Administrator",
          path: ["adminPasscode"],
        });
      } else if (!validAdminKeys.includes(cleanAdminKey) && cleanAdminKey !== import.meta.env.VITE_ADMIN_PASSCODE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid Admin Passcode (Enter SIET@ADMIN)",
          path: ["adminPasscode"],
        });
      }
    } else {
      // Faculty & HOD: Personal or official institutional email is permitted for security & recovery
      if (data.role === "faculty") {
        if (!data.year) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Select assigned class year",
            path: ["year"],
          });
        }
        if (!data.section) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Select assigned class section",
            path: ["section"],
          });
        }
      }
    }
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredStaff, setRegisteredStaff] = useState<{
    employeeId: string;
    name: string;
    role: string;
    department: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);
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
      degrees: "",
      staffPasscode: "",
      adminPasscode: "",
    },
  });

  const selectedRole = form.watch("role");
  const watchedEmail = form.watch("email");
  const watchedRollNumber = form.watch("rollNumber");

  useEffect(() => {
    if (selectedRole === "admin") {
      if (form.getValues("department") === "CSE") {
        form.setValue("department", "ADMIN");
      }
    } else if (form.getValues("department") === "ADMIN") {
      form.setValue("department", "CSE");
    }
  }, [selectedRole, form]);

  // Keep roll number and email synced for student role
  useEffect(() => {
    if (selectedRole === "student" && watchedEmail) {
      const trimmed = watchedEmail.trim();
      if (trimmed.includes("@")) {
        const prefix = trimmed.split("@")[0].toUpperCase();
        if (prefix.length <= 10 && prefix !== form.getValues("rollNumber")) {
          form.setValue("rollNumber", prefix, { shouldValidate: false });
        }
      }
    }
  }, [watchedEmail, selectedRole, form]);

  useEffect(() => {
    if (selectedRole === "student" && watchedRollNumber) {
      const cleanRoll = watchedRollNumber.trim().toUpperCase();
      const currentEmail = form.getValues("email") || "";
      const expectedEmail = `${cleanRoll.toLowerCase()}@sriniet.edu.in`;
      if (cleanRoll.length >= 2 && currentEmail !== expectedEmail) {
        form.setValue("email", expectedEmail, { shouldValidate: false });
      }
    }
  }, [watchedRollNumber, selectedRole, form]);

  const handleCopyId = () => {
    if (!registeredStaff?.employeeId) return;
    navigator.clipboard.writeText(registeredStaff.employeeId);
    setCopiedId(true);
    toast.success("Employee ID copied to clipboard!");
    setTimeout(() => setCopiedId(false), 2500);
  };

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email.trim().toLowerCase(),
        values.password
      );
      const uid = userCredential.user.uid;

      const userData: any = {
        uid,
        email: values.email.trim().toLowerCase(),
        name: values.name.trim(),
        role: values.role,
        department: values.department,
        phone: values.phone.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (values.role === "student") {
        const rollUpper = values.rollNumber?.toUpperCase().trim() || values.email.split("@")[0].toUpperCase().trim();
        userData.rollNumber = rollUpper;
        userData.year = values.year ? Number(values.year) : 1;
        userData.semester = values.semester ? Number(values.semester) : 1;
        userData.section = values.section?.toUpperCase().trim() || "A";
        userData.approvalStatus = "approved";

        await setDoc(doc(db, "users", uid), userData);
        await recordSessionLogin(uid, values.email, true);

        toast.success("Account created successfully!", {
          description: `Welcome to SIET Leave Tracker, ${values.name}`,
        });

        navigate(`/${values.role}/dashboard`);
      } else if (values.role === "admin") {
        // Administrator Account Instant Provisioning
        userData.role = "admin";
        userData.approvalStatus = "approved";
        userData.department = values.department || "ADMIN";
        userData.adminLevel = "principal";
        userData.designation = "Central Administrator / Principal";

        await setDoc(doc(db, "users", uid), userData);
        await recordSessionLogin(uid, values.email, true);

        toast.success("Administrator Account Activated!", {
          description: `Welcome to SIET Admin Console, ${values.name}`,
        });

        navigate("/admin/dashboard");
      } else {
        // Faculty & HOD: Auto-generate unique Employee ID and verify clearance
        const generatedEmployeeId = await generateEmployeeId(values.role, values.department);
        const isFastTrack =
          values.staffPasscode?.trim() === "SIET@STAFF" ||
          values.staffPasscode?.trim() === "SIET2026" ||
          values.staffPasscode?.trim() === "staff123";

        const approvalStatus = isFastTrack ? "approved" : "pending";

        userData.employeeId = generatedEmployeeId;
        userData.approvalStatus = approvalStatus;
        userData.degrees = values.degrees?.trim() || "";

        if (values.role === "faculty") {
          userData.assignedYear = values.year ? Number(values.year) : 1;
          userData.assignedSection = values.section?.toUpperCase().trim() || "A";
          userData.designation = "Class Advisor";
        } else {
          userData.designation = "Head of Department";
        }

        // Save User Profile Document
        await setDoc(doc(db, "users", uid), userData);

        // Index in staffLookups for ID-based login resolution
        await createStaffLookup({
          employeeId: generatedEmployeeId,
          email: values.email.trim().toLowerCase(),
          role: values.role,
          department: values.department,
          name: values.name.trim(),
          uid,
          approvalStatus,
        });

        if (isFastTrack) {
          // Fast-track instant access
          await recordSessionLogin(uid, values.email, true);
          toast.success("Staff Account Verified & Activated!", {
            description: `Employee ID: ${generatedEmployeeId}. Welcome, ${values.name}`,
          });
          navigate(`/${values.role}/dashboard`);
        } else {
          // Standard institutional workflow: awaits central admin approval
          await signOut(auth);

          // Display confirmation modal with generated Employee ID
          setRegisteredStaff({
            employeeId: generatedEmployeeId,
            name: values.name.trim(),
            role: values.role === "hod" ? "Head of Department" : "Faculty Advisor",
            department: values.department,
          });

          toast.success("Staff Registration Submitted!", {
            description: `Allocated Employee ID: ${generatedEmployeeId}`,
          });
        }
      }
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
    <div className="min-h-[100dvh] flex bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors">
      {/* Dynamic Institutional Left Branding Panel */}
      <AuthDynamicSidePanel pageType="signup" />

      {/* Right Form Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto relative">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 border border-zinc-200/90 dark:border-zinc-800 my-auto transition-colors" data-ui="true">
          {/* Mobile Header with Emblem */}
          <div className="lg:hidden flex items-center gap-3 mb-6 pb-4">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 p-1 border border-border dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
              <img
                src={sietEmblem}
                alt="SIET Emblem"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="font-bold text-lg text-siet-primary dark:text-red-400 font-display">SIET Portal</h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Srinivasa Institute • Cheyyeru</p>
            </div>
          </div>

          <div className="space-y-1 mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-display">
              Register Academic Account
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {selectedRole === "student" && (
                <>
                  Students must register using official college email (
                  <span className="text-siet-primary dark:text-red-400 font-semibold">@sriniet.edu.in</span>
                  ).
                </>
              )}
              {selectedRole === "faculty" && "Register as Class Advisor. Enter official or personal email for recovery alerts."}
              {selectedRole === "hod" && "Register as Head of Department. Enter official or personal email for recovery alerts."}
              {selectedRole === "admin" && "Register as Executive Administrator / Principal with institutional key."}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* ═══ ROLE SELECTOR TABS ═══ */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Select Institutional Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                  <button
                    type="button"
                    onClick={() => form.setValue("role", "student")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                      selectedRole === "student"
                        ? "bg-white dark:bg-zinc-900 text-siet-primary dark:text-red-400 font-bold border border-zinc-200/80 dark:border-zinc-700"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => form.setValue("role", "faculty")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                      selectedRole === "faculty"
                        ? "bg-white dark:bg-zinc-900 text-siet-primary dark:text-red-400 font-bold border border-zinc-200/80 dark:border-zinc-700"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Briefcase className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Faculty</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => form.setValue("role", "hod")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                      selectedRole === "hod"
                        ? "bg-white dark:bg-zinc-900 text-siet-primary dark:text-red-400 font-bold border border-zinc-200/80 dark:border-zinc-700"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>HOD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => form.setValue("role", "admin")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                      selectedRole === "admin"
                        ? "bg-white dark:bg-zinc-900 text-siet-primary dark:text-red-400 font-bold border border-zinc-200/80 dark:border-zinc-700"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              {/* Department */}
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                      {selectedRole === "admin" ? "Administrative Jurisdiction" : "Department"}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || (selectedRole === "admin" ? "ADMIN" : "CSE")}>
                      <FormControl>
                        <SelectTrigger className="h-10 text-xs bg-muted/20 border-border">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedRole === "admin" && (
                          <SelectItem value="ADMIN">ADMIN - Central Administration / Principal</SelectItem>
                        )}
                        <SelectItem value="CSE">CSE - Computer Science</SelectItem>
                        <SelectItem value="AIML">AIML - Artificial Intelligence &amp; ML</SelectItem>
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
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-850/60 rounded-2xl space-y-3">
                  <p className="text-xs font-semibold text-siet-primary dark:text-red-400 flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Student Academic Information</span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="rollNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Roll Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. 256N5A0511"
                              maxLength={10}
                              spellCheck={false}
                              className="h-9 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 uppercase tabular-nums"
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
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-border dark:border-zinc-700">
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
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-border dark:border-zinc-700">
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
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-border dark:border-zinc-700">
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

              {/* Faculty Specific Fields */}
              {selectedRole === "faculty" && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-850/60 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-siet-primary dark:text-red-400 flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Class Advisory Assignment</span>
                    </p>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-siet-primary/10 dark:bg-red-500/15 text-siet-primary dark:text-red-400 font-semibold">
                      Auto-Assigned ID
                    </span>
                  </div>

                  {/* Auto-Generation Informational Banner */}
                  <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 rounded-xl flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
                    <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                      <span className="font-bold block text-amber-950 dark:text-amber-100">
                        Automatic Employee ID Generation
                      </span>
                      Your official Faculty Employee ID (e.g. <span className="tabular-nums font-bold">F26{form.watch("department") || "AIML"}0S001</span>) will be automatically generated upon submission. You will use this ID to sign in.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold text-muted-foreground uppercase">
                            Assigned Year
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-border dark:border-zinc-700">
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1st Year</SelectItem>
                              <SelectItem value="2">2nd Year</SelectItem>
                              <SelectItem value="3">3rd Year</SelectItem>
                              <SelectItem value="4">4th Year</SelectItem>
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
                            Assigned Section
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-border dark:border-zinc-700">
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
                  <FormField
                    control={form.control}
                    name="degrees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold text-muted-foreground uppercase">
                          Degrees / Qualifications
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. M.Tech, Ph.D, B.Tech"
                            className="h-9 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-border dark:border-zinc-700"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="staffPasscode"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-[11px] font-bold text-muted-foreground uppercase">
                            Instant Activation Key (Optional)
                          </FormLabel>
                          <span className="text-[10px] text-zinc-400">
                            Key: <code className="font-mono text-siet-primary dark:text-red-400 font-bold">SIET@STAFF</code>
                          </span>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="Enter SIET@STAFF for instant clearance, or leave blank"
                            className="h-9 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-border dark:border-zinc-700"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* HOD Specific Field */}
              {selectedRole === "hod" && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-850/60 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-siet-primary dark:text-red-400 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Department Executive Appointment</span>
                    </p>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-siet-primary/10 dark:bg-red-500/15 text-siet-primary dark:text-red-400 font-semibold">
                      Auto-Assigned ID
                    </span>
                  </div>

                  {/* Auto-Generation Informational Banner */}
                  <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 rounded-xl flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
                    <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                      <span className="font-bold block text-amber-950 dark:text-amber-100">
                        Automatic HOD Employee ID Generation
                      </span>
                      Your official HOD Employee ID (e.g. <span className="tabular-nums font-bold">H26{form.watch("department") || "AIML"}0S001</span>) will be automatically generated upon submission. You will use this ID to sign in.
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="degrees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                          Degrees / Academic Credentials
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. M.Tech, Ph.D, FIE"
                            className="h-10 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-border dark:border-zinc-700"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="staffPasscode"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                            Instant Activation Key (Optional)
                          </FormLabel>
                          <span className="text-[10px] text-zinc-400">
                            Key: <code className="font-mono text-siet-primary dark:text-red-400 font-bold">SIET@STAFF</code>
                          </span>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="Enter SIET@STAFF for instant clearance, or leave blank"
                            className="h-10 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-border dark:border-zinc-700"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Administrator Specific Passcode Card */}
              {selectedRole === "admin" && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-850/60 rounded-2xl space-y-3.5 border border-zinc-200/80 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-siet-primary dark:text-red-400 flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Executive Administrator Clearance</span>
                    </p>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-siet-primary/10 dark:bg-red-500/15 text-siet-primary dark:text-red-400 font-semibold">
                      Instant Access
                    </span>
                  </div>

                  <div className="p-3 bg-red-500/10 dark:bg-red-500/15 rounded-xl flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-siet-primary dark:text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                    <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                      <span className="font-bold block text-zinc-900 dark:text-zinc-100">
                        Institutional Admin Key Required
                      </span>
                      Enter the institutional administrative key (<code className="text-siet-primary dark:text-red-400 font-semibold font-mono">SIET@ADMIN</code>) to instantly provision and activate your Principal / Dean console.
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="adminPasscode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                          Institutional Admin Passcode
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter SIET@ADMIN"
                            className="h-10 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-border dark:border-zinc-700"
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
                      {selectedRole === "student" ? "College Email Address" : "Email Address (Security & Recovery)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={
                          selectedRole === "student"
                            ? "256N5A0511@sriniet.edu.in"
                            : "personal@gmail.com or official@sriniet.edu.in"
                        }
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
                className="w-full h-11 text-xs font-semibold text-white rounded-xl bg-siet-primary hover:bg-siet-primary-dark transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siet-primary focus-visible:ring-offset-2"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
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
                    <span>Registering account…</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Create Official Account</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </div>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-4 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Already have an account?{" "}
              <Link to="/login" className="text-siet-primary font-semibold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ═══ INSTITUTIONAL STAFF REGISTRATION ALLOCATION MODAL ═══ */}
      {registeredStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 animate-in fade-in duration-200"
          data-ui="true"
        >
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6 text-zinc-900 dark:text-zinc-100 relative">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 mb-1">
                <ShieldCheck className="w-8 h-8" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold font-display text-zinc-900 dark:text-white">
                Staff Registration Received
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Institutional credentials allocated for {registeredStaff.name} ({registeredStaff.role})
              </p>
            </div>

            {/* Generated Employee ID Presentation Box */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/90 dark:border-zinc-700/80 text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-400 block">
                Your Official Employee ID
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl sm:text-3xl font-bold tracking-widest tabular-nums text-siet-primary dark:text-red-400 select-all">
                  {registeredStaff.employeeId}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyId}
                  className="h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-lg border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  {copiedId ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Department: <strong className="text-zinc-800 dark:text-zinc-200">{registeredStaff.department}</strong>
              </p>
            </div>

            {/* Notice of Pending Admin Clearance */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="block text-amber-950 dark:text-amber-100 font-bold mb-0.5">
                  Mandatory Administrative Approval Required
                </strong>
                Your account is currently in <strong>Pending</strong> status. The Central Administrator must verify and approve your registration before you can log in. Use this <strong>Employee ID</strong> and your password once approved.
              </div>
            </div>

            {/* Primary Action Button */}
            <Button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full h-11 text-xs font-semibold text-white rounded-xl bg-siet-primary hover:bg-siet-primary-dark transition-colors duration-150"
            >
              <span>Proceed to Institutional Login</span>
              <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
