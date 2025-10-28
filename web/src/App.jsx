import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import RequestBooking from "./pages/RequestBooking.jsx";
import SearchAvailability from "./pages/SearchAvailability.jsx";

function Home() {
  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, Arial" }}>
      <h1>HawkSpace</h1>
      <p>Welcome—please sign in to use tools.</p>
      <div style={{ display: "flex", gap: "10px", marginTop: 12 }}>
        <Link to="/login">Login</Link>
        <Link to="/signup">Sign up</Link>
        <Link to="/search">Search Availability</Link>
        <Link to="/request-booking">Request Booking</Link>
      </div>
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
      <Route path="/search" element={<SearchAvailability />} />
    </Routes>
  );
}
