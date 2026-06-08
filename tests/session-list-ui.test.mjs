import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");

function loadSessionList() {
  const filename = resolve("app/components/Modules/SessionList.tsx");
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
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

  return cjsModule.exports.default;
}

function renderSessionList() {
  const SessionList = loadSessionList();

  return renderToStaticMarkup(
    React.createElement(SessionList, {
      activeSessionId: "active",
      onDeleteSession: () => {},
      onSelectSession: () => {},
      sessions: [
        {
          id: "active",
          title: "Active chat",
          updatedAt: 0,
        },
      ],
      t: (key) => key,
    }),
  );
}

function getClassForTagContaining(html, tagName, marker) {
  const tags = html.match(new RegExp(`<${tagName}[^>]*>`, "g")) ?? [];
  const tag = tags.find((candidate) => candidate.includes(marker));

  assert.ok(tag, `Expected to find <${tagName}> containing ${marker}`);

  const classMatch = tag.match(/class="([^"]*)"/);
  assert.ok(classMatch, `Expected <${tagName}> containing ${marker} to have a class`);

  return classMatch[1];
}

test("active session indicator is removed before the delete action appears", () => {
  const html = renderSessionList();
  const indicatorClasses = getClassForTagContaining(html, "span", "bg-[var(--accent-primary)]");
  const deleteButtonClasses = getClassForTagContaining(html, "button", 'title="Delete chat"');

  assert.ok(
    indicatorClasses.includes("group-hover:hidden"),
    "active indicator should be hidden on row hover so it cannot overlap the delete button",
  );
  assert.ok(
    indicatorClasses.includes("group-focus-within:hidden"),
    "active indicator should also hide while the row contains keyboard focus",
  );
  assert.ok(
    deleteButtonClasses.includes("pointer-events-none"),
    "hidden delete button should not capture clicks over the active indicator",
  );
  assert.ok(
    deleteButtonClasses.includes("group-hover:pointer-events-auto"),
    "delete button should only accept pointer input once visible on hover",
  );
  assert.ok(
    deleteButtonClasses.includes("group-focus-within:pointer-events-auto"),
    "delete button should accept pointer input when revealed by keyboard focus",
  );
});
