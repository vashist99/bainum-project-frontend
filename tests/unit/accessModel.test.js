import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    ACTORS,
    ACTOR_IDS,
    CLASSROOM_VIEWERS,
    COPY,
    DELETION_FACT,
    HOME_VIEWERS,
    JOIN_NOTE,
    PATHS,
    collectVisibleFactStrings,
    connectorEmphasized,
    pathCellLabel,
    pathLabel,
    perspectiveEmphasis,
} from "../../src/lib/accessModel.js";

describe("accessModel", () => {
    test("exported visible strings are unique", () => {
        const strings = collectVisibleFactStrings();
        assert.ok(strings.length > 0);
        const seen = new Map();
        for (const value of strings) {
            assert.equal(typeof value, "string", "visible copy must be a string");
            const key = value.trim().toLowerCase();
            assert.ok(key.length > 0, "visible copy must be non-empty");
            assert.equal(
                seen.has(key),
                false,
                `duplicate visible string: "${value}"`
            );
            seen.set(key, value);
        }
    });

    test("actors have no delete badge or deleteMyAccount copy", () => {
        assert.equal(COPY.deleteMyAccount, undefined);
        for (const actor of ACTORS) {
            assert.equal(actor.canDeleteOwn, undefined, `${actor.id} must not carry delete on the portrait`);
        }
    });

    test("deletion fact names only teacher and coach", () => {
        assert.deepEqual([...DELETION_FACT.actors], ["teacher", "coach"]);
        assert.match(DELETION_FACT.label, /erase their own login/i);
        assert.ok(!DELETION_FACT.actors.includes("admin"));
        assert.ok(!DELETION_FACT.actors.includes("parent"));
    });

    test("every path has from, to, and a short label", () => {
        assert.ok(PATHS.length >= 5);
        for (const path of PATHS) {
            assert.ok(path.from, `${path.id} from`);
            assert.ok(path.toLabel, `${path.id} toLabel`);
            assert.ok(path.labelKey, `${path.id} labelKey`);
            const label = pathLabel(path);
            assert.ok(label && label.length > 0, `${path.id} missing label`);
            const cell = pathCellLabel(path);
            assert.ok(cell && cell.length > 0, `${path.id} missing cell label`);
        }
        const ids = PATHS.map((path) => path.id);
        assert.ok(ids.includes("record-classroom"));
        assert.ok(ids.includes("record-home"));
        assert.ok(ids.includes("ask-to-look"));
        assert.ok(ids.includes("share-staff"));
        assert.ok(ids.includes("turns-on-words"));
        assert.equal(PATHS.find((path) => path.id === "record-classroom").from, "teacher");
        assert.equal(PATHS.find((path) => path.id === "ask-to-look").from, "coach");
        assert.equal(PATHS.find((path) => path.id === "turns-on-words").from, "admin");
    });

    test("coach home cell is no", () => {
        const coachHome = HOME_VIEWERS.find((row) => row.actor === "coach");
        assert.ok(coachHome);
        assert.equal(coachHome.charts, "no");
        assert.equal(coachHome.transcript, "no");
        const homeFromCoach = PATHS.filter((path) => path.from === "coach" && path.toPlace === "home");
        assert.equal(homeFromCoach.length, 0);
    });

    test("home admin transcript is parent share plus admin reading, not self-grant", () => {
        const adminHome = HOME_VIEWERS.find((row) => row.actor === "admin");
        const teacherHome = HOME_VIEWERS.find((row) => row.actor === "teacher");
        assert.equal(adminHome.transcriptLabelKey, "onlyIfParentSharesThenAdminReading");
        assert.equal(teacherHome.transcriptLabelKey, "onlyIfParentSharesThenAdminReading");
        assert.match(COPY[adminHome.transcriptLabelKey], /parent shares/i);
        const coachClass = CLASSROOM_VIEWERS.find((row) => row.actor === "coach");
        assert.equal(coachClass.transcriptLabelKey, undefined);
    });

    test("column glosses are short and stated once in copy", () => {
        assert.equal(COPY.chartsGloss, "Counts and pictures.");
        assert.equal(COPY.transcriptGloss, "The actual words.");
        assert.equal(COPY.yes, "Yes");
        assert.equal(COPY.no, "No");
        assert.match(COPY.onlyIfParentSharesThenAdminReading, /parent shares/i);
        assert.match(COPY.onlyIfParentSharesThenAdminReading, /admin allows/i);
        assert.equal(COPY.sharesWithStaff, undefined);
        assert.equal(COPY.turnsOnTheWords, undefined);
    });

    test("every actor has a short job line and an icon key", () => {
        assert.deepEqual(
            ACTORS.map((actor) => actor.id),
            [...ACTOR_IDS]
        );
        for (const actor of ACTORS) {
            assert.ok(actor.job.trim().length > 0, `${actor.id} job`);
            assert.ok(actor.icon.trim().length > 0, `${actor.id} icon`);
        }
    });

    test("join note is stated once and covers testing signup", () => {
        assert.match(JOIN_NOTE, /testing/i);
        assert.match(JOIN_NOTE, /every role/i);
        assert.match(JOIN_NOTE, /register as a coach/i);
        assert.match(JOIN_NOTE, /email invite/i);
        const strings = collectVisibleFactStrings();
        assert.equal(strings.filter((value) => value === JOIN_NOTE).length, 1);
    });

    test("classroom standing readers include admin, teacher, and parent", () => {
        const yes = CLASSROOM_VIEWERS.filter(
            (row) => row.charts === "yes" && row.transcript === "yes"
        ).map((row) => row.actor);
        assert.deepEqual(yes, ["admin", "teacher", "parent"]);
        const coach = CLASSROOM_VIEWERS.find((row) => row.actor === "coach");
        assert.equal(coach.charts, "arrow");
        assert.equal(coach.transcript, "arrow");
        assert.equal(coach.chartsPath, "ask-to-look");
        assert.equal(coach.transcriptPath, "turns-on-words");
    });

    test("perspectiveEmphasis dims other actors unless All is selected", () => {
        assert.equal(perspectiveEmphasis("all", "admin"), "full");
        assert.equal(perspectiveEmphasis("all", "coach"), "full");
        assert.equal(perspectiveEmphasis("parent", "parent"), "full");
        assert.equal(perspectiveEmphasis("parent", "coach"), "dim");
        assert.equal(perspectiveEmphasis("teacher", "admin"), "dim");
    });

    test("connectorEmphasized keeps All bright and filters by actor list", () => {
        assert.equal(connectorEmphasized("all", ["coach"]), true);
        assert.equal(connectorEmphasized("coach", ["coach", "teacher"]), true);
        assert.equal(connectorEmphasized("parent", ["coach", "teacher"]), false);
        assert.equal(connectorEmphasized("admin", undefined), false);
    });
});
