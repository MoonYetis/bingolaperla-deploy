import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { RootState } from '@/store'
import { logout, setTokens } from '@/store/authSlice'

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.tokens?.accessToken
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    
    headers.set('content-type', 'application/json')
    return headers
  },
})

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    // Intentar renovar el token
    const refreshToken = (api.getState() as RootState).auth.tokens?.refreshToken
    
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      )

      if (refreshResult.data) {
        const { tokens } = refreshResult.data as { tokens: any }
        
        // Guardar nuevos tokens
        api.dispatch(setTokens(tokens))
        
        // Reintentar la petición original
        result = await baseQuery(args, api, extraOptions)
      } else {
        // Refresh falló, hacer logout
        api.dispatch(logout())
      }
    } else {
      // No hay refresh token, hacer logout
      api.dispatch(logout())
    }
  }

  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Game', 'BingoCard'],
  endpoints: () => ({}),
})

export default api