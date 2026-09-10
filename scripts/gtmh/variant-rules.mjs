import {
  DOWNTIME_SOURCE_FILE,
  SKILLS_GUIDE_SOURCE_FILE,
  headingBlocks,
  readUtf8,
  toParagraphs,
} from "./common.mjs";

const PAGE_HUNT_ROLES = 69;
const PAGE_DOWNTIME = 73;

function asEntries(paragraphs) {
  return paragraphs.length > 0 ? paragraphs : [""];
}

export function buildVariantRules() {
  const rules = [];

  const roles = headingBlocks(readUtf8(SKILLS_GUIDE_SOURCE_FILE), 2);
  for (const role of roles) {
    const entries = asEntries(toParagraphs(role.body));
    rules.push({
      name: `Hunt Role: ${role.title}`,
      source: "AGMH",
      page: PAGE_HUNT_ROLES,
      entries,
    });
  }

  const downtime = headingBlocks(readUtf8(DOWNTIME_SOURCE_FILE), 2);
  for (const block of downtime) {
    const entries = asEntries(toParagraphs(block.body));
    rules.push({
      name: `Downtime Activity: ${block.title}`,
      source: "AGMH",
      page: PAGE_DOWNTIME,
      entries,
    });
  }

  return rules;
}
