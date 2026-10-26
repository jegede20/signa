/* ============================================================
   SIGNA — data/signs.js
   Every sign definition: ASL fingerspelling A–Z + 6 phrases.

   pose: 5 characters for [thumb, index, middle, ring, pinky]
         E = extended · C = curled · H = half-bent · K = hooked
   extras (optional checks scored on top of finger curl):
         spread: "together" | "spread"   (extended fingertips)
         thumbTouch: "index" | "middle" | "pinky"
         thumbPos: 0..1 across the palm (0 = index side, 1 = pinky side)
         point: "up" | "side" | "down"   (index direction)
         crossed: true                   (index over middle, letter R)
   Dynamic signs (J, Z, phrases) score the handshape and teach
   the movement in the step text — see `dynamic: true`.
   ============================================================ */

export const FINGERS = ["thumb", "index", "middle", "ring", "pinky"];
export const FINGER_LABELS = { thumb: "thumb", index: "index finger", middle: "middle finger", ring: "ring finger", pinky: "pinky" };
export const STATE_CURL = { E: 0, H: 0.5, K: 0.68, C: 1 };
export const STATE_NAMES = { E: "extended", H: "half-bent", K: "hooked", C: "curled" };

const S = (id, name, pose, extras, desc, steps, extra = {}) =>
  ({ id, name, type: "alphabet", pose, extras, desc, steps, ...extra });

export const ALPHABET = [
  S("A", "A", "ECCCC", { thumbPos: 0.02 },
    "A fist with your thumb resting tall against the side of your index finger.",
    ["Make a tight fist, palm facing the camera.", "Keep all four fingers curled down.", "Stand your thumb up straight against the side of your index finger."]),
  S("B", "B", "CEEEE", { spread: "together", thumbPos: 0.45 },
    "Four fingers straight up and together, thumb tucked across your palm.",
    ["Raise index, middle, ring and pinky straight up.", "Press the four fingers together — no gaps.", "Fold your thumb across the middle of your palm."]),
  S("C", "C", "HHHHH", {},
    "Curve your whole hand into the shape of the letter C, like holding a cup.",
    ["Open your hand, palm facing sideways.", "Half-bend every finger and your thumb.", "Leave a clear gap between fingertips and thumb — a C shape."]),
  S("D", "D", "HEHHH", { thumbTouch: "middle" },
    "Index points up while the other fingertips meet your thumb in a circle.",
    ["Point your index finger straight up.", "Curl middle, ring and pinky down to your thumb.", "Touch those fingertips to your thumb tip to close the circle."]),
  S("E", "E", "CCCCC", { thumbPos: 0.4 },
    "A tight, claw-like fist — fingertips pressed down, thumb tucked low.",
    ["Curl all four fingers down tightly, fingertips touching your palm.", "Squeeze the fingers close together.", "Tuck your thumb low across the front of your curled fingers."]),
  S("F", "F", "HHEEE", { thumbTouch: "index", spread: "spread" },
    "Index and thumb form a circle; the other three fingers stand up.",
    ["Raise middle, ring and pinky straight up, slightly spread.", "Bend your index finger down.", "Pinch your index fingertip to your thumb tip, making a ring."]),
  S("G", "G", "EECCC", { point: "side" },
    "Index and thumb point sideways together, like pointing across the room.",
    ["Curl middle, ring and pinky down.", "Extend index and thumb, roughly parallel.", "Rotate your hand so the index points sideways, not up."]),
  S("H", "H", "CEECC", { point: "side", spread: "together" },
    "Index and middle point sideways together, palm facing down.",
    ["Extend index and middle, pressed together.", "Curl ring and pinky down.", "Turn your hand sideways so the two fingers point across."]),
  S("I", "I", "CCCCE", {},
    "Pinky up, everything else folded into a fist.",
    ["Make a fist, palm facing the camera.", "Curl index, middle and ring down with thumb across them.", "Raise only your pinky straight up."]),
  S("J", "J", "CCCCE", {},
    "The same handshape as I — then draw a small J in the air with your pinky.",
    ["Start with the letter I: pinky up, fist closed.", "Dip your pinky down and sweep it up in a hook.", "Trace the curve of a J — down, then flick up."], { dynamic: true, note: "J moves! We score the I handshape — add the J sweep." }),
  S("K", "K", "HEECC", { spread: "spread", thumbPos: 0.22 },
    "Index and middle in a V, thumb tip touching the base of your middle finger.",
    ["Raise index and middle in a V shape.", "Curl ring and pinky down.", "Rest your thumb tip at the base of your middle finger."]),
  S("L", "L", "EECCC", { point: "up", spread: "spread" },
    "Thumb out, index up — your hand draws the letter L.",
    ["Point your index straight up.", "Stretch your thumb out to the side, wide from the index.", "Curl middle, ring and pinky down."]),
  S("M", "M", "CCCCC", { thumbPos: 0.78 },
    "Three fingers folded over your thumb, which hides underneath near the ring finger.",
    ["Make a fist, palm facing the camera.", "Slide your thumb under your index, middle and ring fingers.", "Fold those three fingers down over the thumb — its tip peeks near the ring finger."]),
  S("N", "N", "CCCCC", { thumbPos: 0.5 },
    "Two fingers folded over your thumb, tucked under your middle finger.",
    ["Make a fist, palm facing the camera.", "Slide your thumb under your index and middle fingers.", "Fold those two fingers over it — thumb tip lands under the middle finger."]),
  S("O", "O", "HHHHH", { thumbTouch: "middle" },
    "All fingertips meet your thumb, forming a round O.",
    ["Curve every finger as if holding a small ball.", "Bring all four fingertips toward your thumb.", "Touch fingertips to thumb tip, leaving a round hole — an O."]),
  S("P", "P", "HEECC", { point: "down", spread: "spread" },
    "The letter K flipped upside down, pointing at the floor.",
    ["Start with K: index and middle in a V, thumb at the middle base.", "Curl ring and pinky down.", "Rotate your wrist so the V points downward."]),
  S("Q", "Q", "EECCC", { point: "down" },
    "The letter G flipped upside down, pointing at the floor.",
    ["Start with G: index and thumb extended, others curled.", "Keep index and thumb roughly parallel.", "Rotate your wrist so the index points down."]),
  S("R", "R", "CEECC", { crossed: true },
    "Index and middle crossed over each other — fingers crossed for luck.",
    ["Raise index and middle together.", "Cross the index over the middle finger (or middle over index).", "Curl ring and pinky down with thumb holding them."]),
  S("S", "S", "CCCCC", { thumbPos: 0.28 },
    "A fist with your thumb lying across the front of your fingers.",
    ["Make a tight fist, palm facing the camera.", "Curl all four fingers down.", "Lay your thumb straight across the front of your fingers, not beside them."]),
  S("T", "T", "HCCCC", { thumbPos: 0.14 },
    "A fist with your thumb poking up between index and middle finger.",
    ["Make a fist, palm facing the camera.", "Push your thumb up between your index and middle fingers.", "Fold the index over the thumb so just its tip peeks out."]),
  S("U", "U", "CEECC", { spread: "together", point: "up" },
    "Index and middle straight up and pressed together.",
    ["Raise index and middle straight up.", "Press them together with no gap.", "Curl ring and pinky down, thumb holding them."]),
  S("V", "V", "CEECC", { spread: "spread", point: "up" },
    "Index and middle in a wide V — the peace sign.",
    ["Raise index and middle straight up.", "Spread them wide into a V.", "Curl ring and pinky down, thumb holding them."]),
  S("W", "W", "HEEEC", { spread: "spread", thumbTouch: "pinky" },
    "Three fingers up and spread, thumb pinning your pinky down.",
    ["Raise index, middle and ring straight up, spread apart.", "Curl your pinky down.", "Pin the pinky with your thumb tip."]),
  S("X", "X", "CKCCC", {},
    "Index hooked like a claw, everything else in a fist.",
    ["Make a fist, palm facing the camera.", "Raise your index finger halfway.", "Hook it — bend it into a claw or hook shape, not straight."]),
  S("Y", "Y", "ECCCE", { spread: "spread" },
    "Thumb and pinky out wide — the surfer shaka.",
    ["Stretch your thumb out to one side.", "Stretch your pinky out to the other side.", "Curl index, middle and ring down into your palm."]),
  S("Z", "Z", "CECCC", {},
    "Point your index and draw a Z in the air.",
    ["Point your index finger, curl everything else.", "Draw a Z: across, diagonal down, across again.", "Keep the shape small and crisp, like writing on glass."], { dynamic: true, note: "Z moves! We score the pointing handshape — add the Z trace." }),
];

const P = (id, name, pose, extras, desc, steps, extra = {}) =>
  ({ id, name, type: "phrase", pose, extras, desc, steps, dynamic: true, ...extra });

export const PHRASES = [
  P("HELLO", "Hello", "EEEEE", { spread: "spread" },
    "An open hand waving from beside your forehead, like a friendly salute.",
    ["Open your hand flat, fingers together, thumb out.", "Touch your thumb near your forehead, palm out.", "Sweep the hand outward in a small wave."],
    { note: "We score the open handshape — add the wave from your forehead." }),
  P("THANK_YOU", "Thank You", "EEEEE", { spread: "together" },
    "A flat hand moving from your chin outward — blowing a kiss of thanks.",
    ["Flatten your hand, fingers together.", "Touch your fingertips to your chin.", "Move the hand forward and down, palm up."],
    { note: "We score the flat handshape — start it at your chin and push out." }),
  P("PLEASE", "Please", "EEEEE", { spread: "together" },
    "A flat hand rubbing a slow circle on your chest.",
    ["Flatten your hand, fingers together.", "Place it palm-down on the center of your chest.", "Rub in a slow, gentle circle."],
    { note: "We score the flat handshape — circle it on your chest." }),
  P("SORRY", "Sorry", "ECCCC", { thumbPos: 0.02 },
    "The A handshape rubbing a circle on your chest.",
    ["Make the letter A: fist with thumb tall at the side.", "Place the fist over your heart.", "Rub in a slow circle on your chest."],
    { note: "We score the A handshape — circle it on your chest." }),
  P("YES", "Yes", "CCCCC", { thumbPos: 0.28 },
    "The S handshape nodding up and down like a head saying yes.",
    ["Make the letter S: fist, thumb across the front.", "Hold it upright at shoulder height.", "Bend the wrist down twice, nodding the fist."],
    { note: "We score the S handshape — nod it twice from the wrist." }),
  P("NO", "No", "HHHCC", { thumbTouch: "index" },
    "Index and middle snapping down onto your thumb, twice.",
    ["Raise index and middle together, palm out.", "Bring your thumb up beneath them.", "Snap the two fingers down onto the thumb, twice."],
    { note: "We score the finger-to-thumb shape — snap it closed twice." }),
];

export const SIGNS = [...ALPHABET, ...PHRASES];
export const SIGN_MAP = Object.fromEntries(SIGNS.map((s) => [s.id, s]));
export const getSign = (id) => SIGN_MAP[id] || null;

/** Expand the 5-char pose string into { finger: "E"|"C"|"H"|"K" }. */
export function poseByFinger(sign) {
  const out = {};
  FINGERS.forEach((f, i) => { out[f] = sign.pose[i]; });
  return out;
}
