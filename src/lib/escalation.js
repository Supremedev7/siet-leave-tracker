export function getFinalAuthority(totalDays) {
  if (totalDays <= 2) return "faculty";
  if (totalDays <= 5) return "hod";
  return "admin";
}

export function canFacultyApproveDirectly(totalDays) {
  return totalDays <= 2;
}

export function canHodApproveDirectly(totalDays) {
  return totalDays <= 5;
}

export function requiresAdminApproval(totalDays) {
  return totalDays >= 6;
}

export function getNextPendingStage(currentStage) {
  if (currentStage === "faculty") {
    return { nextStage: "hod", nextStatus: "pending_hod" };
  }
  if (currentStage === "hod") {
    return { nextStage: "admin", nextStatus: "pending_admin" };
  }
  return { nextStage: "completed", nextStatus: "approved" };
}
