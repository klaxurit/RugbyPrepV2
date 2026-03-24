import { describe, expect, it } from 'vitest'
import { inMemoryStaffPlanningRepository } from '../inMemoryStaffPlanningRepository'
import { supabaseStaffPlanningRepository } from '../supabaseStaffPlanningRepository'
import {
  getStaffPlanningRepositoryForSource,
  parseStaffSandboxRepositorySource,
} from '../staffSandboxRepositorySource'

describe('parseStaffSandboxRepositorySource', () => {
  it('memory explicite', () => {
    expect(parseStaffSandboxRepositorySource('memory')).toBe('memory')
  })
  it('MEMORY (casse)', () => {
    expect(parseStaffSandboxRepositorySource('MEMORY')).toBe('memory')
  })
  it('supabase', () => {
    expect(parseStaffSandboxRepositorySource('supabase')).toBe('supabase')
  })
  it('null / undefined -> memory', () => {
    expect(parseStaffSandboxRepositorySource(null)).toBe('memory')
    expect(parseStaffSandboxRepositorySource(undefined)).toBe('memory')
  })
  it('valeur inconnue -> memory', () => {
    expect(parseStaffSandboxRepositorySource('postgres')).toBe('memory')
    expect(parseStaffSandboxRepositorySource('')).toBe('memory')
  })
})

describe('getStaffPlanningRepositoryForSource', () => {
  it('memory -> inMemoryStaffPlanningRepository', () => {
    expect(getStaffPlanningRepositoryForSource('memory')).toBe(inMemoryStaffPlanningRepository)
  })
  it('supabase -> supabaseStaffPlanningRepository', () => {
    expect(getStaffPlanningRepositoryForSource('supabase')).toBe(supabaseStaffPlanningRepository)
  })
})
