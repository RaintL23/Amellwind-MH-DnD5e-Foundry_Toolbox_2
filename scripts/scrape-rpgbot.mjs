/**
 * One-time scraper for RPGBOT 2024 class optimization guides.
 * Run: pnpm scrape:rpgbot
 *
 * On Windows, TLS certificate chain issues are handled inside the script.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";

import * as cheerio from "cheerio";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(
  __dirname,
  "../src/features/builder/data/rpgbot-ratings.json",
);

const URLS = [
  "https://rpgbot.net/2024-dnd/classes/barbarian/",
  "https://rpgbot.net/2024-dnd/classes/barbarian/barbarian-subclasses/",
  "https://rpgbot.net/2024-dnd/classes/artificer/",
  "https://rpgbot.net/2024-dnd/classes/artificer/artificer-subclasses/",
  "https://rpgbot.net/2024-dnd/classes/artificer/replicate-magic-item/",
  "https://rpgbot.net/2024-dnd/classes/bard/",
  "https://rpgbot.net/2024-dnd/classes/bard/bard-spells/",
  "https://rpgbot.net/2024-dnd/classes/bard/bard-subclasses/",
  "https://rpgbot.net/2024-dnd/classes/cleric/",
  "https://rpgbot.net/2024-dnd/classes/cleric/cleric-subclasses/",
  "https://rpgbot.net/2024-dnd/classes/cleric/cleric-spells/",
  "https://rpgbot.net/2024-dnd/classes/druid/",
  "https://rpgbot.net/2024-dnd/classes/druid/druid-spells/",
  "https://rpgbot.net/2024-dnd/classes/druid/druid-subclasses/",
  "https://rpgbot.net/2024-dnd/classes/fighter/",
  "https://rpgbot.net/2024-dnd/classes/fighter/fighter-subclasses/",
  "https://rpgbot.net/2024-dnd/classes/fighter/fighter-subclasses/champion/",
  "https://rpgbot.net/2024-dnd/classes/fighter/fighter-subclasses/eldritch-knight/",
  "https://rpgbot.net/2024-dnd/classes/fighter/fighter-subclasses/eldritch-knight/spells/",
  "https://rpgbot.net/2024-dnd/classes/monk/",
  "https://rpgbot.net/2024-dnd/classes/monk/monk-subclasses/",
  "https://rpgbot.net/2024-dnd/classes/paladin/",
  "https://rpgbot.net/2024-dnd/classes/paladin/paladin-subclasses/",
  "https://rpgbot.net/2024-dnd/classes/paladin/paladin-spells/",
  "https://rpgbot.net/2024-dnd/classes/ranger/",
  "https://rpgbot.net/2024-dnd/classes/ranger/ranger-spells/",
  "https://rpgbot.net/2024-dnd/classes/ranger/ranger-subclasses/",
  "https://rpgbot.net/2024-dnd/classes/rogue/",
  "https://rpgbot.net/2024-dnd/classes/rogue/rogue-subclasses/",
  "https://rpgbot.net/2024-dnd/classes/rogue/arcane-trickster-spells/",
  "https://rpgbot.net/2024-dnd/classes/sorcerer/",
  "https://rpgbot.net/2024-dnd/classes/sorcerer/sorcerer-subclasses/",
  "https://rpgbot.net/2024-dnd/classes/sorcerer/sorcerer-subclasses/draconic-sorcery/",
  "https://rpgbot.net/2024-dnd/classes/sorcerer/sorcerer-subclasses/wild-magic/",
  "https://rpgbot.net/2024-dnd/classes/warlock/",
  "https://rpgbot.net/2024-dnd/classes/warlock/warlock-subclasses/",
  "https://rpgbot.net/2024-dnd/classes/warlock/invocations/",
  "https://rpgbot.net/2024-dnd/classes/wizard/",
  "https://rpgbot.net/2024-dnd/classes/wizard/spells/",
  "https://rpgbot.net/2024-dnd/classes/wizard/wizard-subclasses/",
];

const SKIP_SECTIONS = new Set([
  "introduction",
  "table of contents",
  "disclaimer",
  "frequently asked questions",
]);

const RATING_SCORE = {
  red: 1,
  orange: 2,
  green: 3,
  blue: 4,
};

const LEGEND_NAMES = new Set(["red", "orange", "green", "blue"]);

function decodeHtml(text) {
  return text
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(text) {
  return decodeHtml(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function inferCategory(section, subsection, guide) {
  const haystack = `${section} ${subsection} ${guide}`.toLowerCase();
  if (haystack.includes("background")) return "background";
  if (haystack.includes("species") || haystack.includes("race")) return "species";
  if (haystack.includes("feat") || haystack.includes("boon")) return "feat";
  if (haystack.includes("subclass")) return "subclass";
  if (haystack.includes("invocation")) return "invocation";
  if (haystack.includes("spell")) return "spell";
  if (haystack.includes("replicate magic item") || haystack.includes("magic item plan"))
    return "magic-item";
  if (haystack.includes("weapon")) return "weapon";
  if (haystack.includes("armor")) return "armor";
  if (haystack.includes("tool")) return "tool";
  if (haystack.includes("multiclass")) return "multiclass";
  if (haystack.includes("fighting style")) return "fighting-style";
  if (haystack.includes("maneuver")) return "maneuver";
  if (haystack.includes("metamagic")) return "metamagic";
  if (haystack.includes("pact")) return "pact";
  if (haystack.includes("feature") || haystack.includes("class feature"))
    return "class-feature";
  return slugify(section || guide || "general");
}

function parsePageMeta(url) {
  const path = new URL(url).pathname.replace(/\/$/, "");
  const parts = path.split("/").filter(Boolean);
  const className = parts[2] ?? "unknown";
  const rest = parts.slice(3);

  if (rest.length === 0) {
    return { className, guide: "class", subclass: null };
  }

  const joined = rest.join("/");

  if (joined === "replicate-magic-item") {
    return { className, guide: "replicate-magic-item", subclass: null };
  }
  if (joined === "invocations") {
    return { className, guide: "invocations", subclass: null };
  }
  if (joined === "arcane-trickster-spells") {
    return {
      className,
      guide: "subclass-spells",
      subclass: "arcane-trickster",
    };
  }
  if (joined === "fighter-subclasses/eldritch-knight/spells") {
    return {
      className,
      guide: "subclass-spells",
      subclass: "eldritch-knight",
    };
  }
  if (joined.endsWith("-spells") || joined === "spells") {
    return { className, guide: "spells", subclass: null };
  }
  if (joined.endsWith("-subclasses")) {
    return { className, guide: "subclasses", subclass: null };
  }

  const subclassesIdx = rest.findIndex((part) => part.endsWith("-subclasses"));
  if (subclassesIdx !== -1 && rest.length > subclassesIdx + 1) {
    return {
      className,
      guide: "subclass-detail",
      subclass: rest[subclassesIdx + 1],
    };
  }

  return { className, guide: joined || "guide", subclass: null };
}

function extractSourceFromNode($node) {
  const supText = $node.find("sup").first().text().replace(/[()]/g, "").trim();
  if (supText) return supText;

  const linkText = $node.find("sup a").first().text().trim();
  if (linkText) return linkText;

  const plain = $node.text();
  const match = plain.match(/\(([^)]+)\)/);
  return match?.[1]?.trim() ?? null;
}

function extractSource($li) {
  return extractSourceFromNode($li);
}

function extractSummary($li, name) {
  const clone = $li.clone();
  clone.find("span[class*='rating-']").remove();
  clone.find("sup").remove();
  let text = decodeHtml(clone.text());
  text = text.replace(/^:\s*/, "");
  if (name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`^${escaped}\\s*`), "");
  }
  return text.trim();
}

function shouldSkipEntry(section, name, rating) {
  const sectionKey = section.toLowerCase();
  if (SKIP_SECTIONS.has(sectionKey)) return true;
  if (sectionKey === "disclaimer" && LEGEND_NAMES.has(name.toLowerCase())) return true;
  if (LEGEND_NAMES.has(name.toLowerCase()) && sectionKey === "disclaimer") return true;
  // Color legend inside disclaimer lists
  if (
    LEGEND_NAMES.has(name.toLowerCase()) &&
    /bad, useless|ok options|good options|fantastic options/i.test(rating ? "" : "")
  ) {
    return true;
  }
  return false;
}

function buildEntry({
  pageMeta,
  url,
  currentSection,
  currentSubsection,
  name,
  rating,
  source,
  summary,
}) {
  if (shouldSkipEntry(currentSection, name, rating)) return null;
  if (SKIP_SECTIONS.has(currentSection.toLowerCase())) return null;
  if (
    LEGEND_NAMES.has(name.toLowerCase()) &&
    /bad, useless|ok options|good options|fantastic options/i.test(summary)
  ) {
    return null;
  }

  const category = inferCategory(
    currentSection,
    currentSubsection,
    pageMeta.guide,
  );

  return {
    class: pageMeta.className,
    guide: pageMeta.guide,
    subclass: pageMeta.subclass,
    section: currentSection,
    subsection: currentSubsection || null,
    category,
    name,
    source,
    rating,
    score: RATING_SCORE[rating],
    summary,
    url,
  };
}

function parsePage(html, url, pageMeta) {
  const $ = cheerio.load(html);
  const content = $(".post-content.entry-content").first();
  if (!content.length) {
    throw new Error(`No post content found for ${url}`);
  }

  const entries = [];
  let currentSection = "";
  let currentSubsection = "";

  content.find("h2, h3, h4, li").each((_, el) => {
    const tag = el.tagName?.toLowerCase?.() ?? el.name;
    const $el = $(el);
    const text = decodeHtml($el.text());

    if (tag === "h2") {
      currentSection = text;
      currentSubsection = "";
      return;
    }

    if (tag === "h3") {
      currentSubsection = text;
      return;
    }

    if (tag === "h4") {
      const $rating = $el.find("span[class*='rating-']").first();
      if ($rating.length) {
        const classAttr = $rating.attr("class") ?? "";
        const ratingMatch = classAttr.match(/rating-(red|orange|green|blue)/);
        if (ratingMatch) {
          const rating = ratingMatch[1];
          const name = decodeHtml($rating.text());
          const source = extractSourceFromNode($el);
          const summary = decodeHtml($el.nextUntil("h2, h3, h4").text());
          const entry = buildEntry({
            pageMeta,
            url,
            currentSection,
            currentSubsection,
            name,
            rating,
            source,
            summary,
          });
          if (entry) entries.push(entry);
        }
        return;
      }

      currentSubsection = text;
      return;
    }

    if (tag !== "li") return;

    const $rating = $el.find("span[class*='rating-']").first();
    if (!$rating.length) return;

    const classAttr = $rating.attr("class") ?? "";
    const ratingMatch = classAttr.match(/rating-(red|orange|green|blue)/);
    if (!ratingMatch) return;

    const rating = ratingMatch[1];
    const name = decodeHtml($rating.text());
    if (!name) return;

    const summary = extractSummary($el, name);
    const source = extractSource($el);
    const entry = buildEntry({
      pageMeta,
      url,
      currentSection,
      currentSubsection,
      name,
      rating,
      source,
      summary,
    });
    if (entry) entries.push(entry);
  });

  return {
    url,
    ...pageMeta,
    title: decodeHtml($("h1.entry-title").first().text() || $("title").text()),
    entryCount: entries.length,
    entries,
  };
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Amellwind-Toolbox-RPGBOT-Scraper/1.0 (one-time data import)",
      Accept: "text/html",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

function buildLookup(pages) {
  const byClass = {};

  for (const page of pages) {
    if (!byClass[page.className]) {
      byClass[page.className] = {};
    }
    const guideKey = page.subclass
      ? `${page.guide}/${page.subclass}`
      : page.guide;
    if (!byClass[page.className][guideKey]) {
      byClass[page.className][guideKey] = {};
    }

    for (const entry of page.entries) {
      const sourceKey = entry.source ? slugify(entry.source) : "unknown";
      const nameKey = slugify(entry.name);
      const entityKey = `${nameKey}|${sourceKey}`;
      const bucket = entry.category;

      if (!byClass[page.className][guideKey][bucket]) {
        byClass[page.className][guideKey][bucket] = {};
      }

      byClass[page.className][guideKey][bucket][entityKey] = {
        name: entry.name,
        source: entry.source,
        rating: entry.rating,
        score: entry.score,
        summary: entry.summary,
        section: entry.section,
        subsection: entry.subsection,
      };
    }
  }

  return byClass;
}

async function main() {
  const pages = [];
  const errors = [];

  for (const url of URLS) {
    const pageMeta = parsePageMeta(url);
    process.stdout.write(`Fetching ${pageMeta.className}/${pageMeta.guide}... `);
    try {
      const html = await fetchPage(url);
      const page = parsePage(html, url, pageMeta);
      pages.push(page);
      console.log(`${page.entryCount} entries`);
    } catch (err) {
      console.log("FAILED");
      errors.push({ url, error: String(err) });
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  const allEntries = pages.flatMap((p) => p.entries);
  const output = {
    meta: {
      source: "https://rpgbot.net/2024-dnd/classes/",
      attribution:
        "Ratings and summaries scraped from RPGBOT.net for internal builder guidance. © RPGBOT.",
      scrapedAt: new Date().toISOString(),
      pageCount: pages.length,
      entryCount: allEntries.length,
      ratingScale: RATING_SCORE,
      ratingLegend: {
        red: "Bad, useless, or extremely situational",
        orange: "OK or useful in rare circumstances",
        green: "Good, useful often",
        blue: "Fantastic, often essential",
      },
      urls: URLS,
      errors,
    },
    pages: pages.map(({ entries, ...rest }) => ({
      ...rest,
      entries,
    })),
    byClass: buildLookup(pages),
  };

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log("\nDone.");
  console.log(`Pages: ${pages.length}/${URLS.length}`);
  console.log(`Entries: ${allEntries.length}`);
  console.log(`Output: ${OUTPUT_PATH}`);
  if (errors.length) {
    console.log(`Errors: ${errors.length}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
