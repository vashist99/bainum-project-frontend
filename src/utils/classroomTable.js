/**
 * Pure helpers for the classrooms list (table columns + card title).
 * Kept out of the page/component files so node-based unit tests can
 * import them without pulling in React, axios, or router modules.
 */

/**
 * Sortable column descriptors for the classrooms table. Keys persist into
 * `data-sort:classrooms` (via useSortableList) and must stay stable across
 * releases.
 */
export const classroomsColumns = [
    { key: "teacher", label: "Lead teacher", getter: (c) => c?.teacher?.name },
    { key: "name", label: "Classroom", getter: (c) => c?.name },
    { key: "students", label: "Enrolled children", getter: (c) => c?.childCount ?? 0 },
    { key: "center", label: "School", getter: (c) => c?.center },
];

/**
 * Card title for a classroom tile: the lead teacher's name, falling back
 * to "No lead teacher" when none is assigned.
 */
export function classroomCardTitle(classroom) {
    return classroom?.teacher?.name || "No lead teacher";
}
