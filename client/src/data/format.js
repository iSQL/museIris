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
