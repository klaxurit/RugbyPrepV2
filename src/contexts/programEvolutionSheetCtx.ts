import { createContext } from 'react'
import type { ProgramEvolutionOpenArgs } from './programEvolutionSheetTypes'

export interface ProgramEvolutionSheetContextValue {
  openProgramEvolution: (args: ProgramEvolutionOpenArgs) => void
}

export const ProgramEvolutionSheetContext =
  createContext<ProgramEvolutionSheetContextValue | null>(null)
