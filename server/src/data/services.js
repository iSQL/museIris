// Static catalogue & schedule — single source of truth for both the server and
// (via API) the frontend. Mirrors the prototype's data.jsx SERVICES/WORKING_HOURS.

export const SERVICES = [
  {
    id: "mani-kl",
    cat: "Manikir",
    name: "Klasični manikir",
    desc: "Oblikovanje, pažljiva nega zanoktica i lak po izboru.",
    duration: 45,
    price: 1500,
  },
  {
    id: "mani-gel",
    cat: "Manikir",
    name: "Trajni gel lak",
    desc: "Manikir sa gel lakom dugog trajanja, do tri nedelje sjaja.",
    duration: 75,
    price: 2400,
    featured: true,
  },
  {
    id: "mani-ojacanje",
    cat: "Manikir",
    name: "Ojačavanje akril gelom",
    desc: "Diskretno ojačavanje prirodne ploče za otpornije nokte.",
    duration: 90,
    price: 3200,
  },
  {
    id: "mani-french",
    cat: "Manikir",
    name: "French / Baby boomer",
    desc: "Klasika i mekani prelaz, ručno crtano.",
    duration: 90,
    price: 2900,
  },
  {
    id: "ped-kl",
    cat: "Pedikir",
    name: "Klasični pedikir",
    desc: "Topla kupka, piling, korekcija i lakiranje.",
    duration: 60,
    price: 2200,
  },
  {
    id: "ped-spa",
    cat: "Pedikir",
    name: "Spa pedikir Iris",
    desc: "Ritual sa eteričnim uljima irisa, maska i masaža stopala.",
    duration: 90,
    price: 3400,
    featured: true,
  },
  {
    id: "ped-gel",
    cat: "Pedikir",
    name: "Pedikir + trajni lak",
    desc: "Kompletna nega stopala uz dugotrajan gel lak.",
    duration: 90,
    price: 3200,
  },
  {
    id: "ext-skidanje",
    cat: "Dodaci",
    name: "Skidanje trajnog laka",
    desc: "Pažljivo skidanje bez oštećenja ploče.",
    duration: 20,
    price: 600,
  },
  {
    id: "ext-art",
    cat: "Dodaci",
    name: "Nail art (po noktu)",
    desc: "Ručno crtani detalji, kamenčići, folije.",
    duration: 15,
    price: 250,
  },
];

export const CATEGORIES = ["Manikir", "Pedikir", "Dodaci"];

// 0=Sunday … 6=Saturday. null means closed.
export const WORKING_HOURS = {
  0: null,
  1: ["09:00", "19:00"],
  2: ["09:00", "19:00"],
  3: ["09:00", "19:00"],
  4: ["09:00", "20:00"],
  5: ["09:00", "20:00"],
  6: ["10:00", "16:00"],
};

export const SLOT_STEP = 30; // minutes
export const LEAD_TIME_MIN = 30; // bookings must be at least this far in the future when made today

export function findService(id) {
  return SERVICES.find((s) => s.id === id) || null;
}
