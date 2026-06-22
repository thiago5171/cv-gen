/**
 * verify-template-simple.mjs
 * Verifica placeholders no template gerado via PowerShell-friendly approach
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// PizZip is a CommonJS module
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const PizZip = require("pizzip");

const ptPath = join(__dirname, "../public/templates/cv-pt.docx");
const buf = readFileSync(ptPath);
const zip = new PizZip(buf);
const xml = zip.files["word/document.xml"].asText();

// Check placeholders
const placeholders = [...xml.matchAll(/\{[^{}]+\}/g)].map((m) => m[0]);
console.log(`Total {placeholder} tokens found: ${placeholders.length}`);
console.log("Unique placeholders:", [...new Set(placeholders)].join(", "));

// Check if placeholders are fragmented across XML elements
// A fragmented placeholder would look like: {name</w:t>...<w:t>}
const crossTagPattern = /\{[^{}]*<\/w:[a-z]+>/g;
const fragmented = [...xml.matchAll(crossTagPattern)];
console.log(`\nFragmented placeholders (split by XML): ${fragmented.length}`);

if (fragmented.length > 0) {
  console.log("⚠ docxtemplater WILL FAIL — placeholders are fragmented.");
  console.log("Sample:", fragmented[0]?.[0]?.substring(0, 100));
} else {
  console.log("✓ Placeholders look intact for docxtemplater.");
}

// Show first 1000 chars of XML for debugging
console.log("\n--- First 800 chars of document.xml ---");
console.log(xml.substring(0, 800));
