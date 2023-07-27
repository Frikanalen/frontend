import Axios, { AxiosError, AxiosRequestConfig } from "axios"
import getConfig from "next/config"

const { publicRuntimeConfig } = getConfig()

export const AXIOS_INSTANCE = Axios.create({
  baseURL: publicRuntimeConfig.FK_API,
  xsrfCookieName: "fk-csrf",
  xsrfHeaderName: "X-CSRF-TOKEN",
  withCredentials: true,
  headers: { Accept: "application/json, text/plain, */*" },
})

export const axiosInstance = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
  const source = Axios.CancelToken.source()
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data)

  // @ts-ignore
  promise.cancel = () => {
    source.cancel("Query was cancelled")
  }

  return promise
}

export type ErrorType<Error> = AxiosError<Error>
