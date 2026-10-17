
const API_BASE_URL = "http://localhost:8080/api/admin/appointments";

// Điều chỉnh tên key theo cách dự án đang lưu access token.
const getAccessToken = () => {
    const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token");

    if (!token) {
        throw new Error("Không tìm thấy access token. Vui lòng đăng nhập lại.");
    }

    return token;
};

const request = async (url) => {
    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${getAccessToken()}`,
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(
            message || `Lỗi gọi API: HTTP ${response.status}`
        );
    }

    return response.json();
};

export const getAppointments = (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.date) params.set("date", filters.date);
    if (filters.status) params.set("status", filters.status);
    if (filters.doctorId) params.set("doctorId", filters.doctorId);
    if (filters.patientId) params.set("patientId", filters.patientId);

    const query = params.toString();

    return request(`${API_BASE_URL}${query ? `?${query}` : ""}`);
};

export const getAppointmentById = (id) => {
    return request(`${API_BASE_URL}/${encodeURIComponent(id)}`);
};
