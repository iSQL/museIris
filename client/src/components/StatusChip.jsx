const MAP = {
  pending: ["chip-warn", "Na čekanju"],
  approved: ["chip-ok", "Potvrđeno"],
  completed: ["chip-gold", "Obavljeno"],
  rejected: ["chip-bad", "Odbijeno"],
  canceled: ["chip-mute", "Otkazano"],
};

export default function StatusChip({ status }) {
  const [cls, label] = MAP[status] || ["chip-mute", status];
  return <span className={`chip ${cls}`}>{label}</span>;
}
