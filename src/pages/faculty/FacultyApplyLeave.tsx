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
import { Calendar, Clock, Send, Briefcase, AlertCircle } from "lucide-react";
import { parseISO, isBefore, startOfToday } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { calculateLeaveDays } from "@/lib/attendance";

const facultyLeaveSchema = z
  .object({
    type: z.enum(["Medical", "Personal", "Half-Day", "Emergency"]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().min(10, "Please provide a detailed reason (at least 10 characters)"),
    emergencyPhone: z
      .string()
      .min(10, "Valid 10-digit emergency contact required")
      .regex(/^[0-9]+$/, "Digits only"),
    attachmentUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return !isBefore(parseISO(data.endDate), parseISO(data.startDate));
    },
    { message: "End date cannot be earlier than start date", path: ["endDate"] }
  );

type FacultyLeaveFormValues = z.infer<typeof facultyLeaveSchema>;

export default function FacultyApplyLeave() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FacultyLeaveFormValues>({
    resolver: zodResolver(facultyLeaveSchema),
    defaultValues: {
      type: "Personal",
      startDate: "",
      endDate: "",
      reason: "",
      emergencyPhone: userData?.phone || "",
      attachmentUrl: "",
    },
  });

  const watchStart = form.watch("startDate");
  const watchEnd = form.watch("endDate");
  const watchType = form.watch("type");

  const durationInfo = useMemo(() => {
    return calculateLeaveDays(watchStart, watchEnd, watchType === "Half-Day");
  }, [watchStart, watchEnd, watchType]);

  const totalDays = durationInfo.totalDays;
  const sundaysCount = durationInfo.sundaysCount;

  const onSubmit = async (values: FacultyLeaveFormValues) => {
    if (!userData) return;
    if (totalDays <= 0) {
      toast.error("Invalid leave duration: selected dates fall entirely on Sundays (natural holidays). No leave deduction required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const start = parseISO(values.startDate);
      const end = parseISO(values.endDate);

      await addDoc(collection(db, "facultyLeaveRequests"), {
        facultyUid: userData.uid,
        facultyName: userData.name,
        employeeId: userData.employeeId || "",
        department: userData.department,
        designation: userData.designation || "Faculty",
        type: values.type,
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        totalDays: totalDays,
        reason: values.reason,
        emergencyPhone: values.emergencyPhone,
        attachmentUrl: values.attachmentUrl || null,
        status: "pending_hod",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Leave application submitted!", {
        description: "Your request has been sent to the Head of the Department for approval.",
      });
      navigate("/faculty/my-leaves");
    } catch (err: any) {
      console.error("Faculty leave submission error:", err);
      toast.error("Failed to submit leave application", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = startOfToday().toISOString().split("T")[0];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-siet-primary/10 text-siet-primary text-xs font-bold tracking-wide uppercase mb-2">
            <Briefcase className="h-3.5 w-3.5" />
            Faculty Leave Application
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            Apply for Leave
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submit your leave request to the Head of the Department for approval.
          </p>
        </div>

        {/* Leave Form */}
        <Card className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-500/5 dark:shadow-none">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-siet-primary dark:text-red-400" />
              Leave Request Form
            </CardTitle>
            <CardDescription className="text-xs">
              All fields marked are required. Provide accurate dates and a detailed reason.
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
                      <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Leave Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 text-xs bg-muted/20 dark:bg-zinc-800/60 border-border">
                            <SelectValue placeholder="Select leave type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Medical">Medical Leave</SelectItem>
                          <SelectItem value="Personal">Personal Leave</SelectItem>
                          <SelectItem value="Half-Day">Half-Day Leave</SelectItem>
                          <SelectItem value="Emergency">Emergency Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Start Date (DD/MM/YYYY)</FormLabel>
                        <FormControl>
                          <DatePicker
                            id="facultyStartDate"
                            min={todayStr}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="DD/MM/YYYY"
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">End Date (DD/MM/YYYY)</FormLabel>
                        <FormControl>
                          <DatePicker
                            id="facultyEndDate"
                            min={watchStart || todayStr}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="DD/MM/YYYY"
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Total Days Display */}
                {totalDays > 0 ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">
                          Total Days: {totalDays} {totalDays === 1 ? "day" : "days"}
                        </span>
                        {sundaysCount > 0 && (
                          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium ml-2">
                            ({sundaysCount} {sundaysCount === 1 ? "Sunday" : "Sundays"} excluded as natural holiday)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : watchStart && watchEnd ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 text-xs text-amber-800 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      Selected dates fall entirely on Sundays (natural holidays). No leave days will be deducted.
                    </span>
                  </div>
                ) : null}

                {/* Reason */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Reason for Leave</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed reason for your leave request..."
                          className="min-h-[100px] text-xs bg-muted/20 dark:bg-zinc-800/60 border-border resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[11px]">Minimum 10 characters required</FormDescription>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                {/* Emergency Phone */}
                <FormField
                  control={form.control}
                  name="emergencyPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Emergency Contact Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="10-digit mobile number"
                          maxLength={10}
                          className="h-10 text-xs bg-muted/20 dark:bg-zinc-800/60 border-border"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                  style={{ background: "linear-gradient(135deg, #8B1A1A 0%, #6B1414 100%)" }}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Submitting Application...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Send className="h-4 w-4" />
                      <span>Submit Leave Application</span>
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
