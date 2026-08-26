/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GoNomadik Analytics Client Utility
 *
 * Provides:
 *  - GA4 initialization (optional, via VITE_GA_MEASUREMENT_ID)
 *  - UTM parameter capture & persistence
 *  - Anonymous session ID management
 *  - Device/browser detection
 *  - PII-safe event tracking (allowlist approach)
 *  - Dual dispatch: GA4 gtag + Supabase via /api/analytics/track
 *
 * CRITICAL: This module is completely non-blocking.
 * If anything fails, the website continues working normally.
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface UtmParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
}

export interface DeviceInfo {
  deviceCategory: string;
  browser: string;
  os: string;
  screenSize: string;
}

// ─── Allowlisted analytics parameter keys ───────────────────────────
// Only these keys are permitted in event params sent to GA4 / server.
const ALLOWED_PARAM_KEYS = new Set([
  // Content identifiers
  "journey_slug",
  "journey_name",
  "destination_slug",
  "destination_name",
  "departure_id",
  "package_slug",
  // Booking funnel (non-PII)
  "room_type",
  "addon_count",
  "coupon_code",
  "success",
  "amount",
  "booking_id",
  "traveller_count",
  "payment_type",
  "reason",
  // Interaction metadata
  "source",
  "cta_type",
  "cta_label",
  "section",
  "destination",
  // Campaign
  "campaign",
  "medium",
  "content",
  "term",
  // Page
  "path",
  "page_title",
  // Generic
  "label",
  "value",
  "category",
  "step",
]);

// ─── Storage keys ───────────────────────────────────────────────────
const UTM_STORAGE_KEY = "nomadik_utm";
const SESSION_ID_KEY = "nomadik_session_id";

// ─── State ──────────────────────────────────────────────────────────
let ga4Initialized = false;

// ─── GA4 Initialization ─────────────────────────────────────────────

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * Initialize Google Analytics 4.
 * Only injects the script if a measurement ID is provided.
 * Completely safe to call multiple times or without an ID.
 */
export function initGA4(measurementId?: string): void {
  try {
    if (!measurementId || typeof window === "undefined" || ga4Initialized) return;

    // Inject gtag.js script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false, // We manage page views manually
    });

    ga4Initialized = true;
  } catch {
    // Silent failure — analytics must never break the site
  }
}

// ─── UTM Parameter Capture ──────────────────────────────────────────

/**
 * Parse UTM parameters from the current URL and store as first-touch attribution.
 * Only captures on first visit (doesn't overwrite existing UTM data in the session).
 */
export function captureUtmParams(): UtmParams {
  const empty: UtmParams = {
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
  };

  try {
    if (typeof window === "undefined") return empty;

    // Check if we already have UTM params stored for this session
    const existing = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (existing) {
      try {
        return JSON.parse(existing) as UtmParams;
      } catch {
        // Corrupted storage, re-capture
      }
    }

    // Parse from URL
    const params = new URLSearchParams(window.location.search);
    const utm: UtmParams = {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_content: params.get("utm_content") || "",
      utm_term: params.get("utm_term") || "",
    };

    // Store if any UTM param is present
    const hasUtm = Object.values(utm).some((v) => v.length > 0);
    if (hasUtm) {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
      // Also store in localStorage for cross-session attribution persistence
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
    }

    return utm;
  } catch {
    return empty;
  }
}

/**
 * Get the current UTM params (from sessionStorage or localStorage).
 */
export function getUtmParams(): UtmParams {
  const empty: UtmParams = {
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
  };

  try {
    if (typeof window === "undefined") return empty;

    const session = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (session) {
      try {
        return JSON.parse(session) as UtmParams;
      } catch {
        /* ignore */
      }
    }

    const local = localStorage.getItem(UTM_STORAGE_KEY);
    if (local) {
      try {
        return JSON.parse(local) as UtmParams;
      } catch {
        /* ignore */
      }
    }

    return empty;
  } catch {
    return empty;
  }
}

// ─── Session ID ─────────────────────────────────────────────────────

/**
 * Get or create an anonymous session ID.
 * Persists for the browser session (sessionStorage).
 */
export function getSessionId(): string {
  try {
    if (typeof window === "undefined") return "ssr";

    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return `s_${Date.now()}`;
  }
}

// ─── Device Detection ───────────────────────────────────────────────

/**
 * Detect device category, browser, OS, and screen size from user agent.
 */
export function getDeviceInfo(): DeviceInfo {
  const fallback: DeviceInfo = {
    deviceCategory: "Desktop",
    browser: "Unknown",
    os: "Unknown",
    screenSize: "",
  };

  try {
    if (typeof window === "undefined" || typeof navigator === "undefined") return fallback;

    const ua = navigator.userAgent || "";
    const w = window.innerWidth || 0;

    // Device category
    let deviceCategory = "Desktop";
    if (/Mobi|Android.*Mobile|iPhone|iPod/i.test(ua)) {
      deviceCategory = "Mobile";
    } else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua) || (w >= 600 && w < 1024)) {
      deviceCategory = "Tablet";
    }

    // Browser detection
    let browser = "Other";
    if (/Edg\//i.test(ua)) browser = "Edge";
    else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = "Opera";
    else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
    else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
    else if (/Firefox\//i.test(ua)) browser = "Firefox";

    // OS detection
    let os = "Other";
    if (/Windows/i.test(ua)) os = "Windows";
    else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
    else if (/Mac OS/i.test(ua)) os = "macOS";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/Linux/i.test(ua)) os = "Linux";
    else if (/CrOS/i.test(ua)) os = "ChromeOS";

    // Screen size
    const screenSize =
      window.screen ? `${window.screen.width}x${window.screen.height}` : `${w}x${window.innerHeight}`;

    return { deviceCategory, browser, os, screenSize };
  } catch {
    return fallback;
  }
}

// ─── PII Sanitization (Allowlist) ───────────────────────────────────

/**
 * Sanitize event parameters using an ALLOWLIST approach.
 * Only keys in ALLOWED_PARAM_KEYS are kept. Everything else is dropped.
 */
export function sanitizeParams(params?: Record<string, any>): Record<string, any> {
  if (!params || typeof params !== "object") return {};

  const sanitized: Record<string, any> = {};
  for (const key of Object.keys(params)) {
    if (ALLOWED_PARAM_KEYS.has(key)) {
      const val = params[key];
      // Only allow primitive values (string, number, boolean)
      if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
        sanitized[key] = val;
      }
    }
  }
  return sanitized;
}

// ─── Event Tracking ─────────────────────────────────────────────────

/**
 * Track an analytics event.
 *
 * 1. Sends to GA4 via window.gtag (if initialized)
 * 2. Sends to /api/analytics/track via sendBeacon (fire-and-forget)
 *
 * NEVER blocks the UI. NEVER throws. NEVER breaks the site.
 */
export function trackEvent(eventName: string, params?: Record<string, any>): void {
  try {
    if (typeof window === "undefined") return;

    const safe = sanitizeParams(params);
    const utm = getUtmParams();
    const device = getDeviceInfo();
    const sessionId = getSessionId();
    const path = window.location.pathname;

    // 1. Dispatch to GA4
    if (ga4Initialized && window.gtag) {
      try {
        window.gtag("event", eventName, {
          ...safe,
          page_path: path,
        });
      } catch {
        // GA4 failure is non-fatal
      }
    }

    // 2. Send to server via sendBeacon (fire-and-forget)
    const payload = JSON.stringify({
      event_name: eventName,
      path,
      params: safe,
      session_id: sessionId,
      device_category: device.deviceCategory,
      browser: device.browser,
      os: device.os,
      screen_size: device.screenSize,
      utm_source: utm.utm_source || undefined,
      utm_medium: utm.utm_medium || undefined,
      utm_campaign: utm.utm_campaign || undefined,
      utm_content: utm.utm_content || undefined,
      utm_term: utm.utm_term || undefined,
      referrer: document.referrer || undefined,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/track", new Blob([payload], { type: "application/json" }));
    } else {
      // Fallback for older browsers
      fetch("/api/analytics/track", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {
        /* silent */
      });
    }
  } catch {
    // Analytics must NEVER break the website
  }
}

/**
 * Track a page view event.
 */
export function trackPageView(path?: string): void {
  trackEvent("page_view", { path: path || (typeof window !== "undefined" ? window.location.pathname : "/") });
}

// ─── Booking Attribution Helper ─────────────────────────────────────

/**
 * Get attribution data to persist with a booking.
 * Returns the UTM params + session ID + referrer + device category.
 */
export function getBookingAttribution(): {
  session_id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  referrer: string;
  device_category: string;
} {
  try {
    const utm = getUtmParams();
    const device = getDeviceInfo();
    return {
      session_id: getSessionId(),
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content,
      utm_term: utm.utm_term,
      referrer: typeof document !== "undefined" ? document.referrer || "" : "",
      device_category: device.deviceCategory,
    };
  } catch {
    return {
      session_id: "",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_content: "",
      utm_term: "",
      referrer: "",
      device_category: "",
    };
  }
}
