// Presentation helpers — Serbian (sr-Latn) formatting.

export const fmtRSD = (n) => new Intl.NumberFormat("sr-Latn-RS").format(n) + " RSD";

export const fmtDur = (m) => {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `${h}h ${mm}min` : `${h}h`;
};

export const MONTHS_SR = [
  "Januar", "Februar", "Mart", "April", "Maj", "Jun",
  "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar",
];
export const DAYS_SR_SHORT = ["Ned", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub"];
export const DAYS_SR_LONG = [
  "Nedelja", "Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota",
];

export const pad2 = (n) => String(n).padStart(2, "0");

export const isoDate = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const fmtDateLong = (d) =>
  `${DAYS_SR_LONG[d.getDay()]}, ${d.getDate()}. ${MONTHS_SR[d.getMonth()]} ${d.getFullYear()}.`;

export const fmtDateShort = (d) =>
  `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;

// Best-effort Serbian (Latin) relative-time formatter. Returns strings like
// "upravo", "pre 12 minuta", "pre 3 sata", "juče", "pre 5 dana", or a fmtDateShort
// fallback for distant dates. Accepts a Date or an ISO string.
export function fmtRelativeTime(input) {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);

  if (sec < 45) return "upravo";
  if (min < 2) return "pre minut";
  if (min < 60) return `pre ${min} minuta`;
  if (hr < 2) return "pre sat vremena";
  if (hr < 5) return `pre ${hr} sata`;
  if (hr < 24) return `pre ${hr} sati`;
  if (day === 1) return "juče";
  if (day < 7) return `pre ${day} dana`;
  return fmtDateShort(d);
}
