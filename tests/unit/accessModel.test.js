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
        assert.ok(ids.includes("record-classroom-coach"));
        assert.ok(ids.includes("record-home"));
        assert.ok(ids.includes("classroom-contact"));
        assert.ok(ids.includes("classroom-parent"));
        assert.ok(ids.includes("home-contact"));
        assert.ok(ids.includes("home-contact-coach"));
        assert.ok(ids.includes("turns-on-words"));
        assert.equal(PATHS.find((path) => path.id === "record-classroom").from, "teacher");
        assert.equal(PATHS.find((path) => path.id === "record-classroom-coach").from, "coach");
        assert.equal(PATHS.find((path) => path.id === "classroom-contact").from, "coach");
        assert.equal(PATHS.find((path) => path.id === "classroom-parent").from, "parent");
        assert.equal(PATHS.find((path) => path.id === "home-contact").from, "teacher");
        assert.equal(PATHS.find((path) => path.id === "home-contact-coach").from, "coach");
        assert.equal(PATHS.find((path) => path.id === "turns-on-words").from, "admin");
    });

    test("teacher and coach home charts open on classroom contact; words stay admin-gated", () => {
        const teacherHome = HOME_VIEWERS.find((row) => row.actor === "teacher");
        const coachHome = HOME_VIEWERS.find((row) => row.actor === "coach");
        assert.equal(teacherHome.chartsPath, "home-contact");
        assert.equal(coachHome.chartsPath, "home-contact-coach");
        for (const home of [teacherHome, coachHome]) {
            assert.equal(home.charts, "arrow");
            assert.equal(home.transcript, "arrow");
            assert.equal(home.transcriptPath, "turns-on-words");
            assert.equal(home.transcriptLabelKey, "onlyIfAdminAllows");
        }
        assert.match(COPY.sharesAClassroom, /classroom/i);
        assert.match(COPY.sharesAClassroom, /revoked/i);
    });

    test("admin charts and words stay always on; staff words stay admin-gated", () => {
        const adminHome = HOME_VIEWERS.find((row) => row.actor === "admin");
        const adminClass = CLASSROOM_VIEWERS.find((row) => row.actor === "admin");
        assert.equal(adminHome.charts, "yes");
        assert.equal(adminHome.transcript, "yes");
        assert.equal(adminClass.charts, "yes");
        assert.equal(adminClass.transcript, "yes");
        const coachClass = CLASSROOM_VIEWERS.find((row) => row.actor === "coach");
        assert.equal(coachClass.transcriptLabelKey, undefined);
        assert.equal(coachClass.transcriptPath, "turns-on-words");
    });

    test("column glosses are short and stated once in copy", () => {
        assert.equal(COPY.chartsGloss, "Counts and pictures.");
        assert.equal(COPY.transcriptGloss, "The actual words.");
        assert.equal(COPY.yes, "Yes");
        assert.equal(COPY.no, "No");
        assert.match(COPY.onlyIfAdminAllows, /admin allows/i);
        assert.match(COPY.unlessLeadTurnsOff, /lead/i);
        assert.equal(COPY.sharesWithStaff, undefined);
        assert.equal(COPY.letsTeacherAndAdminLook, undefined);
        assert.equal(COPY.onlyIfParentShares, undefined);
        assert.equal(COPY.onlyIfParentSharesThenAdminReading, undefined);
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
        const coach = ACTORS.find((actor) => actor.id === "coach");
        assert.match(coach.job, /records/i);
        assert.match(coach.job, /looks at class talk/i);
    });

    test("join note is stated once and covers testing signup", () => {
        assert.match(JOIN_NOTE, /testing/i);
        assert.match(JOIN_NOTE, /every role/i);
        assert.match(JOIN_NOTE, /register as a coach/i);
        assert.match(JOIN_NOTE, /email invite/i);
        const strings = collectVisibleFactStrings();
        assert.equal(strings.filter((value) => value === JOIN_NOTE).length, 1);
    });

    test("classroom standing readers are admin and teacher; parent and coach are conditional", () => {
        const yes = CLASSROOM_VIEWERS.filter(
            (row) => row.charts === "yes" && row.transcript === "yes"
        ).map((row) => row.actor);
        assert.deepEqual(yes, ["admin", "teacher"]);
        const parent = CLASSROOM_VIEWERS.find((row) => row.actor === "parent");
        assert.equal(parent.charts, "arrow");
        assert.equal(parent.transcript, "arrow");
        assert.equal(parent.chartsPath, "classroom-parent");
        assert.equal(parent.transcriptPath, "classroom-parent");
        const coach = CLASSROOM_VIEWERS.find((row) => row.actor === "coach");
        assert.equal(coach.charts, "arrow");
        assert.equal(coach.transcript, "arrow");
        assert.equal(coach.chartsPath, "classroom-contact");
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
