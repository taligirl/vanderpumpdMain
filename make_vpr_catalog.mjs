// make_vpr_catalog.mjs
// Builds a ready-to-import JSON with FULL episode descriptions (no character limit).
// Steps to use: 1) node make_vpr_catalog.mjs  2) open the new JSON in Bolt, copy-all
//               3) paste into a file on your computer named vanderpumpd-catalog.json
//               4) in your app, click "Import JSON" and pick that file.

import fs from "node:fs";

const API = "https://api.tvmaze.com/shows/1011/episodes?specials=1"; // Vanderpump Rules

// Convert HTML summaries to clean text (no tags), but keep the FULL text.
function htmlToText(html = "") {
  let s = String(html)
    .replace(/<br\s*\/?>/gi, "\n") // keep line breaks
    .replace(/<\/p>/gi, "\n")      // end of paragraphs -> newline
    .replace(/<[^>]+>/g, " ")      // strip other tags
    .replace(/\s+\n/g, "\n")       // tidy spaces before newlines
    .replace(/\n\s+/g, "\n")       // tidy spaces after newlines
    .replace(/[ \t]+/g, " ")       // collapse extra spaces
    .replace(/\n{3,}/g, "\n\n")    // limit multiple blank lines
    .trim();

  // minimal HTML entity decoding
  s = s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  // ensure it ends cleanly with punctuation if the source forgot it
  if (s && !/[.!?]$/.test(s.trim())) s = s.trim() + ".";
  return s;
}

// Optional: you can put exact custom descriptions here if any look odd
const OVERRIDES = {
  // Example:
  // "S8E3": "Your exact text here (this will replace the TVMaze summary entirely)."
};

const res = await fetch(API, { redirect: "follow" });
if (!res.ok) {
  console.error("Failed to fetch", res.status, await res.text());
  process.exit(1);
}
const all = await res.json();

// Keep real episodes only (seasons 1..11, numbered episodes)
const episodes = all
  .filter(e =>
    Number.isFinite(e.season) &&
    e.season >= 1 && e.season <= 11 &&
    Number.isFinite(e.number) && e.number >= 1 &&
    e.name
  )
  .map(e => {
    const full = htmlToText(e.summary || "");
    const fallback = `SUR crew drama around “${e.name.trim()}”.`;
    const description = OVERRIDES[`S${e.season}E${e.number}`] || (full || fallback);
    return {
      id: `S${e.season}E${e.number}`,
      season: e.season,
      episode: e.number,
      title: e.name.trim(),
      description
    };
  })
  // de-dupe + sort
  .filter((e, i, a) => a.findIndex(x => x.id === e.id) === i)
  .sort((a,b)=> a.season - b.season || a.episode - b.episode);

const payload = { version: 8, episodes };

const stamp = new Date().toISOString().slice(0,10);
const file = `vanderpumpd-catalog-${stamp}.json`;
fs.writeFileSync(file, JSON.stringify(payload, null, 2), "utf-8");

const seasons = Array.from(new Set(episodes.map(e=>e.season))).length;
console.log(`✅ Wrote ${file} with ${episodes.length} episodes across ${seasons} seasons (full descriptions, no truncation).`);