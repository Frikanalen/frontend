// Server-only: DJANGO_URL is a plain (non NEXT_PUBLIC_) env var, so it's
// read at request time in the pod rather than inlined into the JS bundle at
// build time. This lets the same image serve staging and production.
export const serverFetch = async <T,>(url: string, options?: RequestInit): Promise<T> => {
  const djangoUrl = process.env.DJANGO_URL ?? "http://localhost:8000/";

  const res = await fetch(new URL(url, djangoUrl), options);
  const body = [204, 205, 304].includes(res.status) ? null : await res.text();
  const data = body ? JSON.parse(body) : {};

  return { data, status: res.status, headers: res.headers } as T;
};
