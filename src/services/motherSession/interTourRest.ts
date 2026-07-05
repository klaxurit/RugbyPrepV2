export {
  getRestAfterExerciseSet,
  getInterTourRestAfterMarking,
  DEFAULT_INTRA_TOUR_REST_SECONDS,
  type RestAfterSetSchedule,
  type RestAfterSetKind,
} from './resolveExerciseRestAfterSet'

/** @deprecated Utiliser RestAfterSetSchedule */
export type { RestAfterSetSchedule as InterTourRestSchedule } from './resolveExerciseRestAfterSet'
