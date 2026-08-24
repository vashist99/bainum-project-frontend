import { AlertCircle, Mic, MicOff, Square } from "lucide-react";
import { formatElapsed } from "../hooks/useAudioRecorder.js";

/**
 * Shared live-mic + optional file-upload controls used by parent home
 * recording and teacher classroom recording.
 */
export default function LiveAudioCapture({
    recording,
    elapsedMs,
    error,
    showReminder,
    onDismissReminder,
    audioBlob,
    audioFile,
    previewUrl,
    uploading = false,
    onStart,
    onStop,
    onClear,
    onFileSelect,
}) {
    const hasAudio = Boolean(audioBlob || audioFile);

    return (
        <>
            <div className="form-control w-full mb-3">
                <label className="label py-1">
                    <span className="label-text font-semibold">Record audio</span>
                    <span className="label-text-alt">Up to 60 min</span>
                </label>

                {recording ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-error/10 border border-error/40 rounded-xl p-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="relative flex h-3 w-3 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-error" />
                            </span>
                            <span
                                className="font-mono text-2xl sm:text-xl font-semibold tabular-nums text-error"
                                aria-live="polite"
                            >
                                {formatElapsed(elapsedMs)}
                            </span>
                            <span className="text-sm text-base-content/70 hidden sm:inline">
                                Recording…
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onStop}
                            className="btn btn-error gap-2 w-full sm:w-auto"
                        >
                            <Square className="w-4 h-4" />
                            Stop recording
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            type="button"
                            onClick={onStart}
                            className="btn btn-primary btn-lg gap-2 w-full sm:w-auto"
                            disabled={uploading}
                        >
                            <Mic className="w-5 h-5" />
                            {hasAudio ? "Record again" : "Start recording"}
                        </button>
                        {hasAudio && (
                            <button
                                type="button"
                                onClick={onClear}
                                className="btn btn-ghost gap-2 w-full sm:w-auto"
                                disabled={uploading}
                            >
                                <MicOff className="w-4 h-4" />
                                Clear audio
                            </button>
                        )}
                    </div>
                )}

                {error && (
                    <p className="text-error text-sm mt-2 flex items-start gap-1">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </p>
                )}
            </div>

            {showReminder && recording && (
                <div className="modal modal-open z-[200]">
                    <div className="modal-backdrop bg-black/50" aria-hidden="true" />
                    <div className="modal-box max-w-sm w-[92vw] sm:w-full relative z-[201] bg-base-100 p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="relative flex h-3 w-3 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-error" />
                            </span>
                            <h3 className="font-bold text-lg">Recording is still on</h3>
                        </div>
                        <p className="text-sm mb-1">
                            You have been recording for{" "}
                            <span className="font-mono font-semibold tabular-nums">
                                {formatElapsed(elapsedMs)}
                            </span>
                            . Do you want to keep going?
                        </p>
                        <p className="text-xs text-base-content/60 mb-4">
                            Very long recordings may exceed the 25 MB upload limit and fail to
                            upload. Recording stops automatically at 60 minutes.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-end">
                            <button
                                type="button"
                                onClick={onStop}
                                className="btn btn-outline btn-error gap-2 w-full sm:w-auto"
                            >
                                <Square className="w-4 h-4" />
                                Stop recording
                            </button>
                            <button
                                type="button"
                                onClick={onDismissReminder}
                                className="btn btn-primary gap-2 w-full sm:w-auto"
                            >
                                <Mic className="w-4 h-4" />
                                Keep recording
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="form-control w-full mb-3">
                <label className="label py-1">
                    <span className="label-text font-semibold">…or upload an audio file</span>
                    <span className="label-text-alt">Max 25 MB</span>
                </label>
                <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.webm,.mp4,.mpeg,.mpga,.oga,.ogg"
                    onChange={onFileSelect}
                    className="file-input file-input-bordered file-input-primary w-full text-base"
                    disabled={uploading || recording}
                />
                {audioFile && (
                    <p className="text-xs sm:text-sm text-success mt-2 break-words">
                        ✓ Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                )}
            </div>

            {previewUrl && (
                <div className="mb-3">
                    <audio
                        src={previewUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full"
                    />
                </div>
            )}
        </>
    );
}
