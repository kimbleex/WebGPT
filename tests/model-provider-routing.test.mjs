import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

function read(path) {
  return readFileSync(resolve(path), "utf8");
}

test("chat route routes models to provider-specific credentials", () => {
  const route = read("app/api/chat/route.ts");

  assert.match(route, /process\.env\.OPENAI_API_KEY/, "GPT models should use OPENAI_API_KEY");
  assert.match(route, /process\.env\.OPENAI_BASE_URL/, "GPT models should use OPENAI_BASE_URL");
  assert.match(route, /process\.env\.ANTHROPIC_API_KEY/, "Claude models should use ANTHROPIC_API_KEY");
  assert.match(route, /process\.env\.ANTHROPIC_BASE_URL/, "Claude models should use ANTHROPIC_BASE_URL");
  assert.match(route, /process\.env\.DPSK_API_KEY/, "DeepSeek models should use DPSK_API_KEY");
  assert.match(route, /process\.env\.DPSK_BASE_URL/, "DeepSeek models should use DPSK_BASE_URL");
  assert.doesNotMatch(route, /process\.env\.API_KEY/, "chat route should not use the old shared API_KEY");
  assert.doesNotMatch(route, /process\.env\.BASE_URL/, "chat route should not use the old shared BASE_URL");
});

test("model selector includes DeepSeek V4 Pro", () => {
  const selector = read("app/components/ModelSelector.tsx");

  assert.match(selector, /id:\s*"deepseek-v4-pro"/, "model list should include deepseek-v4-pro");
  assert.match(selector, /provider:\s*"deepseek"/, "DeepSeek model should use the deepseek provider");
});
