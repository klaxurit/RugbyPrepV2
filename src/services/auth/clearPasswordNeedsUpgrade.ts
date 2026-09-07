import { supabase } from '../supabase/client'
import { clearPasswordNeedsUpgradeNote } from './passwordUpgradeGate'

export async function clearPasswordNeedsUpgrade(userId: string): Promise<void> {
  clearPasswordNeedsUpgradeNote()
  const { error } = await supabase
    .from('profiles')
    .update({ password_needs_upgrade: false })
    .eq('id', userId)

  if (error) {
    console.warn('[auth] Failed to clear password upgrade flag:', error.message)
  }
}
