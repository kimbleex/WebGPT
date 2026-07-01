import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

function read(path) {
  return readFileSync(resolve(path), "utf8");
}

test("user management hook exposes PATCH actions", () => {
  const source = read("app/components/Modules/hooks/useUserManagement.ts");

  assert.match(source, /updateUserAccess/, "hook should expose an updateUserAccess action");
  assert.match(source, /method:\s*["']PATCH["']/, "hook should call the users API with PATCH");
  assert.match(source, /JSON\.stringify\(\{\s*userId,\s*action,\s*hours/, "hook should send user id, action, and optional hours");
  assert.match(source, /fetchUsers\(page/, "hook should refresh the current list after an update");
});

test("user list renders status and access controls", () => {
  const source = read("app/components/Modules/UserList.tsx");

  assert.match(source, /admin\.table\.status/, "table should include a status column");
  assert.match(source, /admin\.table\.actions/, "table should include an actions column");
  assert.match(source, /admin\.actions\.disable/, "rows should render a disable action");
  assert.match(source, /admin\.actions\.enable/, "rows should render an enable action");
  assert.match(source, /admin\.actions\.extend/, "rows should render an extend action");
  assert.match(source, /updateUserAccess\(user\.id,\s*user\.is_disabled\s*\?\s*["']enable["']\s*:\s*["']disable["']/, "toggle button should switch by disabled state");
  assert.match(source, /colSpan=\{7\}/, "desktop empty and loading rows should span all table columns");
});

test("translations include user access management labels", () => {
  const source = read("lib/i18n.tsx");

  for (const key of ["status", "actions", "active", "disabled", "disable", "enable", "extend", "extendHours"]) {
    assert.match(source, new RegExp(`${key}:`), `translations should include ${key}`);
  }
});
