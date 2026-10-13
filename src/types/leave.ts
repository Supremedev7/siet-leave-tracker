export type UserRole = "student" | "faculty" | "hod" | "admin";

export type LeaveType = "Medical" | "Personal" | "Half-Day" | "Emergency" | "On-Duty";

export type LeaveStatus =
  | "pending_faculty"
  | "pending_hod"
  | "pending_admin"
  | "approved"
  | "rejected"
  | "cancelled";

export type ApproverStage = "faculty" | "hod" | "admin" | "completed";

export interface ApprovalChainEntry {
  stage: "faculty" | "hod" | "admin";
  action: "forwarded" | "approved" | "rejected";
  approverUid: string;
  approverName: string;
  approverRole: UserRole;
  remarks: string;
  timestamp: any;
}

export interface LeaveRequest {
  id: string;
  studentUid: string;
  studentName: string;
  rollNumber: string;
  department: string;
  year: number;
  section: string;
  type: LeaveType;
  startDate: any;
  endDate: any;
  totalDays: number;
  reason: string;
  emergencyPhone: string;
  attachmentUrl?: string | null;

  // Multi-tier workflow fields
  status: LeaveStatus;
  currentApprover: ApproverStage;
  finalAuthority: "faculty" | "hod" | "admin";
  approvalChain: ApprovalChainEntry[];

  // Direct remarks for display convenience
  facultyRemarks?: string;
  hodRemarks?: string;
  adminRemarks?: string;

  createdAt: any;
  updatedAt: any;
}

export interface ClassAssignment {
  department: string;
  year: number;
  section: string;
}

// Faculty Leave Application types
export type FacultyLeaveStatus = "pending_hod" | "approved" | "rejected" | "cancelled";

export interface FacultyLeaveRequest {
  id: string;
  facultyUid: string;
  facultyName: string;
  employeeId: string;
  department: string;
  designation?: string;
  type: LeaveType;
  startDate: any; // Firestore Timestamp
  endDate: any;
  totalDays: number;
  reason: string;
  emergencyPhone: string;
  attachmentUrl?: string | null;
  status: FacultyLeaveStatus;
  hodRemarks?: string;
  approvedByUid?: string;
  approvedByName?: string;
  approvedAt?: any;
  createdAt: any;
  updatedAt: any;
}

