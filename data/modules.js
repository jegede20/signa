/* ============================================================
   SIGNA — data/modules.js · the 5 learning modules
   ============================================================ */
export const MODULES = [
  { id: 1, title: "Your First 5 Signs", tagline: "Visually distinct, easy wins to get you going.", signs: ["A", "B", "C", "L", "Y"] },
  { id: 2, title: "Easy Letters", tagline: "Clear shapes you can nail quickly.", signs: ["D", "I", "O", "V", "W", "U", "S"] },
  { id: 3, title: "Tricky Letters", tagline: "Similar shapes — the details matter here.", signs: ["E", "F", "G", "H", "K", "N", "M", "P"] },
  { id: 4, title: "The Hard Ones", tagline: "Hooks, crosses and two signs that move.", signs: ["J", "Z", "Q", "R", "T", "X"] },
  { id: 5, title: "Common Phrases", tagline: "Real conversation: greet, thank, apologise.", signs: ["HELLO", "THANK_YOU", "PLEASE", "SORRY", "YES", "NO"] },
];

export const getModule = (id) => MODULES.find((m) => m.id === Number(id)) || null;
export const moduleOfSign = (signId) => MODULES.find((m) => m.signs.includes(signId)) || null;
export const CERTIFICATE = { title: "Signa Certified", note: "Awarded when Module 5 is complete." };
