import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadAdminUserActions() {
  const filename = resolve("lib/admin-user-actions.ts");
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  });

  const cjsModule = { exports: {} };
  vm.runInNewContext(outputText, {
    exports: cjsModule.exports,
    module: cjsModule,
    require,
  });

  return cjsModule.exports;
}

test("only the configured admin username is treated as super admin", () => {
  const { isSuperAdmin } = loadAdminUserActions();

  assert.equal(isSuperAdmin({ role: "admin", username: "root" }, "root"), true);
  assert.equal(isSuperAdmin({ role: "admin", username: "other" }, "root"), false);
  assert.equal(isSuperAdmin({ role: "user", username: "root" }, "root"), false);
  assert.equal(isSuperAdmin({ role: "admin", username: "root" }, undefined), false);
});

test("disable, enable, and extend actions compute expected expiry times", () => {
  const { getUpdatedExpiry } = loadAdminUserActions();
  const now = 1_700_000_000_000;
  const oneHour = 60 * 60 * 1000;

  assert.equal(getUpdatedExpiry({ action: "disable", currentExpiry: now + oneHour, now }), now - 1000);
  assert.equal(getUpdatedExpiry({ action: "enable", currentExpiry: now - oneHour, now }), now + oneHour);
  assert.equal(getUpdatedExpiry({ action: "enable", currentExpiry: now + 2 * oneHour, now }), now + 2 * oneHour);
  assert.equal(
    getUpdatedExpiry({ action: "extend", currentExpiry: now + 2 * oneHour, now, hours: 3 }),
    now + 5 * oneHour,
  );
  assert.equal(
    getUpdatedExpiry({ action: "extend", currentExpiry: now - oneHour, now, hours: 3 }),
    now + 3 * oneHour,
  );
});

test("extend action rejects invalid hour values", () => {
  const { getUpdatedExpiry } = loadAdminUserActions();
  const now = 1_700_000_000_000;

  assert.throws(() => getUpdatedExpiry({ action: "extend", currentExpiry: now, now, hours: 0 }), /Invalid hours/);
  assert.throws(() => getUpdatedExpiry({ action: "extend", currentExpiry: now, now, hours: 1.5 }), /Invalid hours/);
  assert.throws(() => getUpdatedExpiry({ action: "extend", currentExpiry: now, now, hours: 87601 }), /Invalid hours/);
});
