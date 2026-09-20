import axios from "./axios";

export async function saveObservationNote(kind, id, text) {
    const { data } = await axios.patch(`/api/assessments/${kind}/${id}/note`, { text });
    return data;
}

export async function setObservationHidden(kind, id, hidden) {
    const { data } = await axios.patch(`/api/assessments/${kind}/${id}/hidden`, { hidden });
    return data;
}

export function mergeObservationPatch(item, payload) {
    if (!item || !payload) return item;
    return {
        ...item,
        observationNote: payload.observationNote,
        hidden: payload.hidden,
        recordedById: payload.recordedById ?? item.recordedById,
        canHide: payload.canHide ?? item.canHide,
    };
}
