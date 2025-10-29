import { Routes, Route, Link } from "react-router-dom";
import BrowseRooms from "./pages/BrowseRooms";
import BookRoom from "./pages/BookRoom";
import MyBookings from "./pages/MyBookings";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

function Home() {
  const { isAuthed, user } = useAuth();
  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, Arial" }}>
      <h1>HawkSpace</h1>
      <p>Welcome! {isAuthed ? `Signed in as ${user.email}` : "Please log in to book rooms."}</p>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        {!isAuthed && <Link to="/login">Login</Link>}
        {isAuthed && (
          <>
            <Link to="/rooms">Browse Rooms</Link>
            <Link to="/my-bookings">My Bookings</Link>
            <Link to="/logout">Logout</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<Logout />} />

      <Route
        path="/rooms"
        element={
          <ProtectedRoute>
            <BrowseRooms />
          </ProtectedRoute>
        }
      />
      <Route
        path="/book/:roomId"
        element={
          <ProtectedRoute>
            <BookRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<div style={{ padding: "2rem" }}>Not found</div>} />
    </Routes>
  );
}
