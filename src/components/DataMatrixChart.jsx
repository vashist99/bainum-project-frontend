import { CONTENT_CATEGORIES, CONTENT_COLORS, CONTENT_LABELS } from "../lib/talkMetrics.js";

function niceMax(value) {
    if (!Number.isFinite(value) || value <= 0) return 1;
    const padded = value * 1.15;
    const power = Math.pow(10, Math.floor(Math.log10(padded)));
    const step = padded / power > 5 ? power : padded / power > 2 ? power / 2 : power / 5;
    return Math.max(step, Math.ceil(padded / step) * step);
}

function segments(series) {
    const parts = [];
    let current = [];
    series.forEach((value, index) => {
        if (value == null || Number.isNaN(value)) {
            if (current.length) parts.push(current);
            current = [];
            return;
        }
        current.push({ index, value });
    });
    if (current.length) parts.push(current);
    return parts;
}

export default function DataMatrixChart({ points = [], metricLabel = "Words per minute" }) {
    const width = 980;
    const height = 300;
    const pad = { l: 56, r: 24, t: 72, b: 42 };
    const plotW = width - pad.l - pad.r;
    const plotH = height - pad.t - pad.b;
    const labels = points.map((point) => point.label);
    const n = Math.max(labels.length, 1);
    const values = points.flatMap((point) => CONTENT_CATEGORIES.map((category) => point.values?.[category])).filter((value) => value != null && !Number.isNaN(value));
    const yMax = niceMax(Math.max(0, ...values));
    const yStep = yMax <= 3 ? 0.5 : yMax <= 12 ? 2 : Math.max(1, Math.round(yMax / 4));
    const ticks = [];
    for (let value = 0; value <= yMax + 1e-9; value += yStep) ticks.push(Math.round(value * 1000) / 1000);
    const xAt = (index) => pad.l + (n === 1 ? plotW / 2 : (index / (n - 1)) * plotW);
    const yAt = (value) => pad.t + plotH - (value / yMax) * plotH;
    const labelIndexes = new Set();
    if (labels.length > 0) {
        labelIndexes.add(0);
        const minGap = 92;
        for (let index = 1; index < labels.length; index += 1) {
            const last = [...labelIndexes].at(-1);
            const isLast = index === labels.length - 1;
            if (xAt(index) - xAt(last) >= (isLast ? 64 : minGap)) labelIndexes.add(index);
            else if (isLast && labelIndexes.size > 1) {
                const previous = [...labelIndexes].at(-1);
                if (previous !== 0) labelIndexes.delete(previous);
                labelIndexes.add(index);
            }
        }
    }

    return (
        <div className="min-w-0">
        <div className="overflow-x-auto max-w-full min-w-0">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[36rem]" role="img" aria-label={`Data Matrix for CATTAC — ${metricLabel}`}>
            <rect width={width} height={height} fill="#ffffff" />
            <text x="8" y="34" fill="#1F1F1F" fontSize="28" fontFamily="Calibri, Segoe UI, sans-serif">Data Matrix for CATTAC</text>
            <text x="8" y="58" textAnchor="start" fill="#757575" fontSize="14" fontFamily="Calibri, Segoe UI, sans-serif">{metricLabel}</text>
            {ticks.map((tick) => (
                <g key={tick}>
                    <line x1={pad.l} y1={yAt(tick)} x2={pad.l + plotW} y2={yAt(tick)} stroke="#D9D9D9" />
                    <text x={pad.l - 10} y={yAt(tick) + 4} textAnchor="end" fill="#757575" fontSize="12" fontFamily="Calibri, Segoe UI, sans-serif">{tick}</text>
                </g>
            ))}
            {CONTENT_CATEGORIES.map((category) => (
                <g key={category}>
                    {segments(points.map((point) => point.values?.[category] ?? null)).map((part, partIndex) => (
                        part.length === 1 ? (
                            <circle key={`${category}-${partIndex}`} cx={xAt(part[0].index)} cy={yAt(part[0].value)} r="3.5" fill={CONTENT_COLORS[category]} />
                        ) : (
                            <polyline
                                key={`${category}-${partIndex}`}
                                fill="none"
                                stroke={CONTENT_COLORS[category]}
                                strokeWidth="2.8"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                points={part.map((item) => `${xAt(item.index)},${yAt(item.value)}`).join(" ")}
                            />
                        )
                    ))}
                </g>
            ))}
            {labels.map((label, index) => (
                labelIndexes.has(index) ? (
                    <text key={`${label}-${index}`} x={xAt(index)} y={pad.t + plotH + 20} textAnchor="middle" fill="#595959" fontSize="13" fontFamily="Calibri, Segoe UI, sans-serif">{label}</text>
                ) : null
            ))}
        </svg>
        </div>
        <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
            {CONTENT_CATEGORIES.map((category) => (
                <li key={category} className="inline-flex items-center gap-1.5 font-semibold">
                    <span className="inline-block h-0.5 w-4" style={{ background: CONTENT_COLORS[category] }} />
                    {CONTENT_LABELS[category]}
                </li>
            ))}
        </ul>
        </div>
    );
}
