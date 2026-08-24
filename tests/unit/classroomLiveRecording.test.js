import { test, describe } from "node:test";
import assert from "node:assert/strict";

const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const LiveAudioCapture = (await import("../../src/components/LiveAudioCapture.jsx"))
    .default;

describe("classroom recording — live capture", () => {
    test("LiveAudioCapture shows Start recording when idle", () => {
        const html = renderToStaticMarkup(
            React.createElement(LiveAudioCapture, {
                recording: false,
                elapsedMs: 0,
                onStart: () => {},
                onStop: () => {},
                onClear: () => {},
                onFileSelect: () => {},
            })
        );
        assert.match(html, /Start recording/);
        assert.match(html, /or upload an audio file/);
    });

    test("LiveAudioCapture shows a stop control while recording", () => {
        const html = renderToStaticMarkup(
            React.createElement(LiveAudioCapture, {
                recording: true,
                elapsedMs: 5000,
                onStart: () => {},
                onStop: () => {},
                onClear: () => {},
                onFileSelect: () => {},
            })
        );
        assert.match(html, /Stop recording/);
        assert.match(html, /0:05/);
        assert.doesNotMatch(html, /Start recording/);
    });
});
