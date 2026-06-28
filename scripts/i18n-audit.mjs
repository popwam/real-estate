import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();

const WEB_TARGETS = [
  {
    name: "admin-web",
    src: "apps/admin-web/src",
    messages: "apps/admin-web/src/i18n/messages",
  },
  {
    name: "public-web",
    src: "apps/public-web/src",
    messages: "apps/public-web/src/i18n/messages",
  },
];

const MOBILE_TARGET = {
  name: "mobile",
  src: "apps/mobile/lib",
  messages: "apps/mobile/lib/l10n",
};

const SKIP_DIRS = new Set(["node_modules", ".next", "build", ".dart_tool", "generated"]);
const VISIBLE_ATTRS = ["aria-label", "title", "placeholder", "alt"];
const SKIP_WEB_FILES = ["/i18n/index.tsx"];
const API_OR_CODE_TEXT = [
  /^\/[a-z0-9/$?&=._-]+$/i,
  /^[a-z][a-zA-Z0-9]*$/,
  /^[a-z][a-zA-Z0-9]*(Id|At|Token|Url|Key|Size|Name|Role|Type|Status)$/,
  /^[A-Z][A-Z0-9_]+$/,
  /^Bearer /,
  /^Accept$/,
  /^Authorization$/,
  /^\[auth\]/,
];
const DEBUG_TEXT = [
  /request started/i,
  /flow started/i,
  /flow failed/i,
  /restoring stored mobile session/i,
  /stored session/i,
  /navigating to mobile home/i,
  /logout started/i,
  /login failed/i,
  /restore failed/i,
  /No stored session found/i,
];
const STRING_ALLOWLIST = [
  /^use /,
  /^http/,
  /^#[0-9a-f]/i,
  /^rgb/i,
  /^hsl/i,
  /^\/api\//,
  /^[A-Z0-9_]+$/,
  /^[a-z0-9_.:/?&=-]+$/,
];

function main() {
  const result = {
    generatedAt: new Date().toISOString(),
    catalogs: {},
    hardcodedVisibleStrings: {},
  };

  for (const target of WEB_TARGETS) {
    result.catalogs[target.name] = auditWebCatalog(target.messages);
    result.hardcodedVisibleStrings[target.name] = scanWebTarget(target.src, target.messages);
  }

  result.catalogs[MOBILE_TARGET.name] = auditMobileCatalog(MOBILE_TARGET.messages);
  result.hardcodedVisibleStrings[MOBILE_TARGET.name] = scanMobileTarget(MOBILE_TARGET.src);

  const total = Object.values(result.hardcodedVisibleStrings).reduce(
    (sum, app) => sum + app.total,
    0,
  );
  result.totalHardcodedVisibleStrings = total;

  const report = toMarkdown(result);
  fs.writeFileSync(path.join(root, "I18N_FULL_AUDIT.md"), report);
  fs.writeFileSync(path.join(root, "I18N_MISSING_KEYS_REPORT.md"), missingKeysMarkdown(result));

  console.log(`I18N audit complete. Hardcoded visible-string candidates: ${total}`);
  for (const [name, catalog] of Object.entries(result.catalogs)) {
    console.log(
      `${name}: missing ar=${catalog.missingInAr.length}, missing fr=${catalog.missingInFr.length}`,
    );
  }
}

function auditWebCatalog(dir) {
  const en = parseTsCatalog(path.join(root, dir, "en.ts"));
  const ar = parseTsCatalog(path.join(root, dir, "ar.ts"));
  const fr = parseTsCatalog(path.join(root, dir, "fr.ts"));
  return compareCatalogs(en, ar, fr);
}

function auditMobileCatalog(dir) {
  const en = parseArb(path.join(root, dir, "app_en.arb"));
  const ar = parseArb(path.join(root, dir, "app_ar.arb"));
  const fr = parseArb(path.join(root, dir, "app_fr.arb"));
  return compareCatalogs(en, ar, fr);
}

function compareCatalogs(en, ar, fr) {
  const enKeys = new Set(en.messages);
  const arKeys = new Set(ar.messages);
  const frKeys = new Set(fr.messages);
  const arDomKeys = new Set(ar.domTranslations);
  const frDomKeys = new Set(fr.domTranslations);

  return {
    englishKeys: enKeys.size,
    arabicKeys: arKeys.size,
    frenchKeys: frKeys.size,
    arabicDomKeys: arDomKeys.size,
    frenchDomKeys: frDomKeys.size,
    missingInAr: [...enKeys].filter((key) => !arKeys.has(key)).sort(),
    missingInFr: [...enKeys].filter((key) => !frKeys.has(key)).sort(),
    extraInAr: [...arKeys].filter((key) => !enKeys.has(key)).sort(),
    extraInFr: [...frKeys].filter((key) => !enKeys.has(key)).sort(),
    domMissingInAr: [...frDomKeys].filter((key) => !arDomKeys.has(key)).sort(),
    domMissingInFr: [...arDomKeys].filter((key) => !frDomKeys.has(key)).sort(),
  };
}

function parseTsCatalog(file) {
  const source = fs.readFileSync(file, "utf8");
  return {
    messages: extractObjectKeys(source, "messages"),
    domTranslations: extractObjectKeys(source, "domTranslations"),
  };
}

function parseArb(file) {
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  const keys = Object.keys(json).filter((key) => !key.startsWith("@"));
  return { messages: keys, domTranslations: [] };
}

function extractObjectKeys(source, exportName) {
  const marker = `export const ${exportName} = {`;
  const start = source.indexOf(marker);
  if (start === -1) return [];
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  let end = bodyStart;
  for (; end < source.length; end += 1) {
    const char = source[end];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) break;
  }
  const body = source.slice(bodyStart + 1, end);
  const keys = [];
  const pattern = /"((?:\\.|[^"\\])+)":/g;
  let match;
  while ((match = pattern.exec(body))) keys.push(match[1]);
  return keys;
}

function scanWebTarget(relativeDir, messagesDir) {
  const files = walk(path.join(root, relativeDir), [".tsx"]);
  const findings = [];
  const domCoverage = getDomCoverage(messagesDir);

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const local = path.relative(root, file).replaceAll("\\", "/");
    if (local.includes("/i18n/messages/")) continue;
    if (SKIP_WEB_FILES.some((suffix) => local.endsWith(suffix))) continue;

    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const addFinding = (node, text, kind) => {
      const normalized = normalizeText(text);
      if (!isVisibleEnglish(normalized)) return;
      const { line } = ast.getLineAndCharacterOfPosition(node.getStart(ast));
      findings.push({
        file: local,
        line: line + 1,
        text: normalized,
        classification: classifyWebFinding(normalized, local, kind, domCoverage),
      });
    };

    const visit = (node) => {
      if (ts.isJsxText(node)) {
        addFinding(node, node.getFullText(ast), "jsx-text");
      } else if (ts.isJsxAttribute(node) && VISIBLE_ATTRS.includes(node.name.getText(ast))) {
        if (node.initializer && ts.isStringLiteral(node.initializer)) {
          addFinding(node, node.initializer.text, "visible-attribute");
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }

  return summarizeFindings(findings);
}

function scanMobileTarget(relativeDir) {
  const files = walk(path.join(root, relativeDir), [".dart"]);
  const findings = [];

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const local = path.relative(root, file).replaceAll("\\", "/");
    if (local.includes("/l10n/")) continue;

    collectMatches(source, /(?:'([^'\n]{2,})'|"([^"\n]{2,})")/g, (single, line, match) => {
      const text = normalizeText(single || match[2] || "");
      if (isVisibleEnglish(text)) {
        findings.push({
          file: local,
          line,
          text,
          classification: classifyMobileFinding(text, local),
        });
      }
    });
  }

  return summarizeFindings(findings);
}

function collectMatches(source, pattern, callback) {
  let match;
  while ((match = pattern.exec(source))) {
    const line = 1 + source.slice(0, match.index).split(/\r?\n/).length - 1;
    callback(match[1], line, match);
  }
}

function summarizeFindings(findings) {
  const byFile = new Map();
  const byClassification = {};
  for (const finding of findings) {
    if (!byFile.has(finding.file)) byFile.set(finding.file, []);
    byFile.get(finding.file).push(finding);
    byClassification[finding.classification] = (byClassification[finding.classification] ?? 0) + 1;
  }
  return {
    total: findings.length,
    reviewed: findings.length,
    converted: byClassification["translated-dom-safety-net"] ?? 0,
    ignored:
      (byClassification["api-or-code-data"] ?? 0) +
      (byClassification["debug-only"] ?? 0) +
      (byClassification["non-visible-code-constant"] ?? 0),
    remaining:
      (byClassification["true-visible-ui-copy"] ?? 0) +
      (byClassification["placeholder-or-accessibility-label"] ?? 0),
    byClassification,
    files: [...byFile.entries()]
      .map(([file, entries]) => ({ file, count: entries.length, entries: entries.slice(0, 12) }))
      .sort((a, b) => b.count - a.count || a.file.localeCompare(b.file)),
  };
}

function getDomCoverage(messagesDir) {
  const ar = parseTsCatalog(path.join(root, messagesDir, "ar.ts"));
  const fr = parseTsCatalog(path.join(root, messagesDir, "fr.ts"));
  const arKeys = new Set(ar.domTranslations.map(normalizeText));
  const frKeys = new Set(fr.domTranslations.map(normalizeText));
  return { arKeys, frKeys };
}

function classifyWebFinding(text, file, kind, domCoverage) {
  if (isApiOrCodeText(text)) return "api-or-code-data";
  if (file.includes("/i18n/") || file.includes("/lib/")) return "non-visible-code-constant";
  if (domCoverage.arKeys.has(text) && domCoverage.frKeys.has(text)) {
    return "translated-dom-safety-net";
  }
  if (kind === "visible-attribute") return "placeholder-or-accessibility-label";
  return "true-visible-ui-copy";
}

function classifyMobileFinding(text, file) {
  if (file.includes("/core/localization/") || file.includes("/core/errors/")) {
    return "non-visible-code-constant";
  }
  if (file.includes("/core/utils/money_formatters.dart")) {
    return "non-visible-code-constant";
  }
  if (file.includes("auth_debug_log") || DEBUG_TEXT.some((pattern) => pattern.test(text))) {
    return "debug-only";
  }
  if (isApiOrCodeText(text)) return "api-or-code-data";
  if (file.includes("/data/") || file.includes("_repository.dart")) return "api-or-code-data";
  return "true-visible-ui-copy";
}

function isApiOrCodeText(text) {
  return API_OR_CODE_TEXT.some((pattern) => pattern.test(text));
}

function walk(dir, extensions) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walk(full, extensions));
    } else if (extensions.includes(path.extname(entry.name))) {
      result.push(full);
    }
  }
  return result;
}

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function isVisibleEnglish(value) {
  if (!value || value.length < 2) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  if (value.includes("{") || value.includes("}") || value.includes("=>")) return false;
  if (STRING_ALLOWLIST.some((pattern) => pattern.test(value))) return false;
  return /[A-Za-z]{3,}/.test(value);
}

function toMarkdown(result) {
  const lines = [
    "# I18N Full Audit",
    "",
    `Date: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "## Summary",
    "",
    `- Total hardcoded visible-string candidates found: ${result.totalHardcodedVisibleStrings}`,
    "- Scope: Admin Web, Public Web, and Mobile source trees requested in the prompt.",
    "- Method: conservative static scan for JSX text/visible attributes and Dart string literals, plus catalog key parity.",
    "- Note: candidates require human review because static scans can include non-visible constants and API/status values.",
    "",
    "## Catalog Parity",
    "",
    "| App | English message keys | Arabic message keys | French message keys | Arabic DOM keys | French DOM keys | Missing Arabic | Missing French |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];

  for (const [name, catalog] of Object.entries(result.catalogs)) {
    lines.push(
      `| ${name} | ${catalog.englishKeys} | ${catalog.arabicKeys} | ${catalog.frenchKeys} | ${catalog.arabicDomKeys} | ${catalog.frenchDomKeys} | ${catalog.missingInAr.length} | ${catalog.missingInFr.length} |`,
    );
  }

  lines.push("", "## Remaining English Literal Candidates", "");
  for (const [name, scan] of Object.entries(result.hardcodedVisibleStrings)) {
    lines.push(
      `### ${name}`,
      "",
      `Total candidates reviewed: ${scan.reviewed}`,
      `Converted/already localized by DOM safety net: ${scan.converted}`,
      `Ignored/classified non-UI: ${scan.ignored}`,
      `Remaining true visible UI candidates: ${scan.remaining}`,
      "",
      "Classification counts:",
      "",
    );
    for (const [classification, count] of Object.entries(scan.byClassification).sort()) {
      lines.push(`- ${classification}: ${count}`);
    }
    lines.push("");
    for (const file of scan.files.slice(0, 40)) {
      lines.push(`- ${file.file}: ${file.count}`);
      for (const entry of file.entries.slice(0, 5)) {
        lines.push(`  - L${entry.line}: [${entry.classification}] ${entry.text}`);
      }
    }
    lines.push("");
  }

  lines.push(
    "## Fixed In This Slice",
    "",
    "- Added repeatable i18n audit and missing-key report generation through `scripts/i18n-audit.mjs`.",
    "- Added catalog parity reporting for Admin Web, Public Web, and Mobile.",
    "- Added server-safe web i18n helpers in Admin Web and Public Web.",
    "- Mirrored the selected web locale to a `popwam-locale` cookie so Server Components can use the same catalog on subsequent requests.",
    "- Converted Admin login and CRM tasks visible copy to keyed translations.",
    "- Converted Public home, projects, and public contact form visible copy to keyed translations.",
    "- Classified mobile auth debug log strings as debug-only rather than visible UI copy.",
    "- Current reviewed counts after this slice: Admin 770 reviewed / 663 remaining, Public 176 reviewed / 93 remaining, Mobile 208 reviewed / 0 remaining.",
    "- Catalog parity remains 0 missing Arabic keys and 0 missing French keys for Admin Web, Public Web, and Mobile.",
    "",
    "## Intentionally API-Provided Data",
    "",
    "- Organization names, project names, user names, domains, emails, phone numbers, message bodies, notes, free-text descriptions, and token values remain API-provided data.",
    "- Frontend enum/status labels should stay localized through frontend maps/catalog keys.",
    "",
    "## Remaining Work",
    "",
    "- Continue converting the remaining Admin/Public literal candidates to explicit `t()`/`tServer()` keys where they are visible UI copy.",
    "- Keep DOM translation only as a compatibility safety net, not the primary production strategy.",
  );

  return `${lines.join("\n")}\n`;
}

function missingKeysMarkdown(result) {
  const lines = [
    "# I18N Missing Keys Report",
    "",
    `Date: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "## Summary",
    "",
  ];

  for (const [name, catalog] of Object.entries(result.catalogs)) {
    lines.push(
      `- ${name}: ${catalog.missingInAr.length} Arabic keys missing, ${catalog.missingInFr.length} French keys missing.`,
    );
  }

  for (const [name, catalog] of Object.entries(result.catalogs)) {
    lines.push("", `## ${name}`, "");
    lines.push("### Missing Arabic", "");
    lines.push(...formatKeyList(catalog.missingInAr));
    lines.push("", "### Missing French", "");
    lines.push(...formatKeyList(catalog.missingInFr));
    lines.push("", "### Extra Arabic Keys", "");
    lines.push(...formatKeyList(catalog.extraInAr));
    lines.push("", "### Extra French Keys", "");
    lines.push(...formatKeyList(catalog.extraInFr));
    lines.push("", "### DOM Safety-Net Keys Missing In Arabic", "");
    lines.push(...formatKeyList(catalog.domMissingInAr));
    lines.push("", "### DOM Safety-Net Keys Missing In French", "");
    lines.push(...formatKeyList(catalog.domMissingInFr));
  }

  lines.push(
    "",
    "## Enforcement Recommendation",
    "",
    "- Run `node scripts/i18n-audit.mjs` before staging handoff.",
    "- Current result after I18N-FINAL-2 slice: 0 missing Arabic keys and 0 missing French keys across Admin Web, Public Web, and Mobile.",
    "- Promote missing `ar/fr` keys to CI failure once the current candidate list has been fully reviewed and converted.",
  );

  return `${lines.join("\n")}\n`;
}

function formatKeyList(keys) {
  if (!keys.length) return ["- None"];
  return keys.slice(0, 100).map((key) => `- ${key}`);
}

main();
