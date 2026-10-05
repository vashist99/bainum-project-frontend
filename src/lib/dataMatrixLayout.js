export const BASE_WIDTH = 980;
export const CHART_HEIGHT = 300;

const PAD = { l: 64, r: 16, t: 72, b: 48 };
const MIN_POINT_GAP = 72;
const CHAR_W = 8.5;
const LABEL_GAP = 8;

function isMissing(value) {
    return value == null || value === "" || !Number.isFinite(Number(value));
}

function spanFor(text, x, anchor) {
    const textWidth = String(text).length * CHAR_W;
    if (anchor === "start") return { left: x, right: x + textWidth };
    if (anchor === "end") return { left: x - textWidth, right: x };
    return { left: x - textWidth / 2, right: x + textWidth / 2 };
}

export function labelSpan(label) {
    return spanFor(label.text, label.x, label.anchor);
}

export function categorySegments(series) {
    const valued = [];
    series.forEach((value, index) => {
        if (isMissing(value)) return;
        valued.push({ index, value: Number(value) });
    });
    if (valued.length === 0) return [];
    if (valued.length === 1) return [{ kind: "marker", points: valued }];

    const segments = [];
    let run = [valued[0]];
    for (let i = 1; i < valued.length; i += 1) {
        const next = valued[i];
        const prev = run[run.length - 1];
        if (next.index === prev.index + 1) {
            run.push(next);
            continue;
        }
        if (run.length >= 2) segments.push({ kind: "solid", points: run });
        segments.push({ kind: "dotted", points: [prev, next] });
        run = [next];
    }
    if (run.length >= 2) segments.push({ kind: "solid", points: run });
    return segments;
}

export function chartLayout(labels) {
    const n = labels.length;
    const count = Math.max(n, 1);
    const needed = PAD.l + PAD.r + (count <= 1 ? 0 : (count - 1) * MIN_POINT_GAP);
    const width = Math.max(BASE_WIDTH, Math.ceil(needed));
    const plotW = width - PAD.l - PAD.r;
    const plotH = CHART_HEIGHT - PAD.t - PAD.b;
    const xAt = (index) => PAD.l + (count === 1 ? plotW / 2 : (index / (count - 1)) * plotW);

    const dateLabels = [];
    if (n === 1) {
        dateLabels.push({ index: 0, anchor: "middle", x: xAt(0), text: String(labels[0]) });
    } else if (n > 1) {
        const first = { index: 0, anchor: "start", x: xAt(0), text: String(labels[0]) };
        const last = { index: n - 1, anchor: "end", x: xAt(n - 1), text: String(labels[n - 1]) };
        dateLabels.push(first);
        let rightEdge = labelSpan(first).right;
        const lastLeft = labelSpan(last).left;
        for (let index = 1; index < n - 1; index += 1) {
            const text = String(labels[index]);
            const x = xAt(index);
            const span = spanFor(text, x, "middle");
            if (span.left >= rightEdge + LABEL_GAP && span.right <= lastLeft - LABEL_GAP) {
                dateLabels.push({ index, anchor: "middle", x, text });
                rightEdge = span.right;
            }
        }
        dateLabels.push(last);
    }

    return { width, height: CHART_HEIGHT, pad: PAD, plotW, plotH, xAt, dateLabels };
}
