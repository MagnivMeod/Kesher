import type { TrackingInfo } from "../types";

/**
 * A shipment tracking service (17TRACK, AfterShip, ...). Swappable: only this
 * interface is used by the brain.
 */
export interface TrackingProvider {
  /** Returns undefined when the carrier has no data for this number. */
  track(carrier: string | undefined, trackingNumber: string): Promise<TrackingInfo | undefined>;
}
