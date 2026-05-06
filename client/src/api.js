// Thin fetch wrappers around the Express backend (proxied at /api by Vite).

async function jsonFetch(path, options = {}) {
  const res = await fetch(path, {
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

export const getServices = () => jsonFetch("/api/services");
export const getWorkingHours = () => jsonFetch("/api/working-hours");

export const listBookings = (status) => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return jsonFetch(`/api/bookings${qs}`);
};
export const getBooking = (id) => jsonFetch(`/api/bookings/${encodeURIComponent(id)}`);
export const getAvailability = (date, serviceId) =>
  jsonFetch(
    `/api/bookings/availability?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`
  );
export const createBooking = (payload) =>
  jsonFetch("/api/bookings", { method: "POST", body: JSON.stringify(payload) });
export const updateBookingStatus = (id, status) =>
  jsonFetch(`/api/bookings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const listClients = () => jsonFetch("/api/clients");
