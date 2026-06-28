/** Emails autorisés à accéder au panneau admin (client guard — le serveur revérifie). */
export const ADMIN_EMAIL_ALLOWLIST: readonly string[] = ['juncahugo@gmail.com']

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return ADMIN_EMAIL_ALLOWLIST.some((allowed) => allowed.toLowerCase() === normalized)
}
