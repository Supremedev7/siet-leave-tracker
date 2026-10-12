import assert from "node:assert/strict";
import { 
  getFinalAuthority, 
  canFacultyApproveDirectly, 
  canHodApproveDirectly, 
  requiresAdminApproval 
} from "../src/lib/escalation.js";

// Test 1: Final authority computation
assert.equal(getFinalAuthority(0.5), "faculty");
assert.equal(getFinalAuthority(1), "faculty");
assert.equal(getFinalAuthority(2), "faculty");
assert.equal(getFinalAuthority(3), "hod");
assert.equal(getFinalAuthority(5), "hod");
assert.equal(getFinalAuthority(6), "admin");
assert.equal(getFinalAuthority(10), "admin");

// Test 2: Faculty authority
assert.equal(canFacultyApproveDirectly(1), true);
assert.equal(canFacultyApproveDirectly(2), true);
assert.equal(canFacultyApproveDirectly(3), false);

// Test 3: HOD authority
assert.equal(canHodApproveDirectly(3), true);
assert.equal(canHodApproveDirectly(5), true);
assert.equal(canHodApproveDirectly(6), false);

// Test 4: Admin authority
assert.equal(requiresAdminApproval(5), false);
assert.equal(requiresAdminApproval(6), true);

console.log("All escalation unit tests passed!");
