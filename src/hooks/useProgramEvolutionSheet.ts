import { useContext } from 'react'
import { ProgramEvolutionSheetContext } from '../contexts/programEvolutionSheetCtx'

export function useProgramEvolutionSheet() {
  const ctx = useContext(ProgramEvolutionSheetContext)
  return ctx ?? { openProgramEvolution: () => {}, isProgramEvolutionOpen: false }
}
