import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const links = [
  { to: "/search", label: "Search" },
  { to: "/request", label: "Request" },
  { to: "/my-requests", label: "My Requests" },
];

export default function StudentLayout() {
  const { profile, user, isAdmin } = useAuth();

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          background: "white",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div>
          <strong>HawkSpace</strong>
          <div style={{ fontSize: 13, color: "#6b7280" }}>America/Toronto</div>
        </div>
        <nav style={{ display: "flex", gap: "0.75rem" }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                padding: ".5rem 1rem",
                borderRadius: "999px",
                textDecoration: "none",
                fontWeight: 600,
                color: isActive ? "white" : "#232323",
                background: isActive ? "#4338ca" : "transparent",
              })}
            >
              {link.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin/requests"
              style={{
                padding: ".5rem 1rem",
                borderRadius: "999px",
                textDecoration: "none",
                fontWeight: 600,
                color: "#111827",
                border: "1px solid #c7d2fe",
              }}
            >
              Admin
            </NavLink>
          )}
        </nav>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 600 }}>{profile?.displayName || user?.email}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{profile?.role || "user"}</div>
        </div>
      </header>

      <main style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
