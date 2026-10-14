import { db } from "@/lib/firebase";
import {
  doc,
  runTransaction,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Generates an institutional auto-incrementing Employee ID for Faculty and HODs.
 * Format: [ROLE][YY][DEPT][CODE][SEQ] (e.g., F26AIML0S001, H26CSE0S001)
 *
 * @param role 'faculty' | 'hod'
 * @param department Branch code (e.g., 'AIML', 'CSE', 'ECE')
 * @returns Formatted unique Employee ID
 */
export async function generateEmployeeId(
  role: "faculty" | "hod",
  department: string
): Promise<string> {
  const roleChar = role === "hod" ? "H" : "F";
  const yearShort = String(new Date().getFullYear()).slice(-2);
  const deptCode = department.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const fixedCode = "0S";
  const counterDocId = `${roleChar}_${yearShort}_${deptCode}`;
  const counterRef = doc(db, "staffCounters", counterDocId);

  // Check if counter document already exists; if not, query users collection for existing max sequence
  let baselineSeq = 0;

  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("role", "==", role),
      where("department", "==", department)
    );
    const existingUsers = await getDocs(q);

    const prefix = `${roleChar}${yearShort}${deptCode}${fixedCode}`;
    existingUsers.forEach((userDoc) => {
      const data = userDoc.data();
      const existingId = (data.employeeId || "").toUpperCase();
      if (existingId.startsWith(prefix)) {
        const seqPart = existingId.slice(prefix.length);
        const parsed = parseInt(seqPart, 10);
        if (!isNaN(parsed) && parsed > baselineSeq) {
          baselineSeq = parsed;
        }
      }
    });
  } catch (err) {
    console.warn("Could not pre-scan users collection for staff sequence, using counter fallback:", err);
  }

  // Atomically increment counter via Firestore transaction
  const nextSeq = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    let currentSeq = baselineSeq;

    if (counterSnap.exists()) {
      const recordedSeq = counterSnap.data().lastSeq || 0;
      currentSeq = Math.max(currentSeq, recordedSeq);
    }

    const incrementedSeq = currentSeq + 1;

    transaction.set(
      counterRef,
      {
        lastSeq: incrementedSeq,
        role,
        department: deptCode,
        year: yearShort,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return incrementedSeq;
  });

  const seqStr = String(nextSeq).padStart(3, "0");
  return `${roleChar}${yearShort}${deptCode}${fixedCode}${seqStr}`;
}

/**
 * Creates an index document in `staffLookups` collection so staff can sign in using their Employee ID
 */
export async function createStaffLookup(params: {
  employeeId: string;
  email: string;
  role: "faculty" | "hod";
  department: string;
  name: string;
  uid: string;
  approvalStatus: "pending" | "approved" | "rejected";
}) {
  const lookupRef = doc(db, "staffLookups", params.employeeId.toUpperCase());
  await setDoc(
    lookupRef,
    {
      employeeId: params.employeeId.toUpperCase(),
      email: params.email.toLowerCase().trim(),
      role: params.role,
      department: params.department,
      name: params.name,
      uid: params.uid,
      approvalStatus: params.approvalStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
