import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import "@/styles/student.css";
import { featuredEvent } from "@/data/events";
import { LAURIER_CAMPUS_PAGE } from "@/constants/branding";

const links = [
  { to: "/search", label: "Find a Space" },
  { to: "/request", label: "Request a Room" },
  { to: "/events", label: "Events" },
  { to: "/my-requests", label: "My Requests" },
];

export default function StudentLayout() {
  const { profile, user, isAdmin } = useAuth();
  const { highContrast, toggleHighContrast } = useTheme();

  return (
    <div className="student-shell">
      <header className="student-header">
        <div className="student-brand">
          <div className="mark">LH</div>
          <div>
            <div style={{ textTransform: "uppercase", letterSpacing: 2, fontSize: 12, color: "#8b80a5" }}>
              Laurier Campus
            </div>
            <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: 0.2 }}>HawkSpace</div>
          </div>
        </div>

        <nav className="student-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {link.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin/requests"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Admin
            </NavLink>
          )}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={toggleHighContrast}
            aria-label={highContrast ? "Disable high contrast mode" : "Enable high contrast mode"}
            title={highContrast ? "Disable high contrast mode" : "Enable high contrast mode"}
            style={{
              padding: ".5rem",
              borderRadius: 8,
              border: "1px solid #c4b5fd",
              background: highContrast ? "#4338ca" : "white",
              color: highContrast ? "white" : "#4338ca",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            {highContrast ? "🔆" : "◐"}
          </button>
          <div className="student-user">
            <div style={{ fontWeight: 700 }}>{profile?.displayName || user?.email}</div>
            <div style={{ fontSize: 12 }}>
              {profile?.role || "Student"} · <span style={{ color: "#a398c6" }}>America/Toronto</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <NavLink to="/logout" className="logout-link">
                Log out
              </NavLink>
            </div>
          </div>
        </div>
      </header>

      <section className="student-hero">
        <div style={{ position: "relative", zIndex: 2 }}>
          <div className="hero-eyebrow">Wilfrid Laurier University</div>
          <h1 className="hero-title">Welcome Golden Hawk!</h1>
          <p style={{ maxWidth: 480, fontSize: "1.05rem", lineHeight: 1.6 }}>
            Book study halls, lecture rooms, and event spaces with the same energy you bring to campus life.
            We keep the process fast, transparent, and unmistakably Laurier.
          </p>
          <div className="hero-actions">
            <NavLink to="/request" className="primary-btn">
              Book Now
            </NavLink>
            <Link to="/events#events-calendar" className="secondary-btn">
              Full Events Calendar
            </Link>
          </div>
        </div>
        {featuredEvent && (
          <div className="hero-card">
            <span className="chip">Next event</span>
            <h4>{featuredEvent.title}</h4>
            <div style={{ fontSize: 14 }}>
              {featuredEvent.date} · {featuredEvent.time}
            </div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>{featuredEvent.location}</div>
            <p style={{ margin: "0.35rem 0 0.5rem" }}>{featuredEvent.description}</p>
            <NavLink to="/events" className="cta-link">
              See details →
            </NavLink>
          </div>
        )}
      </section>

      <section className="campus-highlight">
        <div className="campus-card">
          <div className="campus-copy">
            <span className="chip purple">Campuses & Locations</span>
            <h3>Tour Laurier spaces before you book</h3>
            <p>
              Need inspiration? See where Waterloo, Brantford, and Milton campuses shine, then bring that energy to
              HawkSpace bookings.
            </p>
            <a className="secondary-btn light" href={LAURIER_CAMPUS_PAGE} target="_blank" rel="noreferrer">
              Visit Laurier campuses
            </a>
          </div>
        </div>
      </section>

      <main className="student-main">
        <Outlet />
      </main>
    </div>
  );
}
