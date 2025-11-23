import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const { currentUser } = useAuth(); // currentUser is null if not logged in
  const navigate = useNavigate();

  const handleBookNow = () => {
    if (currentUser) {
      navigate("/request"); // logged-in users go to room booking
    } else {
      navigate("/login");   // not logged-in users are requred to login
    }
  };

  return (
    <div className="homepage">
      <h1 className="neon-text">HawkSpace</h1>
      <p className="subtitle">
        The go-to room-booking app for Laurier clubs, making it easy to find, request, and manage campus spaces all in one place.
      </p>
      <button className="btn book-btn" onClick={handleBookNow}>
        Book Now
      </button>

      <div className="upcoming-events">
        <h2>Upcoming Events</h2>
        <p>No upcoming events this week.</p>
      </div>
    </div>
  );
}
