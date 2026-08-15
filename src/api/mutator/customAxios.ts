import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

// Generated API functions get called both from the browser (client
// components/hooks) and from Node during SSR (Server Components call them
// directly, not just via hooks). In the browser a relative baseURL resolves
// against the page's own origin, which the ingress routes to the matching
// backend - but Node's fetch/axios can't resolve a relative URL at all, so
// the server needs an absolute one from DJANGO_URL instead.
const baseURL =
  typeof window === "undefined" ? (process.env.DJANGO_URL ?? "http://localhost:8000/") : "";

export const AXIOS_INSTANCE = Axios.create({
  baseURL,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "x-csrftoken",
  withXSRFToken: true,
  withCredentials: true,
});

export const customAxios = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => {
  const source = Axios.CancelToken.source();

  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  });

  // @ts-expect-error not sure why this is necessary
  promise.cancel = () => {
    source.cancel("Query was cancelled");
  };

  return promise;
};

// In some case with react-query and swr you want to be able to override the return error type so you can also do it here like this

export type ErrorType<Error> = AxiosError<Error>;

export type BodyType<BodyData> = BodyData;
