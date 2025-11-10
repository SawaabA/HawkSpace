let analyticsPromise = null;

export function getAnalyticsInstance() {
  if (!analyticsPromise) {
    const hasWindow = typeof window !== "undefined";
    const hasMeasurement = !!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
    
    if (hasWindow && hasMeasurement) {
      analyticsPromise = import("firebase/analytics")
        .then(({ getAnalytics, isSupported }) => 
          import("./firebase").then((firebaseModule) => 
            isSupported().then((supported) => 
              supported ? getAnalytics(firebaseModule.default) : null
            )
          )
        )
        .catch((err) => {
          console.warn("Firebase Analytics failed to load:", err);
          return null;
        });
    } else {
      analyticsPromise = Promise.resolve(null);
    }
  }
  return analyticsPromise;
}


