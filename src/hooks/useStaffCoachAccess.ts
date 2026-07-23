import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import type { StaffMembershipRole } from '../services/staffPlanning/staffMembershipAdmin'

export interface StaffCoachMembership {
  clubId: string
  squadId: string | null
  role: StaffMembershipRole
}

export interface UseStaffCoachAccessResult {
  loading: boolean
  isStaffCoach: boolean
  memberships: StaffCoachMembership[]
  primaryMembership: StaffCoachMembership | null
  refresh: () => Promise<void>
}

export function useStaffCoachAccess(): UseStaffCoachAccessResult {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [loading, setLoading] = useState(!!userId)
  const [memberships, setMemberships] = useState<StaffCoachMembership[]>([])

  const refresh = useCallback(async () => {
    if (!userId) {
      setMemberships([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('club_staff_memberships')
        .select('club_id, squad_id, role')
        .eq('staff_user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[useStaffCoachAccess]', error.message)
        setMemberships([])
      } else {
        setMemberships(
          (data ?? []).map((row) => ({
            clubId: row.club_id as string,
            squadId: (row.squad_id as string | null) ?? null,
            role: row.role as StaffMembershipRole,
          }))
        )
      }
    } catch (e) {
      console.error('[useStaffCoachAccess]', e)
      setMemberships([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const primaryMembership = memberships[0] ?? null

  return {
    loading,
    isStaffCoach: memberships.length > 0,
    memberships,
    primaryMembership,
    refresh,
  }
}
