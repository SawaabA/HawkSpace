import app from "./firebase";
import { getAnalytics, isSupported } from "firebase/analytics";

let analyticsPromise = null;

export function getAnalyticsInstance() {
  if (!analyticsPromise) {
    const hasWindow = typeof window !== "undefined";
    const hasMeasurement = !!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
    if (hasWindow && hasMeasurement) {
      analyticsPromise = isSupported()
        .then((supported) => (supported ? getAnalytics(app) : null))
        .catch(() => null);
    } else {
      analyticsPromise = Promise.resolve(null);
    }
  }
  return analyticsPromise;
}


