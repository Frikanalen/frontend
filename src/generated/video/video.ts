/**
 * Generated by orval v6.16.0 🍺
 * Do not edit manually.
 * Frikanalen API
 * RESTful API for consuming and interacting with Frikanalen
 * OpenAPI spec version: 2.0.0
 */
import { useQuery, useMutation } from "@tanstack/react-query"
import type {
  UseQueryOptions,
  UseMutationOptions,
  QueryFunction,
  MutationFunction,
  UseQueryResult,
  QueryKey,
} from "@tanstack/react-query"
import type { Video, NewVideoForm, GetVideos200, GetVideosParams, ResourceNotFoundResponse } from ".././model"
import { axiosInstance } from "../../modules/orval/fk-api-axios"
import type { ErrorType } from "../../modules/orval/fk-api-axios"

type AwaitedInput<T> = PromiseLike<T> | T

type Awaited<O> = O extends AwaitedInput<infer T> ? T : never

// eslint-disable-next-line
type SecondParameter<T extends (...args: any) => any> = T extends (config: any, args: infer P) => any ? P : never

/**
 * @summary Create a new video for an organization
 */
export const newVideo = (
  orgId: number,
  newVideoForm: NewVideoForm,
  options?: SecondParameter<typeof axiosInstance>
) => {
  return axiosInstance<Video>(
    {
      url: `/organizations/${orgId}/videos`,
      method: "post",
      headers: { "Content-Type": "application/json" },
      data: newVideoForm,
    },
    options
  )
}

export const getNewVideoMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof newVideo>>,
    TError,
    { orgId: number; data: NewVideoForm },
    TContext
  >
  request?: SecondParameter<typeof axiosInstance>
}): UseMutationOptions<
  Awaited<ReturnType<typeof newVideo>>,
  TError,
  { orgId: number; data: NewVideoForm },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {}

  const mutationFn: MutationFunction<Awaited<ReturnType<typeof newVideo>>, { orgId: number; data: NewVideoForm }> = (
    props
  ) => {
    const { orgId, data } = props ?? {}

    return newVideo(orgId, data, requestOptions)
  }

  return { mutationFn, ...mutationOptions }
}

export type NewVideoMutationResult = NonNullable<Awaited<ReturnType<typeof newVideo>>>
export type NewVideoMutationBody = NewVideoForm
export type NewVideoMutationError = ErrorType<unknown>

/**
 * @summary Create a new video for an organization
 */
export const useNewVideo = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof newVideo>>,
    TError,
    { orgId: number; data: NewVideoForm },
    TContext
  >
  request?: SecondParameter<typeof axiosInstance>
}) => {
  const mutationOptions = getNewVideoMutationOptions(options)

  return useMutation(mutationOptions)
}
/**
 * @summary Get a list of videos
 */
export const getVideos = (
  params?: GetVideosParams,
  options?: SecondParameter<typeof axiosInstance>,
  signal?: AbortSignal
) => {
  return axiosInstance<GetVideos200>({ url: `/videos`, method: "get", params, signal }, options)
}

export const getGetVideosQueryKey = (params?: GetVideosParams) => [`/videos`, ...(params ? [params] : [])] as const

export const getGetVideosQueryOptions = <TData = Awaited<ReturnType<typeof getVideos>>, TError = ErrorType<unknown>>(
  params?: GetVideosParams,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getVideos>>, TError, TData>
    request?: SecondParameter<typeof axiosInstance>
  }
): UseQueryOptions<Awaited<ReturnType<typeof getVideos>>, TError, TData> & { queryKey: QueryKey } => {
  const { query: queryOptions, request: requestOptions } = options ?? {}

  const queryKey = queryOptions?.queryKey ?? getGetVideosQueryKey(params)

  const queryFn: QueryFunction<Awaited<ReturnType<typeof getVideos>>> = ({ signal }) =>
    getVideos(params, requestOptions, signal)

  return { queryKey, queryFn, ...queryOptions }
}

export type GetVideosQueryResult = NonNullable<Awaited<ReturnType<typeof getVideos>>>
export type GetVideosQueryError = ErrorType<unknown>

/**
 * @summary Get a list of videos
 */
export const useGetVideos = <TData = Awaited<ReturnType<typeof getVideos>>, TError = ErrorType<unknown>>(
  params?: GetVideosParams,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getVideos>>, TError, TData>
    request?: SecondParameter<typeof axiosInstance>
  }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getGetVideosQueryOptions(params, options)

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryOptions.queryKey

  return query
}

/**
 * @summary Get a specific video by id
 */
export const getVideosId = (id: number, options?: SecondParameter<typeof axiosInstance>, signal?: AbortSignal) => {
  return axiosInstance<Video>({ url: `/videos/${id}`, method: "get", signal }, options)
}

export const getGetVideosIdQueryKey = (id: number) => [`/videos/${id}`] as const

export const getGetVideosIdQueryOptions = <
  TData = Awaited<ReturnType<typeof getVideosId>>,
  TError = ErrorType<ResourceNotFoundResponse>
>(
  id: number,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getVideosId>>, TError, TData>
    request?: SecondParameter<typeof axiosInstance>
  }
): UseQueryOptions<Awaited<ReturnType<typeof getVideosId>>, TError, TData> & { queryKey: QueryKey } => {
  const { query: queryOptions, request: requestOptions } = options ?? {}

  const queryKey = queryOptions?.queryKey ?? getGetVideosIdQueryKey(id)

  const queryFn: QueryFunction<Awaited<ReturnType<typeof getVideosId>>> = ({ signal }) =>
    getVideosId(id, requestOptions, signal)

  return { queryKey, queryFn, enabled: !!id, ...queryOptions }
}

export type GetVideosIdQueryResult = NonNullable<Awaited<ReturnType<typeof getVideosId>>>
export type GetVideosIdQueryError = ErrorType<ResourceNotFoundResponse>

/**
 * @summary Get a specific video by id
 */
export const useGetVideosId = <
  TData = Awaited<ReturnType<typeof getVideosId>>,
  TError = ErrorType<ResourceNotFoundResponse>
>(
  id: number,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getVideosId>>, TError, TData>
    request?: SecondParameter<typeof axiosInstance>
  }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getGetVideosIdQueryOptions(id, options)

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryOptions.queryKey

  return query
}