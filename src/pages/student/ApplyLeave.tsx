import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  Paperclip, 
  Send, 
  Info,
  CheckCircle2
} from "lucide-react";
import { differenceInCalendarDays, parseISO, isBefore, startOfToday } from "date-fns";

const leaveSchema = z.object({
  type: z.enum(["Medical", "Personal", "Half-Day", "Emergency"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(10, "Please provide a detailed reason (at least 10 characters)"),
  emergencyPhone: z.string().min(10, "Valid 10-digit emergency contact required").regex(/^[0-9]+$/, "Digits only"),
  attachmentUrl: z.string().optional(),
}).refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    const start = parseISO(data.startDate);
    const end = parseISO(data.endDate);
    return !isBefore(end, start);
  },
  {
    message: "End date cannot be earlier than start date",
    path: ["endDate"],
  }
).refine(
  (data) => {
    if (!data.startDate) return true;
    const start = parseISO(data.startDate);
    const today = startOfToday();
    return !isBefore(start, today);
  },
  {
    message: "Start date cannot be in the past",
    path: ["startDate"],
  }
);

type LeaveFormValues = z.infer<typeof leaveSchema>;

export default function ApplyLeave() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      type: "Personal",
      startDate: "",
      endDate: "",
      reason: "",
      emergencyPhone: userData?.phone || "",
      attachmentUrl: "",
    },
  });

  const watchStartDate = form.watch("startDate");
  const watchEndDate = form.watch("endDate");
  const watchType = form.watch("type");

  // Calculate duration
  const totalDays = useMemo(() => {
    if (!watchStartDate || !watchEndDate) return 0;
    try {
      const start = parseISO(watchStartDate);
      const end = parseISO(watchEndDate);
      if (isBefore(end, start)) return 0;
      if (watchType === "Half-Day") return 0.5;
      return differenceInCalendarDays(end, start) + 1;
    } catch {
      return 0;
    }
  }, [watchStartDate, watchEndDate, watchType]);

  const onSubmit = async (values: LeaveFormValues) => {
    if (!userData) {
      toast.error("You must be logged in to apply for leave");
      return;
    }

    setIsLoading(true);
    try {
      const startObj = new Date(values.startDate);
      const endObj = new Date(values.endDate);

      await addDoc(collection(db, "leaveRequests"), {
        type: values.type,
        reason: values.reason,
        emergencyPhone: values.emergencyPhone,
        attachmentUrl: values.attachmentUrl || null,
        totalDays: totalDays || 1,
        startDate: Timestamp.fromDate(startObj),
        endDate: Timestamp.fromDate(endObj),
        studentUid: userData.uid,
        studentName: userData.name,
        rollNumber: userData.rollNumber || "N/A",
        department: userData.department,
        year: userData.year || 1,
        section: userData.section || "A",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Leave application submitted successfully!", {
        description: `Your ${values.type} request has been routed to the ${userData.department} HOD.`,
      });

      navigate("/student/leaves");
    } catch (error: any) {
      console.error("Error applying leave:", error);
      toast.error("Failed to submit leave request", {
        description: error.message || "Please check your network connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto pb-10">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-siet-primary/10 text-siet-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Calendar className="h-3.5 w-3.5" />
            Academic Portal
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
            Apply for Leave
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Submit a formal leave authorization request to the Head of Department (
            <span className="font-semibold text-foreground">{userData?.department}</span>).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Form (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-border/80 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-900 transition-colors">
              <div className="h-1.5 w-full bg-gradient-to-r from-siet-primary via-siet-gold to-siet-primary" />
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-foreground dark:text-zinc-100">
                  Leave Application Details
                </CardTitle>
                <CardDescription>
                  Ensure all dates and reasons are accurate before submission.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    {/* Leave Type */}
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Leave Classification
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 font-medium bg-muted/20 border-border hover:border-siet-primary/50 transition-colors">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Personal">
                                <span className="font-medium">Personal Leave</span>
                                <span className="text-xs text-muted-foreground block">Family functions, travel, domestic reasons</span>
                              </SelectItem>
                              <SelectItem value="Medical">
                                <span className="font-medium">Medical Leave</span>
                                <span className="text-xs text-muted-foreground block">Illness, hospitalization (Cert. recommended)</span>
                              </SelectItem>
                              <SelectItem value="Half-Day">
                                <span className="font-medium">Half-Day Permission</span>
                                <span className="text-xs text-muted-foreground block">Morning or afternoon session</span>
                              </SelectItem>
                              <SelectItem value="Emergency">
                                <span className="font-medium">Urgent / Emergency</span>
                                <span className="text-xs text-muted-foreground block">Immediate unforeseen exigencies</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              From Date
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                min={todayStr}
                                className="h-11 bg-muted/20 border-border hover:border-siet-primary/50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              To Date
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                min={watchStartDate || todayStr}
                                className="h-11 bg-muted/20 border-border hover:border-siet-primary/50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Duration Preview Box */}
                    {totalDays > 0 && (
                      <div className="p-3.5 rounded-xl bg-siet-primary/5 border border-siet-primary/20 flex items-center justify-between text-xs animate-fade-up">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-siet-primary" />
                          <span className="font-medium text-foreground">Calculated Duration:</span>
                        </div>
                        <span className="font-bold px-2.5 py-0.5 rounded-full bg-siet-primary text-white">
                          {totalDays} {totalDays === 1 ? "Day" : "Days"}
                        </span>
                      </div>
                    )}

                    {/* Reason */}
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Reason for Leave
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Please describe the purpose of your leave clearly (minimum 10 characters)..."
                              className="min-h-[110px] bg-muted/20 border-border focus:border-siet-primary resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-[11px] text-muted-foreground">
                            Provide adequate context to help the HOD make an informed decision.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Emergency Phone */}
                    <FormField
                      control={form.control}
                      name="emergencyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Parent / Guardian Emergency Contact
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="10-digit mobile number"
                              maxLength={10}
                              className="h-11 bg-muted/20 border-border"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Attachment / Certificate Link */}
                    <FormField
                      control={form.control}
                      name="attachmentUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Paperclip className="h-3.5 w-3.5" />
                            Medical Proof / Supporting Document (Optional URL)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://drive.google.com/... or document link"
                              className="h-11 bg-muted/20 dark:bg-zinc-800 border-border dark:border-zinc-700"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-[11px] text-muted-foreground dark:text-zinc-400">
                            For Medical leaves exceeding 2 days, attaching medical certificates is required.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 rounded-xl"
                      style={{
                        background: "linear-gradient(135deg, #8B1A1A 0%, #6B1414 100%)",
                      }}
                    >
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Submitting Application...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit to Department HOD
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar: Rules & Guidelines */}
          <div className="space-y-4">
            <Card className="border-border/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground dark:text-zinc-100">
                  <Info className="h-4 w-4 text-siet-primary dark:text-red-400" />
                  Leave Policies (SIET)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground dark:text-zinc-400">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Maximum acceptable leaves are strictly 2 days per calendar month.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>On-Duty (OD) is not available for students; regular attendance is enforced.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Minimum 75% overall semester attendance is mandatory per JNTUK norms.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Approved digital passes must be verified at the campus gate upon departure.</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/20">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Exam Season Notice
                </div>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                  Leaves during Mid-Term or Lab External examinations require direct written consent from the Principal's office.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
