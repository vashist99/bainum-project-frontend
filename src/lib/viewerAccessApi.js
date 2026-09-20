import axios from "./axios";

export async function fetchClassroomViewers(classroomId) {
    const response = await axios.get(`/api/viewer-access/classroom/${classroomId}`);
    return response.data;
}

export async function fetchHomeViewers(childId) {
    const response = await axios.get(`/api/viewer-access/home/${childId}`);
    return response.data;
}

export async function setClassroomChartStatus(classroomId, { viewerId, viewerRole, charts }) {
    const response = await axios.post(`/api/viewer-access/classroom/${classroomId}`, {
        viewerId,
        viewerRole,
        charts,
    });
    return response.data;
}

export async function setHomeChartStatus(childId, { viewerId, viewerRole, charts }) {
    const response = await axios.post(`/api/viewer-access/home/${childId}`, {
        viewerId,
        viewerRole,
        charts,
    });
    return response.data;
}
