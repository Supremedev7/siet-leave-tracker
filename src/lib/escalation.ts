import { ApproverStage, LeaveStatus } from "@/types/leave";

export function getFinalAuthority(totalDays: number): "faculty" | "hod" | "admin" {
  if (totalDays <= 2) return "faculty";
  if (totalDays <= 5) return "hod";
  return "admin";
}

export function canFacultyApproveDirectly(totalDays: number): boolean {
  return totalDays <= 2;
}

export function canHodApproveDirectly(totalDays: number): boolean {
  return totalDays <= 5;
}

export function requiresAdminApproval(totalDays: number): boolean {
  return totalDays >= 6;
}

export function getNextPendingStage(currentStage: ApproverStage): {
  nextStage: ApproverStage;
  nextStatus: LeaveStatus;
} {
  if (currentStage === "faculty") {
    return { nextStage: "hod", nextStatus: "pending_hod" };
  }
  if (currentStage === "hod") {
    return { nextStage: "admin", nextStatus: "pending_admin" };
  }
  return { nextStage: "completed", nextStatus: "approved" };
}
