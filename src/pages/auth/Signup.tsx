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
} from "lucide-react";
import { sietEmblem } from "@/components/branding/SIETLogo";
import { AuthDynamicSidePanel } from "@/components/auth/AuthDynamicSidePanel";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { validateStudentRegistration } from "@/lib/validation/academicAuth";
import { generateEmployeeId, createStaffLookup } from "@/lib/idGenerator";

const signupSchema = z
  .object({
    role: z.enum(["student", "faculty", "hod"]),
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
    department: z.enum(["CSE", "AIML", "ECE", "EEE", "ME", "CE", "S&H"]),

    // Student specific
    rollNumber: z.string().optional(),
    year: z.string().optional(),
    semester: z.string().optional(),
    section: z.string().optional(),

    // Faculty & HOD specific
    employeeId: z.string().optional(),
    degrees: z.string().optional(),
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
    } else {
      // Faculty & HOD strict institutional email check
      const cleanEmail = data.email.trim().toLowerCase();
      if (!cleanEmail.endsWith("@sriniet.edu.in")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Staff must register using official college email (@sriniet.edu.in)",
          path: ["email"],
        });
      }
      if (
        cleanEmail.endsWith("@gmail.com") ||
        cleanEmail.endsWith("@yahoo.com") ||
        cleanEmail.endsWith("@outlook.com")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Personal email domains are strictly prohibited for institutional accounts.",
          path: ["email"],
        });
      }

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
    },
  });

  const selectedRole = form.watch("role");
  const watchedEmail = form.watch("email");
  const watchedRollNumber = form.watch("rollNumber");

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
      } else {
        // Faculty & HOD: Auto-generate unique Employee ID and set Pending Approval
        const generatedEmployeeId = await generateEmployeeId(values.role, values.department);

        userData.employeeId = generatedEmployeeId;
        userData.approvalStatus = "pending";
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
          approvalStatus: "pending",
        });

        // Sign out immediately so pending user cannot access authenticated routes
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
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 font-medium">
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
                          <SelectItem value="faculty">Faculty (Class Advisor)</SelectItem>
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
                              placeholder="e.g. 256N5A0511"
                              maxLength={10}
                              className="h-9 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-border dark:border-zinc-700 uppercase font-mono tracking-wider"
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
                <div className="p-4 bg-muted/30 border border-border/80 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-siet-primary flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" />
                      Class Advisory Assignment
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-siet-primary/10 text-siet-primary font-semibold">
                      Auto-Assigned ID
                    </span>
                  </div>

                  {/* Auto-Generation Informational Banner */}
                  <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                      <span className="font-bold block text-amber-950 dark:text-amber-100">
                        Automatic Employee ID Generation
                      </span>
                      Your official Faculty Employee ID (e.g. <span className="font-mono font-bold">F26{form.watch("department") || "AIML"}0S001</span>) will be automatically generated upon submission. You will use this ID to sign in.
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
                </div>
              )}

              {/* HOD Specific Field */}
              {selectedRole === "hod" && (
                <div className="p-4 bg-muted/30 border border-border/80 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-siet-primary flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      Department Executive Appointment
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-siet-primary/10 text-siet-primary font-semibold">
                      Auto-Assigned ID
                    </span>
                  </div>

                  {/* Auto-Generation Informational Banner */}
                  <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                      <span className="font-bold block text-amber-950 dark:text-amber-100">
                        Automatic HOD Employee ID Generation
                      </span>
                      Your official HOD Employee ID (e.g. <span className="font-mono font-bold">H26{form.watch("department") || "AIML"}0S001</span>) will be automatically generated upon submission. You will use this ID to sign in.
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

      {/* ═══ INSTITUTIONAL STAFF REGISTRATION ALLOCATION MODAL ═══ */}
      {registeredStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 space-y-6 text-zinc-900 dark:text-zinc-100 relative">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 mb-1">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold font-display text-zinc-900 dark:text-white">
                Staff Registration Received
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Institutional credentials allocated for {registeredStaff.name} ({registeredStaff.role})
              </p>
            </div>

            {/* Generated Employee ID Presentation Box */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/90 dark:border-zinc-700/80 text-center space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-400 block">
                Your Official Employee ID
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-siet-primary dark:text-red-400 select-all">
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
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
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
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
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
              className="w-full h-11 text-xs font-bold text-white rounded-xl shadow-md"
              style={{
                background: "linear-gradient(135deg, #8B1A1A 0%, #6B1414 100%)",
              }}
            >
              <span>Proceed to Institutional Login</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
