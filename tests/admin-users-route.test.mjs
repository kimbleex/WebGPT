import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

function read(path) {
  return readFileSync(resolve(path), "utf8");
}

test("admin users API is restricted to the configured super admin", () => {
  const source = read("app/api/admin/users/route.ts");

  assert.match(source, /isSuperAdmin/, "users API should use the shared super-admin guard");
  assert.match(source, /process\.env\.ADMIN_USERNAME/, "users API should compare against the configured admin username");
  assert.doesNotMatch(source, /userPayload\.role\s*!==\s*["']admin["']/, "role-only admin checks are not enough for user management");
});

test("admin users API supports direct status and expiry updates", () => {
  const source = read("app/api/admin/users/route.ts");

  assert.match(source, /export\s+async\s+function\s+PATCH/, "users API should expose a PATCH handler");
  assert.match(source, /parseAdminUserAction/, "PATCH should validate the requested action");
  assert.match(source, /getUpdatedExpiry/, "PATCH should use shared expiry calculation");
  assert.match(source, /Cannot update yourself/, "PATCH should prevent the super admin from disabling their own account");
  assert.match(source, /expires_at:\s*BigInt\(updatedExpiry\)/, "PATCH should persist the computed expiry");
});
