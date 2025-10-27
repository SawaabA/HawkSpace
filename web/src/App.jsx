import { Routes, Route, Link } from "react-router-dom";
import SearchAvailability from "./pages/SearchAvailability.jsx";
import RequestBooking from "./pages/RequestBooking.jsx"; // if you created it earlier

function Home() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>HawkSpace</h1>
      <div style={{ display: "flex", gap: "1rem" }}>
        <Link to="/search" style={{ textDecoration: "none" }}>Search Availability</Link>
        <Link to="/request-booking" style={{ textDecoration: "none" }}>Request Booking</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<SearchAvailability />} />
      <Route path="/request-booking" element={<RequestBooking />} />
    </Routes>
  );
}
