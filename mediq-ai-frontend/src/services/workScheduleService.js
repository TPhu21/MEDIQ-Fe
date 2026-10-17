const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/$/, "");

export const workScheduleService = {
    async getWorkSchedules({ token, doctorId, startDate, endDate }) {
        if (!token) {
            throw new Error("Bạn chưa đăng nhập.");
        }

        if (!doctorId) {
            throw new Error("Không tìm thấy mã bác sĩ đang đăng nhập.");
        }

        const params = new URLSearchParams({
            doctorId,
        });

        const response = await fetch(
            `${API_BASE_URL}/work-schedules?${params.toString()}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(
                `Không thể tải lịch làm việc (HTTP ${response.status}).`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Dữ liệu lịch làm việc không đúng định dạng.");
        }

        // Lọc theo tuần ở frontend vì API hiện tại chưa có startDate/endDate.
        return data.filter((item) => {
            return (
                item.date &&
                item.date >= startDate &&
                item.date <= endDate
            );
        });
    },
};
