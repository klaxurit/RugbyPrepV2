/**
 * Sélection de repository pour le sandbox staff (pur, sans React).
 */
import type { StaffPlanningRepository } from './staffPlanningRepository'
import { inMemoryStaffPlanningRepository } from './inMemoryStaffPlanningRepository'
import { supabaseStaffPlanningRepository } from './supabaseStaffPlanningRepository'

export type StaffSandboxRepositorySource = 'memory' | 'supabase'

export function parseStaffSandboxRepositorySource(value: string | null | undefined): StaffSandboxRepositorySource {
  const v = String(value ?? '')
    .trim()
    .toLowerCase()
  if (v === 'supabase') return 'supabase'
  return 'memory'
}

export function getStaffPlanningRepositoryForSource(
  source: StaffSandboxRepositorySource
): StaffPlanningRepository {
  return source === 'supabase' ? supabaseStaffPlanningRepository : inMemoryStaffPlanningRepository
}
