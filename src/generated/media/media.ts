/**
 * Generated by orval v6.16.0 🍺
 * Do not edit manually.
 * Frikanalen API
 * RESTful API for consuming and interacting with Frikanalen
 * OpenAPI spec version: 2.0.0
 */
import { useMutation } from "@tanstack/react-query"
import type { UseMutationOptions, MutationFunction } from "@tanstack/react-query"
import type { PostVideosMedia201, VideoMediaForm, PostVideosMediaIdAssets201, VideoMediaAssetForm } from ".././model"
import { axiosInstance } from "../../modules/orval/fk-api-axios"
import type { ErrorType } from "../../modules/orval/fk-api-axios"

type AwaitedInput<T> = PromiseLike<T> | T

type Awaited<O> = O extends AwaitedInput<infer T> ? T : never

// eslint-disable-next-line
type SecondParameter<T extends (...args: any) => any> = T extends (config: any, args: infer P) => any ? P : never

/**
 * @summary (Used by media-processor) Register an uploaded file in the database
 */
export const postVideosMedia = (videoMediaForm: VideoMediaForm, options?: SecondParameter<typeof axiosInstance>) => {
  return axiosInstance<PostVideosMedia201>(
    { url: `/videos/media`, method: "post", headers: { "Content-Type": "application/json" }, data: videoMediaForm },
    options,
  )
}

export const getPostVideosMediaMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<Awaited<ReturnType<typeof postVideosMedia>>, TError, { data: VideoMediaForm }, TContext>
  request?: SecondParameter<typeof axiosInstance>
}): UseMutationOptions<Awaited<ReturnType<typeof postVideosMedia>>, TError, { data: VideoMediaForm }, TContext> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {}

  const mutationFn: MutationFunction<Awaited<ReturnType<typeof postVideosMedia>>, { data: VideoMediaForm }> = (
    props,
  ) => {
    const { data } = props ?? {}

    return postVideosMedia(data, requestOptions)
  }

  return { mutationFn, ...mutationOptions }
}

export type PostVideosMediaMutationResult = NonNullable<Awaited<ReturnType<typeof postVideosMedia>>>
export type PostVideosMediaMutationBody = VideoMediaForm
export type PostVideosMediaMutationError = ErrorType<unknown>

/**
 * @summary (Used by media-processor) Register an uploaded file in the database
 */
export const usePostVideosMedia = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<Awaited<ReturnType<typeof postVideosMedia>>, TError, { data: VideoMediaForm }, TContext>
  request?: SecondParameter<typeof axiosInstance>
}) => {
  const mutationOptions = getPostVideosMediaMutationOptions(options)

  return useMutation(mutationOptions)
}
/**
 * @summary (Used by media-processor) Register a new video media asset
 */
export const postVideosMediaIdAssets = (
  id: number,
  videoMediaAssetForm: VideoMediaAssetForm,
  options?: SecondParameter<typeof axiosInstance>,
) => {
  return axiosInstance<PostVideosMediaIdAssets201>(
    {
      url: `/videos/media/${id}/assets`,
      method: "post",
      headers: { "Content-Type": "application/json" },
      data: videoMediaAssetForm,
    },
    options,
  )
}

export const getPostVideosMediaIdAssetsMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof postVideosMediaIdAssets>>,
    TError,
    { id: number; data: VideoMediaAssetForm },
    TContext
  >
  request?: SecondParameter<typeof axiosInstance>
}): UseMutationOptions<
  Awaited<ReturnType<typeof postVideosMediaIdAssets>>,
  TError,
  { id: number; data: VideoMediaAssetForm },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {}

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof postVideosMediaIdAssets>>,
    { id: number; data: VideoMediaAssetForm }
  > = (props) => {
    const { id, data } = props ?? {}

    return postVideosMediaIdAssets(id, data, requestOptions)
  }

  return { mutationFn, ...mutationOptions }
}

export type PostVideosMediaIdAssetsMutationResult = NonNullable<Awaited<ReturnType<typeof postVideosMediaIdAssets>>>
export type PostVideosMediaIdAssetsMutationBody = VideoMediaAssetForm
export type PostVideosMediaIdAssetsMutationError = ErrorType<unknown>

/**
 * @summary (Used by media-processor) Register a new video media asset
 */
export const usePostVideosMediaIdAssets = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof postVideosMediaIdAssets>>,
    TError,
    { id: number; data: VideoMediaAssetForm },
    TContext
  >
  request?: SecondParameter<typeof axiosInstance>
}) => {
  const mutationOptions = getPostVideosMediaIdAssetsMutationOptions(options)

  return useMutation(mutationOptions)
}
