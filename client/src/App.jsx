import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import ClientApp from "./client/ClientApp.jsx";
import ServicesPage from "./client/ServicesPage.jsx";
import AdminApp from "./admin/AdminApp.jsx";
import RoleSwitch from "./components/RoleSwitch.jsx";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const view = location.pathname.startsWith("/admin") ? "admin" : "client";
  const setView = (v) => navigate(v === "admin" ? "/admin" : "/");

  return (
    <>
      <RoleSwitch view={view} setView={setView} />
      <div data-screen-label={view === "client" ? "Klijent — rezervacija" : "Admin — kontrolna tabla"}>
        <Routes>
          <Route path="/" element={<ClientApp />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/admin" element={<AdminApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
