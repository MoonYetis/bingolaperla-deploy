import { api } from './api'
import type { 
  User, 
  AuthResponse,
  LoginCredentials, 
  RegisterData,
  UpdateProfileData,
  ChangePasswordData 
} from '@/types'

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Login
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    // Register
    register: builder.mutation<AuthResponse, RegisterData>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    // Get current user profile
    getProfile: builder.query<{ user: User }, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    // Update profile
    updateProfile: builder.mutation<{ user: User; message: string }, UpdateProfileData>({
      query: (updateData) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: ['User'],
    }),

    // Change password
    changePassword: builder.mutation<{ message: string }, ChangePasswordData>({
      query: (passwordData) => ({
        url: '/auth/change-password',
        method: 'POST',
        body: passwordData,
      }),
    }),

    // Logout
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // Logout from all devices
    logoutAll: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout-all',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useLogoutMutation,
  useLogoutAllMutation,
} = authApi