const API_URL = "http://localhost:8080/appointments";

// Lấy token của người dùng đang đăng nhập
const getToken = () => {
    return (
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token")
    );
};

// Gọi API
const request = async (endpoint, options = {}) => {
    const token = getToken();

    if (!token) {
        throw new Error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }

        if (response.status === 403) {
            throw new Error("Bạn không có quyền thực hiện thao tác này.");
        }

        const message = await response.text();
        throw new Error(
            message || `Lỗi gọi API: ${response.status}`
        );
    }

    if (response.status === 204) {
        return null;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
};

// Patient: lấy lịch khám của chính mình
export const getMyAppointments = async () => {
    const data = await request("/my");

    // Backend hiện trả về List<AppointmentResponse>
    if (Array.isArray(data)) {
        return data;
    }

    // Dự phòng trường hợp response được bọc trong object
    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (Array.isArray(data?.content)) {
        return data.content;
    }

    return [];
};

// Patient: hủy lịch khám
export const cancelMyAppointment = async (appointmentId, reason = "") => {
    return request(`/${appointmentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
            status: "CANCELLED",
            reason,
        }),
    });
};

export default {
    getMyAppointments,
    cancelMyAppointment,
};
