import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import RequestBooking from "./pages/RequestBooking.jsx";   // keep if you have it
import SearchAvailability from "./pages/SearchAvailability.jsx"; // optional

function Home() {
  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>HawkSpace</h1>
      <p>Welcome! Use the button below to request a room booking.</p>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <Link to="/request-booking">Request Booking</Link>
        <Link to="/search">Search Availability</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup">Sign up</Link>
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
