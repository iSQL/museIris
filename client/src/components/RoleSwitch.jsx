export default function RoleSwitch({ view, setView }) {
  return (
    <div className="role-switch">
      <button className={view === "client" ? "active" : ""} onClick={() => setView("client")}>
        Klijent
      </button>
      <button className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}>
        Admin
      </button>
    </div>
  );
}
