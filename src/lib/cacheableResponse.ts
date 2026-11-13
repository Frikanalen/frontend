/** A generated SSR response without its `headers`, keeping the status/data union. */
export type CacheableResponse<R> = R extends unknown ? Omit<R, "headers"> : never;

/**
 * Strips the `Headers` object from a generated SSR response, so that it can
 * be returned from a "use cache" function: `Headers` can't be serialized
 * into the cache, and no caller reads them.
 */
export const cacheableResponse = <R extends { headers: Headers }>({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  headers: _headers,
  ...rest
}: R): CacheableResponse<R> => rest as CacheableResponse<R>;
