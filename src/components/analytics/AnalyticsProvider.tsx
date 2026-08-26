/**
 * AnalyticsProvider — Global analytics initialization component.
 *
 * Mount once in __root.tsx. Handles:
 * - GA4 initialization (if VITE_GA_MEASUREMENT_ID is set)
 * - UTM parameter capture on first visit
 * - Automatic page_view tracking on route changes
 * - campaign_visit event if UTM params are present
 *
 * Renders nothing (invisible wrapper). NEVER blocks rendering.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { initGA4, captureUtmParams, trackPageView, trackEvent, getUtmParams } from "@/lib/analytics";

export function AnalyticsProvider() {
  const router = useRouter();
  const initialized = useRef(false);

  // Initialize analytics on first mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      // 1. Initialize GA4 if measurement ID is configured
      const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
      if (measurementId) {
        initGA4(measurementId);
      }

      // 2. Capture UTM parameters from URL
      const utm = captureUtmParams();

      // 3. Track initial page view
      trackPageView();

      // 4. If UTM params exist, track campaign visit
      const hasUtm = utm.utm_source || utm.utm_medium || utm.utm_campaign;
      if (hasUtm) {
        trackEvent("campaign_visit", {
          campaign: utm.utm_campaign,
          medium: utm.utm_medium,
          source: utm.utm_source,
          content: utm.utm_content,
          term: utm.utm_term,
        });
      }
    } catch {
      // Analytics initialization failure must never break the app
    }
  }, []);

  // Track page views on route changes
  useEffect(() => {
    try {
      const unsubscribe = router.subscribe("onResolved", () => {
        try {
          trackPageView();
        } catch {
          /* silent */
        }
      });
      return unsubscribe;
    } catch {
      // Router subscription failure is non-fatal
      return undefined;
    }
  }, [router]);

  return null;
}
