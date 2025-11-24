import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const links = [
  { to: "/admin/requests", label: "Requests" },
  { to: "/admin/reports", label: "Reports" },
];


export default function AdminLayout() {
  const { profile, user } = useAuth();
  const { highContrast, toggleHighContrast } = useTheme();
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          background: "#0f172a",
          color: "white",
        }}
      >
        <div>
          <div style={{ fontWeight: 700 }}>HawkSpace Admin</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>America/Toronto</div>
        </div>
        <nav style={{ display: "flex", gap: 12 }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                padding: ".45rem 1rem",
                borderRadius: 999,
                textDecoration: "none",
                fontWeight: 600,
                color: isActive ? "#0f172a" : "white",
                background: isActive ? "#f8fafc" : "rgba(255,255,255,0.15)",
              })}
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/search"
            style={{
              padding: ".45rem 1rem",
              borderRadius: 999,
              textDecoration: "none",
              fontWeight: 600,
              color: "#0f172a",
              background: "#38bdf8", // distinct sky blue so it doesn't blend with Requests/Reports
            }}
          >
            Student view
          </NavLink>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={toggleHighContrast}
            aria-label={highContrast ? "Disable high contrast mode" : "Enable high contrast mode"}
            title={highContrast ? "Disable high contrast mode" : "Enable high contrast mode"}
            style={{
              padding: ".5rem",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.3)",
              background: highContrast ? "white" : "rgba(255,255,255,0.15)",
              color: highContrast ? "#0f172a" : "white",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            {highContrast ? "🔆" : "◐"}
          </button>
          <div style={{ textAlign: "right", fontSize: 14 }}>
            <div>{profile?.displayName || user?.email}</div>
            <div style={{ opacity: 0.8 }}>{profile?.role || "admin"}</div>
            <div style={{ marginTop: 6 }}>
              <NavLink
                to="/logout"
                style={{
                  fontSize: 12,
                  color: "#0ea5e9",
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.3)",
                  padding: "2px 10px",
                  borderRadius: 999,
                  display: "inline-block",
                }}
              >
                Log out
              </NavLink>
            </div>
          </div>
        </div>
      </header>
      <main style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
