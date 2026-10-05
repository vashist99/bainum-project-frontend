const BASE_STROKE = 2.8;
const HIGHLIGHT_STROKE = 4.2;

export function nextHighlight(current, category) {
    return current === category ? null : category;
}

export function seriesStyle(category, selected) {
    const chosen = selected != null && selected === category;
    const faded = selected != null && selected !== category;
    return {
        opacity: faded ? 0.2 : 1,
        strokeWidth: chosen ? HIGHLIGHT_STROKE : BASE_STROKE,
    };
}
