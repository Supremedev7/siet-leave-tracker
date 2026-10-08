import React from "react";
import StatusTag, { LeaveStatus } from "./StatusTag";

export type { LeaveStatus };

export const StatusBadge: React.FC<{
  status: LeaveStatus | string;
  className?: string;
  showIcon?: boolean;
}> = ({ status, className }) => {
  return <StatusTag status={status} className={className} />;
};

export default StatusBadge;
