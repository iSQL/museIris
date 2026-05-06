import { useEffect, useMemo, useState } from "react";
import * as api from "../api.js";
import { isoDate } from "../data/format.js";

import AdminSidebar from "./AdminSidebar.jsx";
import AdminHeader from "./AdminHeader.jsx";
import OverviewView from "./OverviewView.jsx";
import RequestsView from "./RequestsView.jsx";
import CalendarView from "./CalendarView.jsx";
import ClientsView from "./ClientsView.jsx";

export default function AdminApp() {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [view, setView] = useState("requests");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.getServices(), api.listBookings()])
      .then(([s, b]) => {
        setServices(s.services);
        setBookings(b.bookings);
      })
      .catch((err) => setError(err.message || String(err)));
  }, []);

  const counts = useMemo(
    () => ({
      pending: bookings.filter((b) => b.status === "pending").length,
      approved: bookings.filter((b) => b.status === "approved").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      rejected: bookings.filter((b) => b.status === "rejected").length,
    }),
    [bookings]
  );

  const todayIso = isoDate(new Date());
  const todayBookings = useMemo(
    () => bookings.filter((b) => b.date === todayIso && b.status === "approved"),
    [bookings, todayIso]
  );
  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => b.date >= todayIso && b.status === "approved")
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [bookings, todayIso]
  );
  const monthRevenue = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + (services.find((s) => s.id === b.service)?.price || 0), 0),
    [bookings, services]
  );

  async function setStatus(id, status) {
    try {
      const res = await api.updateBookingStatus(id, status);
      setBookings((prev) => prev.map((b) => (b.id === id ? res.booking : b)));
      if (selected?.id === id) setSelected(res.booking);
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <AdminSidebar view={view} setView={setView} counts={counts} />
      <main style={{ padding: "32px 40px 60px", overflowX: "hidden" }}>
        <AdminHeader view={view} todayCount={todayBookings.length} />

        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: 12,
              border: "1px solid var(--bad)",
              borderRadius: 2,
              color: "#d99a8b",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {view === "requests" && (
          <RequestsView
            services={services}
            bookings={bookings}
            filter={filter}
            setFilter={setFilter}
            counts={counts}
            setStatus={setStatus}
            selected={selected}
            setSelected={setSelected}
            search={search}
            setSearch={setSearch}
          />
        )}
        {view === "calendar" && <CalendarView services={services} bookings={bookings} />}
        {view === "clients" && <ClientsView refreshKey={bookings.length} />}
        {view === "overview" && (
          <OverviewView
            services={services}
            counts={counts}
            todayBookings={todayBookings}
            upcoming={upcoming}
            monthRevenue={monthRevenue}
          />
        )}
      </main>
    </div>
  );
}
