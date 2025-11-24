import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { campusEvents, featuredEvent } from "@/data/events";

const sortedEvents = [...campusEvents].sort((a, b) => new Date(a.date) - new Date(b.date));

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });

const requestUrl = (event) => {
  const params = new URLSearchParams();
  if (event.roomId) params.set("roomId", event.roomId);
  if (event.date) params.set("date", event.date);
  if (event.startSlot != null) params.set("startSlot", event.startSlot);
  if (event.endSlot != null) params.set("endSlot", event.endSlot);
  if (event.notesHint) params.set("notes", event.notesHint);
  const query = params.toString();
  return query ? `/request?${query}` : "/request";
};

export default function Events() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#events-calendar") {
      const target = document.getElementById("events-calendar");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location.hash]);

  const handleReserve = (event) => {
    navigate(requestUrl(event));
  };

  const handleShare = async (event) => {
    const eventUrl = `${window.location.origin}/events#events-calendar`;
    const shareText = `Check out this event: ${event.title} on ${event.date} at ${event.location}. ${event.description}`;
    
    const shareData = {
      title: event.title,
      text: shareText,
      url: eventUrl,
    };

    // Try Web Share API first (mobile/desktop browsers that support it)
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or error occurred, fall back to clipboard
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${eventUrl}`);
      // Show a temporary success message
      const button = document.activeElement;
      const originalText = button.textContent;
      button.textContent = '✓ Copied!';
      button.style.background = '#4ade80';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert(`Share this event:\n\n${shareText}\n\n${eventUrl}`);
    }
  };

  return (
    <section className="student-section" id="events-calendar">
      <div className="events-grid">
        <aside className="events-calendar">
          <p className="events-calendar-label">Events Calendar</p>
          <h2 style={{ marginBottom: "0.4rem" }}>Golden Hawk Happenings</h2>
          <p style={{ color: "#5f5976", marginTop: 0 }}>
            Everything from funding labs to social programming, curated for clubs and student leaders.
          </p>

          <ul className="event-calendar-list">
            {sortedEvents.map((event) => (
              <li key={event.id}>
                <div className="event-date-block">
                  <span>{formatDate(event.date)}</span>
                  <small>{event.time}</small>
                </div>
                <div>
                  <div className="event-title">{event.title}</div>
                  <div className="event-location">{event.location}</div>
                </div>
              </li>
            ))}
          </ul>

          <a
            className="primary-btn"
            style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem", alignSelf: "start" }}
            href="https://events.dudesolutions.com/wlu/"
            target="_blank"
            rel="noreferrer"
          >
            Full Events Calendar
          </a>
        </aside>

        <div className="events-feature">
          <div className="event-card highlight">
            <div className="chip">{featuredEvent?.tags?.[0] || "Featured"}</div>
            <h3>{featuredEvent.title}</h3>
            <p>{featuredEvent.description}</p>
            <dl>
              <div>
                <dt>Date & Time</dt>
                <dd>
                  {featuredEvent.date} · {featuredEvent.time}
                </dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{featuredEvent.location}</dd>
              </div>
            </dl>
            <div className="hero-actions" style={{ paddingTop: "0.4rem" }}>
              <button type="button" className="primary-btn" onClick={() => handleReserve(featuredEvent)}>
                Reserve this space
              </button>
              <button type="button" className="secondary-btn light" onClick={() => handleShare(featuredEvent)}>
                Share with my club
              </button>
            </div>
          </div>

          <div className="events-upcoming">
            <header>
              <div>
                <div className="chip">Upcoming Events</div>
                <h3>Built for campus energy</h3>
              </div>
              <button type="button" className="secondary-btn">
                Submit event idea
              </button>
            </header>

            <div className="upcoming-grid">
              {sortedEvents.map((event) => (
                <article key={`upcoming-${event.id}`} className="event-card">
                  <span className="event-date-pill">{formatDate(event.date)}</span>
                  <h4>{event.title}</h4>
                  <p>{event.description}</p>
                  <div className="event-meta">
                    <span>{event.time}</span>
                    <span>{event.location}</span>
                  </div>
                  <div className="event-tags">
                    {event.tags?.map((tag) => (
                      <span key={tag}>{tag}</span>
                    )) || <span>Laurier Life</span>}
                  </div>
                  <button
                    type="button"
                    className="primary-btn"
                    style={{ marginTop: "0.6rem", width: "100%" }}
                    onClick={() => handleReserve(event)}
                  >
                    Reserve this space
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
