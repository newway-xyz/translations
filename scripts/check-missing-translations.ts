import { readFileSync } from "fs";
import { resolve } from "path";

// ANSI colors
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

interface LangEntry {
  code: string;
  file: string;
}

interface ProjectConfig {
  slug: string;
  name: string;
  path: string;
  englishFile: string;
  languages: LangEntry[];
}

const ROOT = resolve(import.meta.dir, "..");

const allProjects: ProjectConfig[] = [
  {
    slug: "gta5",
    name: "GTA5",
    path: resolve(ROOT, "gta5"),
    englishFile: "en_US.json",
    languages: [
      { code: "pt_BR", file: "pt_BR.json" },
      { code: "es_ES", file: "es_ES.json" },
      { code: "zh_CN", file: "zh_CN.json" },
      { code: "zn_TW", file: "zn_TW.json" },
    ],
  },
  {
    slug: "enhanced",
    name: "GTA5 Enhanced",
    path: resolve(ROOT, "gta5", "enhanced"),
    englishFile: "en_US.json",
    languages: [
      { code: "pt_BR", file: "pt_BR.json" },
      { code: "es_ES", file: "es_ES.json" },
    ],
  },
  {
    slug: "rdr2",
    name: "RDR2",
    path: resolve(ROOT, "rdr2"),
    englishFile: "english.json",
    languages: [
      { code: "pt_BR", file: "pt_BR.json" },
      { code: "es_ES", file: "es_ES.json" },
      { code: "zn_CH", file: "zn_CH.json" },
    ],
  },
];

function loadJson(filePath: string): Record<string, string> {
  try {
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    console.error(`${RED}Failed to load: ${filePath}${RESET}`);
    return {};
  }
}

function truncate(str: string, max = 60): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

const args = process.argv.slice(2).map((a) => a.toLowerCase());
const validSlugs = allProjects.map((p) => p.slug);

let projects: ProjectConfig[];

if (args.length === 0) {
  projects = allProjects;
} else {
  const invalid = args.filter((a) => !validSlugs.includes(a));
  if (invalid.length > 0) {
    console.error(
      `${RED}Unknown project(s): ${invalid.join(", ")}${RESET}`
    );
    console.error(
      `${DIM}Available: ${validSlugs.join(", ")}${RESET}`
    );
    process.exit(1);
  }
  projects = allProjects.filter((p) => args.includes(p.slug));
}

function checkTranslations() {
  let totalMissing = 0;
  let totalExtra = 0;

  for (const project of projects) {
    console.log(
      `\n${BOLD}${CYAN}${"━".repeat(50)}${RESET}`
    );
    console.log(`${BOLD}${CYAN}  ${project.name}${RESET}`);
    console.log(
      `${BOLD}${CYAN}${"━".repeat(50)}${RESET}`
    );

    const englishPath = resolve(project.path, project.englishFile);
    const english = loadJson(englishPath);
    const englishKeys = new Set(Object.keys(english));

    console.log(
      `${DIM}  Source: ${project.englishFile} (${englishKeys.size} keys)${RESET}`
    );

    for (const lang of project.languages) {
      const langPath = resolve(project.path, lang.file);
      const langData = loadJson(langPath);
      const langKeys = new Set(Object.keys(langData));

      const missing = [...englishKeys].filter((k) => !langKeys.has(k));
      const extra = [...langKeys].filter((k) => !englishKeys.has(k));

      const coverage = englishKeys.size > 0
        ? (((englishKeys.size - missing.length) / englishKeys.size) * 100).toFixed(1)
        : "100.0";

      console.log(`\n  ${BOLD}${lang.code}${RESET} ${DIM}(${lang.file})${RESET}`);
      console.log(
        `  Keys: ${langKeys.size} | Coverage: ${coverage}%`
      );

      if (missing.length > 0) {
        totalMissing += missing.length;
        console.log(
          `  ${RED}Missing ${missing.length} key(s):${RESET}`
        );
        for (const key of missing.sort()) {
          console.log(
            `    ${RED}-${RESET} ${key}  ${DIM}en: "${truncate(english[key])}"${RESET}`
          );
        }
      } else {
        console.log(`  ${GREEN}No missing keys${RESET}`);
      }

      if (extra.length > 0) {
        totalExtra += extra.length;
        console.log(
          `  ${YELLOW}Extra ${extra.length} key(s) not in English:${RESET}`
        );
        for (const key of extra.sort()) {
          console.log(
            `    ${YELLOW}+${RESET} ${key}  ${DIM}val: "${truncate(langData[key])}"${RESET}`
          );
        }
      }
    }
  }

  // Summary
  console.log(`\n${BOLD}${"━".repeat(50)}${RESET}`);
  console.log(`${BOLD}  Summary${RESET}`);
  console.log(`${BOLD}${"━".repeat(50)}${RESET}`);

  if (totalMissing > 0) {
    console.log(`  ${RED}Missing translations: ${totalMissing}${RESET}`);
  } else {
    console.log(`  ${GREEN}All translations are complete!${RESET}`);
  }

  if (totalExtra > 0) {
    console.log(`  ${YELLOW}Extra keys (not in English): ${totalExtra}${RESET}`);
  }

  console.log();

  if (totalMissing > 0) {
    process.exit(1);
  }
}

checkTranslations();
