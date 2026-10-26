/* Regenerates svg/hands/*.svg and svg/siggy/*.svg from the app's own
   renderers so the shipped assets can never drift from the code.
   Run from the repo root:  node generate-assets.mjs                    */
import { writeFileSync, mkdirSync } from "node:fs";
import { SIGNS } from "./data/signs.js";
import { renderHandSVG } from "./js/avatar/demo.js";
import { siggySVG, SIGGY_MOODS } from "./js/avatar/siggy.js";

mkdirSync("svg/hands", { recursive: true });
mkdirSync("svg/siggy", { recursive: true });

let n = 0;
for (const sign of SIGNS) {
  const file = sign.type === "alphabet" ? `${sign.id}.svg` : `${sign.id.toLowerCase().replace("_", "-")}.svg`;
  writeFileSync(`svg/hands/${file}`, renderHandSVG(sign, { stage: 2, annotate: true }).trim() + "\n");
  n++;
}
for (const mood of SIGGY_MOODS) {
  writeFileSync(`svg/siggy/${mood}.svg`, siggySVG(mood).trim() + "\n");
  n++;
}
console.log(`Wrote ${n} SVG assets`);
