import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

// Send metrics to analytics
function sendToAnalytics(metric: Metric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric);
  }

  // Send to Google Analytics if available
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Send to custom analytics endpoint if needed
  // fetch('/api/analytics', {
  //   method: 'POST',
  //   body: JSON.stringify(metric),
  //   headers: { 'Content-Type': 'application/json' },
  // });
}

// Initialize performance monitoring
export function initPerformanceMonitoring() {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

// Performance marks for custom measurements
export const performanceMark = {
  start: (name: string) => {
    if (performance.mark) {
      performance.mark(`${name}-start`);
    }
  },
  end: (name: string) => {
    if (performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = performance.getEntriesByName(name)[0];
        console.log(`[Performance] ${name}:`, Math.round(measure.duration), 'ms');
      } catch (e) {
        // Ignore errors if marks don't exist
      }
    }
  },
};

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}