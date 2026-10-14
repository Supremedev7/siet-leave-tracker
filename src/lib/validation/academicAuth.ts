/**
 * Academic Authentication & Identity Validation Engine
 * Enforces institutional domain and JNTUK 10-character roll number conventions.
 */

// Format: [YY][6N][Entry: 1 char][A][Dept + Seq: 4 chars]
// Examples: 256N5A0511, 246N1A05A1
export const STUDENT_ROLL_REGEX = /^[0-9]{2}6[Nn][0-9][Aa][0-9A-Za-z]{4}$/;
export const STUDENT_EMAIL_REGEX = /^[0-9]{2}6[Nn][0-9][Aa][0-9A-Za-z]{4}@sriniet\.edu\.in$/i;

// Prohibited consumer email domains
const PROHIBITED_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "yahoo.co.in",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "mail.com",
  "zoho.com",
  "rediffmail.com",
  "proton.me",
  "protonmail.com",
];

export interface AcademicValidationResult {
  isValid: boolean;
  error?: string;
  rollNumber?: string;
}

/**
 * Validates student email address and roll number consistency
 */
export function validateStudentRegistration(
  email: string,
  rollNumber?: string
): AcademicValidationResult {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check for consumer/personal domain usage
  const domainPart = cleanEmail.split("@")[1];
  if (domainPart && PROHIBITED_DOMAINS.includes(domainPart)) {
    return {
      isValid: false,
      error: `Standard personal email domains (@${domainPart}) are strictly prohibited. You must register using your official college email address.`,
    };
  }

  // 2. Strict college domain check
  if (!cleanEmail.endsWith("@sriniet.edu.in")) {
    return {
      isValid: false,
      error: "Only official college email addresses ending with @sriniet.edu.in are permitted for student registration.",
    };
  }

  // 3. Extract prefix
  const prefix = cleanEmail.replace(/@sriniet\.edu\.in$/i, "").toUpperCase();

  // 4. Exact 10-character JNTUK roll number format validation
  if (!STUDENT_ROLL_REGEX.test(prefix) || prefix.length !== 10) {
    return {
      isValid: false,
      error: "Invalid student email format. The Roll Number must be exactly 10 characters following the university format (e.g., 256N5A0511@sriniet.edu.in or 246N1A05A1@sriniet.edu.in): 2-digit year, '6N', entry digit, 'A', and 4 alphanumeric branch/sequence characters.",
    };
  }

  // 5. Optional rollNumber match check
  if (rollNumber) {
    const cleanRoll = rollNumber.trim().toUpperCase();
    if (cleanRoll !== prefix) {
      return {
        isValid: false,
        error: `Roll Number (${cleanRoll}) does not match the Roll Number prefix in your email (${prefix}).`,
      };
    }
  }

  return {
    isValid: true,
    rollNumber: prefix,
  };
}

/**
 * Validates staff login identifier (Employee ID or College Email)
 */
export function isStaffEmployeeId(identifier: string): boolean {
  // Format: [F|H][YY][DEPT]0S[SEQ] -> e.g. F26AIML0S001, H26CSE0S001
  return /^[FH][0-9]{2}[A-Z0-9]+0S[0-9]{3}$/i.test(identifier.trim());
}
