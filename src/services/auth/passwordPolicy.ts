export const MIN_PASSWORD_LENGTH = 10

export function isPasswordMeetingPolicy(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH
}

export function passwordTooWeakMessage(): string {
  return `Mot de passe trop faible (${MIN_PASSWORD_LENGTH} caractères minimum).`
}
