const GATEWAY_URL = "http://localhost:8080";

// Lấy token đăng nhập
const getAccessToken = () => {
    const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token");

    if (!token) {
        throw new Error("Không tìm thấy access token. Vui lòng đăng nhập lại.");
    }

    return token;
};

// Hàm gọi API GET
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

// Chuẩn hóa response dạng mảng hoặc phân trang
const extractList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.content)) return data.data.content;

    throw new Error("API không trả về danh sách dữ liệu hợp lệ.");
};

// Lấy danh sách phòng khám
export const getClinics = async () => {
    const data = await request(`${GATEWAY_URL}/clinics`);
    return extractList(data);
};

// Lấy phòng thuộc một phòng khám
export const getRoomsByClinic = async (clinicId) => {
    const data = await request(
        `${GATEWAY_URL}/clinics/${encodeURIComponent(clinicId)}/rooms`
    );

    return extractList(data);
};

// Lấy tất cả phòng từ các phòng khám
export const getClinicRooms = async () => {
    const clinics = await getClinics();

    const roomsByClinic = await Promise.all(
        clinics.map(async (clinic) => {
            const clinicId = clinic.clinicId ?? clinic.id;

            if (!clinicId) return [];

            try {
                const rooms = await getRoomsByClinic(clinicId);

                return rooms.map((room) => ({
                    ...room,
                    clinicId,
                    clinicName:
                        room.clinicName ??
                        room.clinicNames ??
                        clinic.name ??
                        clinic.clinicName ??
                        "",
                }));
            } catch (error) {
                // Không âm thầm bỏ qua lỗi API để tránh hiển thị thiếu dữ liệu.
                throw new Error(
                    `Không thể tải phòng của phòng khám ${clinic.name ?? clinic.clinicName ?? clinicId
                    }: ${error.message}`
                );
            }
        })
    );

    return roomsByClinic.flat();
};
