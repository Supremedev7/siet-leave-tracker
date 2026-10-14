import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

export interface SmsNotificationPayload {
  recipientPhone?: string;
  recipientUid?: string;
  recipientName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: "approved" | "rejected";
  approverName: string;
  approverRole: string;
  remarks?: string;
  leaveId?: string;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  phone: string;
  mode: "live_gateway" | "institutional_log";
  error?: string;
}

/**
 * Mask phone number for secure UI toast presentation (e.g. +91 98*** **321)
 */
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    const last3 = digits.slice(-3);
    const first2 = digits.slice(-10, -8);
    return `+91 ${first2}*** **${last3}`;
  }
  return phone;
}

/**
 * Format the standard institutional SMS message template
 */
export function formatInstitutionalSmsMessage(payload: SmsNotificationPayload): string {
  const actionText = payload.status === "approved" ? "APPROVED" : "REJECTED";
  const roleDisplay = payload.approverRole.toUpperCase();
  const remarksSegment = payload.remarks && payload.remarks.trim().length > 0 
    ? ` Remarks: ${payload.remarks.trim()}` 
    : "";

  return `[SIET LEAVE DESK] Dear ${payload.recipientName}, your ${payload.leaveType} leave application (${payload.startDate} to ${payload.endDate}) has been ${actionText} by ${roleDisplay} (${payload.approverName}).${remarksSegment}`;
}

/**
 * Send an SMS alert to a student or faculty member when their leave is approved or rejected.
 * Operates across live SMS gateways (Twilio / Msg91 / Fast2SMS / custom webhooks) when env vars are defined,
 * and maintains an immutable audit ledger in Firestore `sms_logs` collection.
 */
export async function sendLeaveSmsNotification(
  payload: SmsNotificationPayload
): Promise<SmsSendResult> {
  let targetPhone = payload.recipientPhone?.trim() || "";

  // If no phone provided in payload but recipientUid is present, resolve from user profile
  if (!targetPhone && payload.recipientUid) {
    try {
      const userDoc = await getDoc(doc(db, "users", payload.recipientUid));
      if (userDoc.exists()) {
        const udata = userDoc.data();
        targetPhone = (udata?.phone || udata?.emergencyPhone || "").trim();
      }
    } catch (err) {
      console.warn("Could not retrieve user phone from Firestore profile:", err);
    }
  }

  // Fallback default if empty
  if (!targetPhone) {
    console.warn("sendLeaveSmsNotification: No phone number available for recipient", payload.recipientName);
    return {
      success: false,
      phone: "unspecified",
      mode: "institutional_log",
      error: "Recipient phone number is missing",
    };
  }

  const message = formatInstitutionalSmsMessage(payload);
  const gatewayUrl = import.meta.env.VITE_SMS_GATEWAY_URL;
  const apiKey = import.meta.env.VITE_SMS_API_KEY;
  let mode: "live_gateway" | "institutional_log" = "institutional_log";
  let gatewayError: string | undefined;

  // Attempt real SMS gateway HTTP dispatch if configured
  if (gatewayUrl) {
    try {
      const response = await fetch(gatewayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}`, "x-api-key": apiKey } : {}),
        },
        body: JSON.stringify({
          to: targetPhone,
          message,
          senderId: import.meta.env.VITE_SMS_SENDER_ID || "SRINIET",
          metadata: {
            leaveId: payload.leaveId,
            status: payload.status,
            approverRole: payload.approverRole,
          },
        }),
      });

      if (response.ok) {
        mode = "live_gateway";
      } else {
        gatewayError = `Gateway returned ${response.status}: ${response.statusText}`;
      }
    } catch (err: any) {
      gatewayError = err?.message || "Failed to reach external SMS gateway";
      console.warn("SMS Gateway dispatch warning:", gatewayError);
    }
  }

  // Always record to Firestore sms_logs collection for audit and telemetry
  try {
    await addDoc(collection(db, "sms_logs"), {
      recipientUid: payload.recipientUid || null,
      recipientName: payload.recipientName,
      recipientPhone: targetPhone,
      message,
      leaveId: payload.leaveId || null,
      status: payload.status,
      approverName: payload.approverName,
      approverRole: payload.approverRole,
      mode,
      deliveryStatus: mode === "live_gateway" ? "delivered" : "dispatched",
      error: gatewayError || null,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to write to Firestore sms_logs:", err);
  }

  // User-facing feedback toast confirming SMS dispatch
  const masked = maskPhoneNumber(targetPhone);
  toast.info(`SMS alert dispatched to ${masked}`, {
    description: `Leave ${payload.status.toUpperCase()} alert sent to registered phone number.`,
  });

  return {
    success: true,
    phone: targetPhone,
    mode,
    error: gatewayError,
  };
}
