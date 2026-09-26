import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    classroomsColumns,
    classroomCardTitle,
} from "../../src/utils/classroomTable.js";
import { sortItems, SORT_ASC, SORT_DESC } from "../../src/hooks/useSortableList.js";

const rooms = [
    { id: "1", name: "Pre-K Owls", teacher: { name: "Ms. Rivera" }, childCount: 12, center: "North" },
    { id: "2", name: "Toddler Bees", teacher: { name: "Mr. Adams" }, childCount: 8, center: "South" },
    { id: "3", name: "Infant Room", teacher: null, childCount: 20, center: "North" },
];

const col = (key) => classroomsColumns.find((c) => c.key === key);

describe("classrooms table — sortable columns", () => {
    test("declares stable keys for teacher, name, students, center", () => {
        assert.deepEqual(
            classroomsColumns.map((c) => c.key),
            ["teacher", "name", "students", "center", "ageGroup"]
        );
    });

    test("sort by lead teacher (asc) puts missing teachers last", () => {
        const sorted = sortItems(rooms, { column: "teacher", direction: SORT_ASC }, col("teacher"));
        assert.deepEqual(
            sorted.map((r) => r.id),
            ["2", "1", "3"] // Adams, Rivera, then the room with no teacher
        );
    });

    test("sort by enrolled children is numeric, both directions", () => {
        const asc = sortItems(rooms, { column: "students", direction: SORT_ASC }, col("students"));
        assert.deepEqual(asc.map((r) => r.childCount), [8, 12, 20]);
        const desc = sortItems(rooms, { column: "students", direction: SORT_DESC }, col("students"));
        assert.deepEqual(desc.map((r) => r.childCount), [20, 12, 8]);
    });

    test("sort by classroom name and school works case-insensitively", () => {
        const byName = sortItems(rooms, { column: "name", direction: SORT_ASC }, col("name"));
        assert.deepEqual(byName.map((r) => r.name), ["Infant Room", "Pre-K Owls", "Toddler Bees"]);
        const byCenter = sortItems(rooms, { column: "center", direction: SORT_ASC }, col("center"));
        assert.deepEqual(byCenter.map((r) => r.center), ["North", "North", "South"]);
    });
});

describe("classroom card title", () => {
    test("uses the lead teacher's name", () => {
        assert.equal(classroomCardTitle(rooms[0]), "Ms. Rivera");
    });

    test("falls back when no lead teacher is assigned", () => {
        assert.equal(classroomCardTitle(rooms[2]), "No lead teacher");
        assert.equal(classroomCardTitle({}), "No lead teacher");
        assert.equal(classroomCardTitle(null), "No lead teacher");
    });
});
