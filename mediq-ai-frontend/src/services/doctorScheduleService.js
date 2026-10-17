const API_BASE_URL = "http://localhost:8080";

async function apiGet(path, token) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed: ${response.status}`);
    }

    return response.json();
}

export async function getDoctorByUserId(userId, token) {
    const doctors = await apiGet("/doctors", token);

    return doctors.find(
        (doctor) => String(doctor.userId) === String(userId)
    ) ?? null;
}

export async function getDoctorWorkSchedules(doctorId, token) {
    const query = new URLSearchParams({
        doctorId: String(doctorId),
    });

    return apiGet(`/work-schedules?${query.toString()}`, token);
}