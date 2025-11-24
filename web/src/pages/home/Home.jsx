import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { featuredEvent } from "@/data/events";
import "./Home.css";

export default function Home() {
  // `useAuth` exposes `user`, not `currentUser`
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBookNow = () => {
    if (user) {
      // Logged-in users go directly to the room booking page
      navigate("/request");
    } else {
      // Not logged-in users are taken to the login page first
      navigate("/login");
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
        {featuredEvent ? (
          <div className="upcoming-event-card">
            <div className="upcoming-event-label">Next event</div>
            <h3 className="upcoming-event-title">{featuredEvent.title}</h3>
            <p className="upcoming-event-meta">
              {featuredEvent.date} · {featuredEvent.time}
            </p>
            <p className="upcoming-event-location">{featuredEvent.location}</p>
            <p className="upcoming-event-description">{featuredEvent.description}</p>
          </div>
        ) : (
          <p>No upcoming events this week.</p>
        )}
      </div>
    </div>
  );
}
