import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
    MAX_RECORDING_MS,
    initialReminderAt,
    shouldShowReminder,
    advanceReminder,
} from "../utils/recordingReminder.js";

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function formatElapsed(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export function pickRecorderMimeType() {
    if (typeof MediaRecorder === "undefined") return "";
    const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
    ];
    for (const t of candidates) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
}

export function extensionForMime(mime) {
    if (!mime) return "webm";
    if (mime.includes("mp4")) return "m4a";
    if (mime.includes("ogg")) return "ogg";
    return "webm";
}

export function fileFromRecordingBlob(blob, mimeType) {
    const type = mimeType || blob?.type || "audio/webm";
    const ext = extensionForMime(type);
    return new File([blob], `live-recording.${ext}`, { type });
}

/**
 * In-browser mic capture shared by parent home recording and teacher
 * classroom recording. Caps at 60 minutes / 25MB.
 */
export default function useAudioRecorder() {
    const [recording, setRecording] = useState(false);
    const [error, setError] = useState("");
    const [elapsedMs, setElapsedMs] = useState(0);
    const [showReminder, setShowReminder] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioBlobMime, setAudioBlobMime] = useState("");

    const mediaRecorderRef = useRef(null);
    const recorderChunksRef = useRef([]);
    const mediaStreamRef = useRef(null);
    const timerRef = useRef(null);
    const nextReminderAtRef = useRef(initialReminderAt());
    const stopRef = useRef(() => {});

    const stopTracks = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
        }
        mediaRecorderRef.current = null;
    }, []);

    const stop = useCallback(() => {
        setShowReminder(false);
        nextReminderAtRef.current = initialReminderAt();
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        } else {
            stopTracks();
        }
        setRecording(false);
    }, [stopTracks]);

    stopRef.current = stop;

    const start = useCallback(async () => {
        setError("");
        if (typeof MediaRecorder === "undefined") {
            setError(
                "Recording isn't supported in this browser. Try a recent Chrome / Safari, or upload an audio file instead."
            );
            return false;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            setError(
                window.isSecureContext
                    ? "Microphone access isn't available on this device. Upload an audio file instead."
                    : "Microphone access requires HTTPS. Open this page over a secure (https://) URL or upload an audio file."
            );
            return false;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            const mimeType = pickRecorderMimeType();
            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);
            recorderChunksRef.current = [];
            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recorderChunksRef.current.push(event.data);
                }
            };
            recorder.onstop = () => {
                const type = recorder.mimeType || mimeType || "audio/webm";
                const blob = new Blob(recorderChunksRef.current, { type });
                if (blob.size > MAX_FILE_BYTES) {
                    toast.error("Recording exceeded 25MB; please record a shorter clip.");
                } else {
                    setAudioBlob(blob);
                    setAudioBlobMime(type);
                }
                stopTracks();
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setAudioBlob(null);
            setAudioBlobMime("");
            setRecording(true);
            setElapsedMs(0);
            setShowReminder(false);
            nextReminderAtRef.current = initialReminderAt();
            const started = Date.now();
            timerRef.current = setInterval(() => {
                const elapsed = Date.now() - started;
                setElapsedMs(elapsed);
                if (elapsed >= MAX_RECORDING_MS) {
                    stopRef.current();
                    return;
                }
                if (shouldShowReminder(elapsed, nextReminderAtRef.current)) {
                    nextReminderAtRef.current = advanceReminder(
                        elapsed,
                        nextReminderAtRef.current
                    );
                    setShowReminder(true);
                }
            }, 250);
            return true;
        } catch (err) {
            console.error("getUserMedia error:", err);
            stopTracks();
            setError(
                err?.name === "NotAllowedError"
                    ? "Microphone access was denied. Allow access and try again."
                    : "Couldn't start recording. Check your microphone."
            );
            return false;
        }
    }, [stopTracks]);

    const clear = useCallback(() => {
        setAudioBlob(null);
        setAudioBlobMime("");
        setElapsedMs(0);
        setError("");
    }, []);

    useEffect(() => {
        return () => {
            stopTracks();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [stopTracks]);

    return {
        recording,
        error,
        elapsedMs,
        showReminder,
        setShowReminder,
        audioBlob,
        audioBlobMime,
        start,
        stop,
        clear,
    };
}
