import { useState } from "react";
import { CONTENT_CATEGORIES, CONTENT_COLORS, CONTENT_LABELS } from "../lib/talkMetrics.js";
import { nextHighlight, seriesStyle } from "../lib/dataMatrixSeries.js";
import { categorySegments, chartLayout } from "../lib/dataMatrixLayout.js";

function niceMax(value) {
    if (!Number.isFinite(value) || value <= 0) return 1;
    const padded = value * 1.15;
    const power = Math.pow(10, Math.floor(Math.log10(padded)));
    const step = padded / power > 5 ? power : padded / power > 2 ? power / 2 : power / 5;
    return Math.max(step, Math.ceil(padded / step) * step);
}

export default function DataMatrixChart({ points = [], metricLabel = "Words per minute" }) {
    const [selected, setSelected] = useState(null);
    const layout = chartLayout(points.map((point) => point.label));
    const { width, height, pad, plotW, plotH, xAt, dateLabels } = layout;
    const drawOrder = selected
        ? [...CONTENT_CATEGORIES.filter((category) => category !== selected), selected]
        : CONTENT_CATEGORIES;
    const values = points.flatMap((point) => CONTENT_CATEGORIES.map((category) => point.values?.[category])).filter((value) => value != null && Number.isFinite(Number(value)));
    const yMax = niceMax(Math.max(0, ...values));
    const yStep = yMax <= 3 ? 0.5 : yMax <= 12 ? 2 : Math.max(1, Math.round(yMax / 4));
    const ticks = [];
    for (let value = 0; value <= yMax + 1e-9; value += yStep) ticks.push(Math.round(value * 1000) / 1000);
    const yAt = (value) => pad.t + plotH - (value / yMax) * plotH;

    return (
        <div className="min-w-0">
        <div className="overflow-x-auto max-w-full min-w-0">
        <svg viewBox={`0 0 ${width} ${height}`} style={{ minWidth: width }} className="h-auto w-full" role="img" aria-label={`Data Matrix for CATTAC — ${metricLabel}`}>
            <rect width={width} height={height} fill="#ffffff" />
            <text x="8" y="34" fill="#1F1F1F" fontSize="28" fontFamily="Calibri, Segoe UI, sans-serif">Data Matrix for CATTAC</text>
            <text x="8" y="58" textAnchor="start" fill="#757575" fontSize="14" fontFamily="Calibri, Segoe UI, sans-serif">{metricLabel}</text>
            {ticks.map((tick) => (
                <g key={tick}>
                    <line x1={pad.l} y1={yAt(tick)} x2={pad.l + plotW} y2={yAt(tick)} stroke="#D9D9D9" />
                    <text x={pad.l - 10} y={yAt(tick) + 4} textAnchor="end" fill="#757575" fontSize="12" fontFamily="Calibri, Segoe UI, sans-serif">{tick}</text>
                </g>
            ))}
            {drawOrder.map((category) => {
                const style = seriesStyle(category, selected);
                return (
                <g key={category} opacity={style.opacity}>
                    {categorySegments(points.map((point) => point.values?.[category] ?? null)).map((segment, partIndex) => (
                        segment.kind === "marker" ? (
                            <circle key={`${category}-${partIndex}`} cx={xAt(segment.points[0].index)} cy={yAt(segment.points[0].value)} r={selected === category ? 5 : 3.5} fill={CONTENT_COLORS[category]} />
                        ) : (
                            <polyline
                                key={`${category}-${partIndex}`}
                                fill="none"
                                stroke={CONTENT_COLORS[category]}
                                strokeWidth={style.strokeWidth}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                strokeDasharray={segment.kind === "dotted" ? "7 6" : undefined}
                                points={segment.points.map((item) => `${xAt(item.index)},${yAt(item.value)}`).join(" ")}
                            />
                        )
                    ))}
                </g>
                );
            })}
            {dateLabels.map((label) => (
                <text key={`${label.text}-${label.index}`} x={label.x} y={pad.t + plotH + 22} textAnchor={label.anchor} fill="#595959" fontSize="13" fontFamily="Calibri, Segoe UI, sans-serif">{label.text}</text>
            ))}
        </svg>
        </div>
        <ul className="mt-2 flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
            {CONTENT_CATEGORIES.map((category) => {
                const style = seriesStyle(category, selected);
                return (
                <li key={category}>
                    <button
                        type="button"
                        aria-pressed={selected === category}
                        className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-md px-1.5 font-semibold"
                        style={{ opacity: style.opacity }}
                        onClick={() => setSelected((current) => nextHighlight(current, category))}
                    >
                        <span className="inline-block h-0.5 w-4 shrink-0" style={{ background: CONTENT_COLORS[category] }} />
                        {CONTENT_LABELS[category]}
                    </button>
                </li>
                );
            })}
        </ul>
        </div>
    );
}
