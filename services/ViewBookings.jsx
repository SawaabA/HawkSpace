import data from "../data/bookings.json";

export default function ViewBookings() {
  const now = new Date();

  const upcoming = data.filter(
    (b) => new Date(b.start) >= now
  );
  const past = data.filter(
    (b) => new Date(b.start) < now
  );

  return (
    <div>
      <h2>Upcoming Bookings</h2>
      {upcoming.length ? (
        upcoming.map((b) => (
          <div key={b.id}>
            <strong>{b.title}</strong> – {b.room} – {new Date(b.start).toLocaleString()}
          </div>
        ))
      ) : (
        <p>No upcoming bookings.</p>
      )}

      <h2 style={{ marginTop: 16 }}>Past Bookings</h2>
      {past.length ? (
        past.map((b) => (
          <div key={b.id}>
            <strong>{b.title}</strong> – {b.room} – {new Date(b.start).toLocaleString()}
          </div>
        ))
      ) : (
        <p>No past bookings.</p>
      )}
    </div>
  );
}
