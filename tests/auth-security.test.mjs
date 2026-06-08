import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

function read(path) {
  return readFileSync(resolve(path), "utf8");
}

test("password storage uses bcrypt hashes and never stores submitted passwords directly", () => {
  const auth = read("lib/auth.ts");
  const login = read("app/api/auth/login/route.ts");
  const register = read("app/api/auth/register/route.ts");
  const changePassword = read("app/api/auth/change-password/route.ts");

  assert.match(auth, /bcrypt\.hash\(\s*password\s*,\s*10\s*\)/, "passwords should be hashed with bcrypt before storage");
  assert.match(auth, /bcrypt\.compare\(\s*password\s*,\s*hash\s*\)/, "login should compare submitted passwords against stored hashes");
  assert.match(register, /password:\s*hashedPassword/, "registration should store only the hashed password");
  assert.match(changePassword, /password:\s*hashedPassword/, "password changes should store only the hashed password");
  assert.match(login, /password:\s*hashedPassword/, "admin sync should store only a hashed password");
  assert.doesNotMatch(register, /password:\s*password\b/, "registration must not persist submitted plaintext passwords");
  assert.doesNotMatch(changePassword, /password:\s*newPassword\b/, "password changes must not persist submitted plaintext passwords");
});

test("auth cookies use one hardened configuration everywhere", () => {
  assert.ok(existsSync(resolve("lib/security.ts")), "shared auth cookie security helper should exist");

  const security = read("lib/security.ts");
  const login = read("app/api/auth/login/route.ts");
  const register = read("app/api/auth/register/route.ts");
  const logout = read("app/api/auth/logout/route.ts");

  assert.match(security, /httpOnly:\s*true/, "auth cookie should be HttpOnly");
  assert.match(security, /secure:\s*process\.env\.NODE_ENV\s*===\s*["']production["']/, "auth cookie should be Secure in production");
  assert.match(security, /sameSite:\s*["']lax["']/, "auth cookie should use SameSite=Lax");
  assert.match(security, /maxAge:\s*AUTH_TOKEN_MAX_AGE_SECONDS/, "auth cookie lifetime should match the JWT lifetime");

  for (const [name, source] of [
    ["login route", login],
    ["register route", register],
  ]) {
    assert.match(source, /getAuthCookieOptions\(\)/, `${name} should use the shared cookie options`);
    assert.doesNotMatch(
      source,
      /cookies\.set\(\s*["']token["'][\s\S]*?\{\s*httpOnly:\s*true,\s*path:\s*["']\/["']\s*\}/,
      `${name} should not use the old minimal cookie options`,
    );
  }

  assert.match(logout, /getExpiredAuthCookieOptions\(\)/, "logout should clear cookies with the shared expired options");
});

test("production requests get transport and browser security hardening", () => {
  const transportSecurityFile = existsSync(resolve("proxy.ts")) ? "proxy.ts" : "middleware.ts";

  assert.ok(
    existsSync(resolve(transportSecurityFile)),
    "proxy or middleware should enforce production transport security",
  );

  const middleware = read(transportSecurityFile);

  assert.match(middleware, /Strict-Transport-Security/, "production responses should include HSTS");
  assert.match(middleware, /X-Content-Type-Options/, "responses should prevent MIME sniffing");
  assert.match(middleware, /Referrer-Policy/, "responses should set a referrer policy");
  assert.match(middleware, /X-Frame-Options/, "responses should set clickjacking protection");
  assert.match(middleware, /x-forwarded-proto/, "middleware should inspect proxy protocol");
  assert.ok(middleware.includes('host.startsWith("[")'), "localhost detection should handle bracketed IPv6 hosts");
  assert.match(middleware, /pathname\.startsWith\(\s*["']\/api\/["']\s*\)/, "API requests over HTTP should be rejected instead of redirected with a body");
  assert.match(middleware, /HTTPS required/, "insecure API requests should get an explicit error");
});

test("production JWT signing cannot silently use a default secret", () => {
  const auth = read("lib/auth.ts");

  assert.doesNotMatch(auth, /const JWT_SECRET\s*=\s*process\.env\.JWT_SECRET\s*\|\|/, "JWT secret should not silently fall back at module load");
  assert.match(auth, /getJwtSecret/, "JWT secret selection should be validated through a helper");
  assert.match(auth, /NODE_ENV\s*===\s*["']production["'][\s\S]*JWT_SECRET/, "production should require JWT_SECRET");
});

test("remote database connections enable SSL instead of sending credentials in cleartext", () => {
  const db = read("lib/db.ts");

  assert.match(db, /getDatabaseSslConfig/, "database SSL selection should be explicit");
  assert.match(db, /new pg\.Pool\(\{\s*connectionString,\s*ssl:\s*getDatabaseSslConfig\(connectionString\)/, "pg should receive SSL config for remote databases");
  assert.match(db, /sslmode["']?\)\s*===\s*["']disable["']/, "sslmode=disable should be the only explicit opt-out");
  assert.match(db, /hostname\s*===\s*["']\[::1\]["']/, "local IPv6 database hosts should not be forced through remote SSL");
  assert.match(db, /rejectUnauthorized:\s*false/, "remote database connections should request TLS even when the host CA is not configured locally");
});
