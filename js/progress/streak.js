/* ============================================================
   SIGNA — progress/streak.js · streak logic + calendar data
   ============================================================ */
import { store, todayKey } from "../core/store.js";

function daysBetween(aKey, bKey) {
  const a = new Date(aKey + "T12:00:00");
  const b = new Date(bKey + "T12:00:00");
  return Math.round((b - a) / 86400000);
}

export const practicedToday = () => store.streak?.last_practiced === todayKey();

/** The streak survives until a full calendar day is missed. */
export function streakAtRisk() {
  if (!store.streak?.last_practiced || (store.streak.current || 0) === 0) return false;
  return !practicedToday() && daysBetween(store.streak.last_practiced, todayKey()) === 1;
}

/** Log one scored attempt against today (streak + per-day practice log). */
export async function logPracticeDay(signId, score) {
  const today = todayKey();
  const s = store.streak;
  if (s.last_practiced !== today) {
    const gap = s.last_practiced ? daysBetween(s.last_practiced, today) : null;
    s.current = gap === 1 ? (s.current || 0) + 1 : 1;
    s.longest = Math.max(s.longest || 0, s.current);
    s.last_practiced = today;
  }
  if (!s.history.includes(today)) s.history.push(today);
  s.history = s.history.slice(-400);

  const log = store.dayLog[today] || { signs: {}, attempts: 0, best: 0 };
  log.signs[signId] = (log.signs[signId] || 0) + 1;
  log.attempts += 1;
  log.best = Math.max(log.best, Math.round(score));
  store.dayLog[today] = log;

  await Promise.all([store.persistStreak(), store.persistDayLog()]);
}

/** Calendar model for a month: array of {key, day, filled, isToday, isFuture, inMonth}. */
export function monthCalendar(year, month /* 0-11 */) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // Sunday first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const history = new Set(store.streak?.history || []);
  const today = todayKey();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push({ inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const key = todayKey(date);
    cells.push({ inMonth: true, key, day: d, filled: history.has(key), isToday: key === today, isFuture: key > today });
  }
  while (cells.length % 7 !== 0) cells.push({ inMonth: false });
  return cells;
}

/** Current week (Sun–Sat) model for the dashboard strip. */
export function weekStrip() {
  const now = new Date();
  const sunday = new Date(now); sunday.setDate(now.getDate() - now.getDay());
  const history = new Set(store.streak?.history || []);
  const today = todayKey();
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday); d.setDate(sunday.getDate() + i);
    const key = todayKey(d);
    return { key, label: labels[i], day: d.getDate(), filled: history.has(key), isToday: key === today, isFuture: key > today };
  });
}

/** What happened on a given day, e.g. for the calendar day sheet. */
export function dayDetail(key) {
  return store.dayLog?.[key] || null;
}
