import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const BookingContext = createContext(null);

export function useBookings() {
  return useContext(BookingContext);
}

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState(() => {
    try {
      const raw = localStorage.getItem("hawkspace_bookings");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("hawkspace_bookings", JSON.stringify(bookings));
  }, [bookings]);

  const addBooking = (b) => setBookings((prev) => [...prev, b]);
  const cancelBooking = (id) => setBookings((prev) => prev.filter((x) => x.id !== id));

  const value = useMemo(() => ({ bookings, addBooking, cancelBooking }), [bookings]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}
