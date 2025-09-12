// Request throttling utility to prevent excessive API calls

class RequestThrottle {
  constructor() {
    this.requestQueue = new Map();
    this.defaultDelay = 1000; // 1 second default delay
  }

  // Throttle requests by key (e.g., endpoint, user action)
  throttle(key, delay = this.defaultDelay) {
    return new Promise((resolve) => {
      const now = Date.now();
      const lastRequest = this.requestQueue.get(key) || 0;
      const timeSinceLastRequest = now - lastRequest;

      if (timeSinceLastRequest >= delay) {
        // Enough time has passed, execute immediately
        this.requestQueue.set(key, now);
        resolve();
      } else {
        // Wait for the remaining time
        const waitTime = delay - timeSinceLastRequest;
        setTimeout(() => {
          this.requestQueue.set(key, Date.now());
          resolve();
        }, waitTime);
      }
    });
  }

  // Clear throttle for a specific key
  clear(key) {
    this.requestQueue.delete(key);
  }

  // Clear all throttles
  clearAll() {
    this.requestQueue.clear();
  }
}

// Create a singleton instance
const requestThrottle = new RequestThrottle();

export default requestThrottle;
