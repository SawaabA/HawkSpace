import "@/styles/Auth.css";
import { LAURIER_CAMPUS_PAGE } from "@/constants/branding";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <aside className="auth-visual" aria-hidden="true">
          <div className="auth-visual-content">
            <p className="auth-eyebrow">Wilfrid Laurier University</p>
            <h2>Campuses & Locations</h2>
            <p>
              Take a moment to explore all Laurier campuses before reserving your next space.
              Every booking keeps Golden Hawk energy flowing.
            </p>
            <a className="auth-campus-link" href={LAURIER_CAMPUS_PAGE} target="_blank" rel="noreferrer">
              Explore campuses →
            </a>
          </div>
        </aside>

        <div className="auth-form-panel">
          <div className="auth-header">
            <div className="auth-brand">
              <div className="logo">HS</div>
              <div>
                <h1>HawkSpace</h1>
                <div className="auth-sub">Secure portal • Laurier</div>
              </div>
            </div>
          </div>

          <div className="auth-body">
            <h2 className="auth-title">{title}</h2>
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
            {children}
          </div>

          <div className="auth-footer">{footer}</div>
        </div>
      </div>
    </div>
  );
}
