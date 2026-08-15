import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

// Relative baseURL: this runs in the browser, so requests go to the same
// origin the page was served from (staging or production), which the
// ingress already routes to the matching Django backend under /api.
export const AXIOS_INSTANCE = Axios.create({
  baseURL: "",
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
