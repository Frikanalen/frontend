/**
 * Generated by orval v6.16.0 🍺
 * Do not edit manually.
 * Frikanalen API
 * RESTful API for consuming and interacting with Frikanalen
 * OpenAPI spec version: 2.0.0
 */
import type { Video } from "./video"

export interface ScheduleEntry {
  type: string
  startsAt: Date
  endsAt: Date
  video: Video
}
