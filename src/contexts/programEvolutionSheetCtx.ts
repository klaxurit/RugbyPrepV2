import { createContext } from 'react'
import type { ProgramEvolutionOpenArgs } from './programEvolutionSheetTypes'

export interface ProgramEvolutionSheetContextValue {
  openProgramEvolution: (args: ProgramEvolutionOpenArgs) => void
  isProgramEvolutionOpen: boolean
}

export const ProgramEvolutionSheetContext =
  createContext<ProgramEvolutionSheetContextValue | null>(null)
