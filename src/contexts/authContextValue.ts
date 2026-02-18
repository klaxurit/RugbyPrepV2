import { createContext } from 'react'
import type { AuthError, AuthState, AuthUser } from '../types/auth'
import type { Result } from '../types/result'

interface SignUpInput {
  email: string
  displayName: string
  password: string
}

interface SignInInput {
  email: string
  password: string
}

export interface AuthContextValue {
  authState: AuthState
  signUp: (input: SignUpInput) => Promise<Result<AuthUser, AuthError>>
  signIn: (input: SignInInput) => Promise<Result<AuthUser, AuthError>>
  signOut: () => Promise<void>
  updateAvatar: (file: File) => Promise<Result<AuthUser, AuthError>>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
