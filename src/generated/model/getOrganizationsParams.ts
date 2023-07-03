/**
 * Generated by orval v6.16.0 🍺
 * Do not edit manually.
 * Frikanalen API
 * RESTful API for consuming and interacting with Frikanalen
 * OpenAPI spec version: 2.0.0
 */
import type { OffsetParameter } from "./offsetParameter"
import type { LimitParameter } from "./limitParameter"

export type GetOrganizationsParams = {
  /**
   * Number of rows to skip
   */
  offset?: OffsetParameter
  /**
   * Number of rows to return
   */
  limit?: LimitParameter
  /**
   * An id of the editor (user) to filter by
   */
  editor?: number
}