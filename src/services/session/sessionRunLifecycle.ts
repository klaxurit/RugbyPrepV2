/**
 * Cycle de vie du store sessionRun autour de la sauvegarde.
 *
 * Cause historique du « Terminé 0/N » : `stop()` au moment du save vidait
 * `completedExercises` alors que la page completed / share lit encore ce store.
 */

export type SessionRunClearMoment = 'on_save' | 'on_leave_screen'

/** Unique politique : on ne clear qu’en quittant l’écran (share continue, quit). */
export function resolveSessionRunClearMoment(): SessionRunClearMoment {
  return 'on_leave_screen'
}

export function shouldClearSessionRunAfterSave(
  moment: SessionRunClearMoment = resolveSessionRunClearMoment(),
): boolean {
  return moment === 'on_save'
}
