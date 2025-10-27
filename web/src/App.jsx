import { Routes, Route, Link } from "react-router-dom";
import RequestBooking from "./pages/RequestBooking.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";

function Home() {
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>HawkSpace</h1>
      <p>Welcome! Use the button below to request a room booking.</p>
      <Link to="/request-booking"
            style={{ background: "#111827", color: "#fff",
                     padding: "0.6rem 1rem", borderRadius: 6, textDecoration: "none" }}>
        Request Booking
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/request-booking" element={<RequestBooking />} />
    </Routes>
  );
}
