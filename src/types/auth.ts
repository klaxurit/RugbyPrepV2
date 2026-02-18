export interface AuthUser {
  id: string
  email: string
  displayName: string
  createdAt: number
  avatarUrl?: string
}

export interface AuthState {
  status: 'anonymous' | 'authenticated'
  user: AuthUser | null
}

export type AuthError =
  | 'EMAIL_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'WEAK_PASSWORD'
  | 'INVALID_EMAIL'
  | 'RATE_LIMIT'
  | 'EMAIL_CONFIRMATION_REQUIRED'
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'UPLOAD_FAILED'
