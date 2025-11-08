import "@/styles/Auth.css";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
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

        <div className="auth-footer">
          {/* Keep only the footer link if you want it minimal */}
          {footer}
        </div>
      </div>
    </div>
  );
}
