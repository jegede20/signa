/* ============================================================
   SIGNA — avatar/poses/phrases.js · phrase demo poses
   ============================================================ */
import { PHRASES } from "../../../data/signs.js";
export { stagePose, STAGE_LABELS } from "./alphabet.js";

export const PHRASE_POSES = Object.fromEntries(PHRASES.map((s) => [s.id, s.pose]));

/* Movement hint drawn under phrase demos (they are dynamic signs). */
export const PHRASE_MOVEMENT = {
  HELLO: "Then wave outward from your forehead",
  THANK_YOU: "Then push forward from your chin",
  PLEASE: "Then circle the hand on your chest",
  SORRY: "Then circle the fist on your chest",
  YES: "Then nod the fist twice",
  NO: "Then snap fingers to thumb twice",
};
