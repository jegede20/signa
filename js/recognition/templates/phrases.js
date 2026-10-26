/* ============================================================
   SIGNA — recognition/templates/phrases.js
   Reference templates for the 6 common phrases. Phrases are
   dynamic in real signing; the template captures the core
   handshape and the lesson text teaches the movement.
   ============================================================ */
import { PHRASES } from "../../../data/signs.js";
import { templateFor } from "./alphabet.js";

export const PHRASE_TEMPLATES = Object.fromEntries(PHRASES.map((s) => [s.id, templateFor(s)]));
export { templateFor };
