import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    formatElapsed,
    extensionForMime,
    fileFromRecordingBlob,
    MAX_FILE_BYTES,
} from "../../src/hooks/useAudioRecorder.js";

describe("useAudioRecorder helpers", () => {
    test("formatElapsed pads minutes and seconds", () => {
        assert.equal(formatElapsed(0), "0:00");
        assert.equal(formatElapsed(5_000), "0:05");
        assert.equal(formatElapsed(65_000), "1:05");
        assert.equal(formatElapsed(60 * 60 * 1000), "60:00");
    });

    test("extensionForMime maps container types", () => {
        assert.equal(extensionForMime(""), "webm");
        assert.equal(extensionForMime("audio/webm;codecs=opus"), "webm");
        assert.equal(extensionForMime("audio/mp4"), "m4a");
        assert.equal(extensionForMime("audio/ogg;codecs=opus"), "ogg");
    });

    test("fileFromRecordingBlob names the file from the mime type", () => {
        const blob = new Blob(["abc"], { type: "audio/webm" });
        const file = fileFromRecordingBlob(blob, "audio/webm");
        assert.equal(file.name, "live-recording.webm");
        assert.equal(file.type, "audio/webm");
        assert.ok(file.size > 0);
    });

    test("upload cap is 25MB", () => {
        assert.equal(MAX_FILE_BYTES, 25 * 1024 * 1024);
    });
});
