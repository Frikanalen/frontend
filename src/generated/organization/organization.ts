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
import type {
  GetOrganizations200,
  GetOrganizationsParams,
  Organization,
  NewOrganizationForm,
  ResourceNotFoundResponse,
  Video,
  NewVideoForm,
  Playlist,
  NewPlaylistForm,
  GetOrganizationsIdMembers200,
  AuthenticationRequiredResponse,
  PermissionDeniedResponse,
  PostOrganizationsIdMembers404,
  PostOrganizationsIdMembersBody,
} from ".././model"
import { axiosInstance } from "../../modules/orval/fk-api-axios"
import type { ErrorType } from "../../modules/orval/fk-api-axios"

type AwaitedInput<T> = PromiseLike<T> | T

type Awaited<O> = O extends AwaitedInput<infer T> ? T : never

// eslint-disable-next-line
type SecondParameter<T extends (...args: any) => any> = T extends (config: any, args: infer P) => any ? P : never

/**
 * @summary Get a list of organizations
 */
export const getOrganizations = (
  params?: GetOrganizationsParams,
  options?: SecondParameter<typeof axiosInstance>,
  signal?: AbortSignal
) => {
  return axiosInstance<GetOrganizations200>({ url: `/organizations`, method: "get", params, signal }, options)
}

export const getGetOrganizationsQueryKey = (params?: GetOrganizationsParams) =>
  [`/organizations`, ...(params ? [params] : [])] as const

export const getGetOrganizationsQueryOptions = <
  TData = Awaited<ReturnType<typeof getOrganizations>>,
  TError = ErrorType<unknown>
>(
  params?: GetOrganizationsParams,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOrganizations>>, TError, TData>
    request?: SecondParameter<typeof axiosInstance>
  }
): UseQueryOptions<Awaited<ReturnType<typeof getOrganizations>>, TError, TData> & { queryKey: QueryKey } => {
  const { query: queryOptions, request: requestOptions } = options ?? {}

  const queryKey = queryOptions?.queryKey ?? getGetOrganizationsQueryKey(params)

  const queryFn: QueryFunction<Awaited<ReturnType<typeof getOrganizations>>> = ({ signal }) =>
    getOrganizations(params, requestOptions, signal)

  return { queryKey, queryFn, ...queryOptions }
}

export type GetOrganizationsQueryResult = NonNullable<Awaited<ReturnType<typeof getOrganizations>>>
export type GetOrganizationsQueryError = ErrorType<unknown>

/**
 * @summary Get a list of organizations
 */
export const useGetOrganizations = <TData = Awaited<ReturnType<typeof getOrganizations>>, TError = ErrorType<unknown>>(
  params?: GetOrganizationsParams,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOrganizations>>, TError, TData>
    request?: SecondParameter<typeof axiosInstance>
  }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getGetOrganizationsQueryOptions(params, options)

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryOptions.queryKey

  return query
}

/**
 * @summary Create a new organization
 */
export const postOrganizations = (
  newOrganizationForm: NewOrganizationForm,
  options?: SecondParameter<typeof axiosInstance>
) => {
  return axiosInstance<Organization>(
    {
      url: `/organizations`,
      method: "post",
      headers: { "Content-Type": "application/json" },
      data: newOrganizationForm,
    },
    options
  )
}

export const getPostOrganizationsMutationOptions = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof postOrganizations>>,
    TError,
    { data: NewOrganizationForm },
    TContext
  >
  request?: SecondParameter<typeof axiosInstance>
}): UseMutationOptions<
  Awaited<ReturnType<typeof postOrganizations>>,
  TError,
  { data: NewOrganizationForm },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {}

  const mutationFn: MutationFunction<Awaited<ReturnType<typeof postOrganizations>>, { data: NewOrganizationForm }> = (
    props
  ) => {
    const { data } = props ?? {}

    return postOrganizations(data, requestOptions)
  }

  return { mutationFn, ...mutationOptions }
}

export type PostOrganizationsMutationResult = NonNullable<Awaited<ReturnType<typeof postOrganizations>>>
export type PostOrganizationsMutationBody = NewOrganizationForm
export type PostOrganizationsMutationError = ErrorType<unknown>

/**
 * @summary Create a new organization
 */
export const usePostOrganizations = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof postOrganizations>>,
    TError,
    { data: NewOrganizationForm },
    TContext
  >
  request?: SecondParameter<typeof axiosInstance>
}) => {
  const mutationOptions = getPostOrganizationsMutationOptions(options)

  return useMutation(mutationOptions)
}
/**
 * @summary Get a specific organization by id
 */
export const getOrganizationsId = (
  id: number,
  options?: SecondParameter<typeof axiosInstance>,
  signal?: AbortSignal
) => {
  return axiosInstance<Organization>({ url: `/organizations/${id}`, method: "get", signal }, options)
}

export const getGetOrganizationsIdQueryKey = (id: number) => [`/organizations/${id}`] as const

export const getGetOrganizationsIdQueryOptions = <
  TData = Awaited<ReturnType<typeof getOrganizationsId>>,
  TError = ErrorType<ResourceNotFoundResponse>
>(
  id: number,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOrganizationsId>>, TError, TData>
    request?: SecondParameter<typeof axiosInstance>
  }
): UseQueryOptions<Awaited<ReturnType<typeof getOrganizationsId>>, TError, TData> & { queryKey: QueryKey } => {
  const { query: queryOptions, request: requestOptions } = options ?? {}

  const queryKey = queryOptions?.queryKey ?? getGetOrganizationsIdQueryKey(id)

  const queryFn: QueryFunction<Awaited<ReturnType<typeof getOrganizationsId>>> = ({ signal }) =>
    getOrganizationsId(id, requestOptions, signal)

  return { queryKey, queryFn, enabled: !!id, ...queryOptions }
}

export type GetOrganizationsIdQueryResult = NonNullable<Awaited<ReturnType<typeof getOrganizationsId>>>
export type GetOrganizationsIdQueryError = ErrorType<ResourceNotFoundResponse>

/**
 * @summary Get a specific organization by id
 */
export const useGetOrganizationsId = <
  TData = Awaited<ReturnType<typeof getOrganizationsId>>,
  TError = ErrorType<ResourceNotFoundResponse>
>(
  id: number,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOrganizationsId>>, TError, TData>
    request?: SecondParameter<typeof axiosInstance>
  }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getGetOrganizationsIdQueryOptions(id, options)

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryOptions.queryKey

  return query
}

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
 * @summary Create a new playlist for an organization
 */
export const postOrganizationsIdPlaylists = (
  id: number,
  newPlaylistForm: NewPlaylistForm,
  options?: SecondParameter<typeof axiosInstance>
) => {
  return axiosInstance<Playlist>(
    {
      url: `/organizations/${id}/playlists`,
      method: "post",
      headers: { "Content-Type": "application/json" },
      data: newPlaylistForm,
    },
    options
  )
}

export const getPostOrganizationsIdPlaylistsMutationOptions = <
  TError = ErrorType<unknown>,
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof postOrganizationsIdPlaylists>>,
    TError,
    { id: number; data: NewPlaylistForm },
    TContext
  >
  request?: SecondParameter<typeof axiosInstance>
}): UseMutationOptions<
  Awaited<ReturnType<typeof postOrganizationsIdPlaylists>>,
  TError,
  { id: number; data: NewPlaylistForm },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {}

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof postOrganizationsIdPlaylists>>,
    { id: number; data: NewPlaylistForm }
  > = (props) => {
    const { id, data } = props ?? {}

    return postOrganizationsIdPlaylists(id, data, requestOptions)
  }

  return { mutationFn, ...mutationOptions }
}

export type PostOrganizationsIdPlaylistsMutationResult = NonNullable<
  Awaited<ReturnType<typeof postOrganizationsIdPlaylists>>
>
export type PostOrganizationsIdPlaylistsMutationBody = NewPlaylistForm
export type PostOrganizationsIdPlaylistsMutationError = ErrorType<unknown>

/**
 * @summary Create a new playlist for an organization
 */
export const usePostOrganizationsIdPlaylists = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof postOrganizationsIdPlaylists>>,
    TError,
    { id: number; data: NewPlaylistForm },
    TContext
  >
  request?: SecondParameter<typeof axiosInstance>
}) => {
  const mutationOptions = getPostOrganizationsIdPlaylistsMutationOptions(options)

  return useMutation(mutationOptions)
}
/**
 * @summary Get a list of members for an organization
 */
export const getOrganizationsIdMembers = (
  id: number,
  options?: SecondParameter<typeof axiosInstance>,
  signal?: AbortSignal
) => {
  return axiosInstance<GetOrganizationsIdMembers200>(
    { url: `/organizations/${id}/members`, method: "get", signal },
    options
  )
}

export const getGetOrganizationsIdMembersQueryKey = (id: number) => [`/organizations/${id}/members`] as const

export const getGetOrganizationsIdMembersQueryOptions = <
  TData = Awaited<ReturnType<typeof getOrganizationsIdMembers>>,
  TError = ErrorType<AuthenticationRequiredResponse | PermissionDeniedResponse | ResourceNotFoundResponse>
>(
  id: number,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOrganizationsIdMembers>>, TError, TData>
    request?: SecondParameter<typeof axiosInstance>
  }
): UseQueryOptions<Awaited<ReturnType<typeof getOrganizationsIdMembers>>, TError, TData> & { queryKey: QueryKey } => {
  const { query: queryOptions, request: requestOptions } = options ?? {}

  const queryKey = queryOptions?.queryKey ?? getGetOrganizationsIdMembersQueryKey(id)

  const queryFn: QueryFunction<Awaited<ReturnType<typeof getOrganizationsIdMembers>>> = ({ signal }) =>
    getOrganizationsIdMembers(id, requestOptions, signal)

  return { queryKey, queryFn, enabled: !!id, ...queryOptions }
}

export type GetOrganizationsIdMembersQueryResult = NonNullable<Awaited<ReturnType<typeof getOrganizationsIdMembers>>>
export type GetOrganizationsIdMembersQueryError = ErrorType<
  AuthenticationRequiredResponse | PermissionDeniedResponse | ResourceNotFoundResponse
>

/**
 * @summary Get a list of members for an organization
 */
export const useGetOrganizationsIdMembers = <
  TData = Awaited<ReturnType<typeof getOrganizationsIdMembers>>,
  TError = ErrorType<AuthenticationRequiredResponse | PermissionDeniedResponse | ResourceNotFoundResponse>
>(
  id: number,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOrganizationsIdMembers>>, TError, TData>
    request?: SecondParameter<typeof axiosInstance>
  }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } => {
  const queryOptions = getGetOrganizationsIdMembersQueryOptions(id, options)

  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey }

  query.queryKey = queryOptions.queryKey

  return query
}

/**
 * @summary Add a user as a member to an organization
 */
export const postOrganizationsIdMembers = (
  id: number,
  postOrganizationsIdMembersBody: PostOrganizationsIdMembersBody,
  options?: SecondParameter<typeof axiosInstance>
) => {
  return axiosInstance<void>(
    {
      url: `/organizations/${id}/members`,
      method: "post",
      headers: { "Content-Type": "application/json" },
      data: postOrganizationsIdMembersBody,
    },
    options
  )
}

export const getPostOrganizationsIdMembersMutationOptions = <
  TError = ErrorType<AuthenticationRequiredResponse | PostOrganizationsIdMembers404>,
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof postOrganizationsIdMembers>>,
    TError,
    { id: number; data: PostOrganizationsIdMembersBody },
    TContext
  >
  request?: SecondParameter<typeof axiosInstance>
}): UseMutationOptions<
  Awaited<ReturnType<typeof postOrganizationsIdMembers>>,
  TError,
  { id: number; data: PostOrganizationsIdMembersBody },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {}

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof postOrganizationsIdMembers>>,
    { id: number; data: PostOrganizationsIdMembersBody }
  > = (props) => {
    const { id, data } = props ?? {}

    return postOrganizationsIdMembers(id, data, requestOptions)
  }

  return { mutationFn, ...mutationOptions }
}

export type PostOrganizationsIdMembersMutationResult = NonNullable<
  Awaited<ReturnType<typeof postOrganizationsIdMembers>>
>
export type PostOrganizationsIdMembersMutationBody = PostOrganizationsIdMembersBody
export type PostOrganizationsIdMembersMutationError = ErrorType<
  AuthenticationRequiredResponse | PostOrganizationsIdMembers404
>

/**
 * @summary Add a user as a member to an organization
 */
export const usePostOrganizationsIdMembers = <
  TError = ErrorType<AuthenticationRequiredResponse | PostOrganizationsIdMembers404>,
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof postOrganizationsIdMembers>>,
    TError,
    { id: number; data: PostOrganizationsIdMembersBody },
    TContext
  >
  request?: SecondParameter<typeof axiosInstance>
}) => {
  const mutationOptions = getPostOrganizationsIdMembersMutationOptions(options)

  return useMutation(mutationOptions)
}
/**
 * @summary Remove a member from an organization
 */
export const deleteOrganizationsIdMembersMember = (
  id: number,
  member: number,
  options?: SecondParameter<typeof axiosInstance>
) => {
  return axiosInstance<void>({ url: `/organizations/${id}/members/${member}`, method: "delete" }, options)
}

export const getDeleteOrganizationsIdMembersMemberMutationOptions = <
  TError = ErrorType<unknown>,
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof deleteOrganizationsIdMembersMember>>,
    TError,
    { id: number; member: number },
    TContext
  >
  request?: SecondParameter<typeof axiosInstance>
}): UseMutationOptions<
  Awaited<ReturnType<typeof deleteOrganizationsIdMembersMember>>,
  TError,
  { id: number; member: number },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {}

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof deleteOrganizationsIdMembersMember>>,
    { id: number; member: number }
  > = (props) => {
    const { id, member } = props ?? {}

    return deleteOrganizationsIdMembersMember(id, member, requestOptions)
  }

  return { mutationFn, ...mutationOptions }
}

export type DeleteOrganizationsIdMembersMemberMutationResult = NonNullable<
  Awaited<ReturnType<typeof deleteOrganizationsIdMembersMember>>
>

export type DeleteOrganizationsIdMembersMemberMutationError = ErrorType<unknown>

/**
 * @summary Remove a member from an organization
 */
export const useDeleteOrganizationsIdMembersMember = <TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof deleteOrganizationsIdMembersMember>>,
    TError,
    { id: number; member: number },
    TContext
  >
  request?: SecondParameter<typeof axiosInstance>
}) => {
  const mutationOptions = getDeleteOrganizationsIdMembersMemberMutationOptions(options)

  return useMutation(mutationOptions)
}
