// Thin fetch wrappers around the Express backend (proxied at /api by Vite).
// Admin endpoints carry the session cookie; the same `credentials: "include"`
// is harmless on public endpoints, so apply it uniformly.

async function jsonFetch(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { error: text };
  }
  if (!res.ok) {
    const err = new Error(body?.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

// ─── public ────────────────────────────────────────────────────────────────
export const getServices = () => jsonFetch("/api/services");
export const getWorkingHours = () => jsonFetch("/api/working-hours");

export const createBooking = (payload) =>
  jsonFetch("/api/bookings", { method: "POST", body: JSON.stringify(payload) });

export const getAvailability = (date, serviceId, excludeId) => {
  const qs = new URLSearchParams({ date, serviceId });
  if (excludeId) qs.set("excludeId", excludeId);
  return jsonFetch(`/api/bookings/availability?${qs.toString()}`);
};

// ─── customer self-service (by token) ──────────────────────────────────────
export const getBookingByToken = (token) =>
  jsonFetch(`/api/bookings/by-token/${encodeURIComponent(token)}`);

export const patchBookingByToken = (token, edits) =>
  jsonFetch(`/api/bookings/by-token/${encodeURIComponent(token)}`, {
    method: "PATCH",
    body: JSON.stringify(edits),
  });

export const cancelBookingByToken = (token) =>
  jsonFetch(`/api/bookings/by-token/${encodeURIComponent(token)}/cancel`, {
    method: "POST",
  });

// ─── admin ─────────────────────────────────────────────────────────────────
export const listBookings = (status) => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return jsonFetch(`/api/bookings${qs}`);
};
export const getBooking = (id) => jsonFetch(`/api/bookings/${encodeURIComponent(id)}`);
export const updateBookingStatus = (id, status) =>
  jsonFetch(`/api/bookings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
export const listClients = () => jsonFetch("/api/clients");

// admin: full service catalogue (incl. archived)
export const listAllServices = () => jsonFetch("/api/services/all");
export const createService = (data) =>
  jsonFetch("/api/services", { method: "POST", body: JSON.stringify(data) });
export const updateService = (id, edits) =>
  jsonFetch(`/api/services/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(edits),
  });
export const deleteService = (id) =>
  jsonFetch(`/api/services/${encodeURIComponent(id)}`, { method: "DELETE" });

// admin: salon config (working hours, slot step, lead time)
export const getConfig = () => jsonFetch("/api/config");
export const updateConfig = (edits) =>
  jsonFetch("/api/config", { method: "PATCH", body: JSON.stringify(edits) });

// coupons — public validate, admin CRUD
export const validateCoupon = (code, serviceId) => {
  const qs = new URLSearchParams({ code });
  if (serviceId) qs.set("serviceId", serviceId);
  return jsonFetch(`/api/coupons/validate?${qs.toString()}`);
};
export const listCoupons = () => jsonFetch("/api/coupons");
export const createCoupon = (data) =>
  jsonFetch("/api/coupons", { method: "POST", body: JSON.stringify(data) });
export const updateCoupon = (id, edits) =>
  jsonFetch(`/api/coupons/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(edits),
  });
export const deleteCoupon = (id) =>
  jsonFetch(`/api/coupons/${encodeURIComponent(id)}`, { method: "DELETE" });

// ─── auth ──────────────────────────────────────────────────────────────────
export const login = (password) =>
  jsonFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ password }) });
export const logout = () => jsonFetch("/api/auth/logout", { method: "POST" });
export const me = () => jsonFetch("/api/auth/me");
