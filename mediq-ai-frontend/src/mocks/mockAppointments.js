export const MOCK_APPOINTMENTS = [
  // ── 25/09/2026 ──
  { id: "APT-001", patientName: "Nguyễn Văn Hùng",    doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "08:00", date: "2026-09-25", status: "Đã hoàn thành", type: "Khám trực tiếp",              room: "Phòng 201", note: "Theo dõi huyết áp" },
  { id: "APT-002", patientName: "Trần Thị Phương",     doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "09:00", date: "2026-09-25", status: "Đã hoàn thành", type: "Tái khám",                    room: "Phòng 102", note: "Viêm dạ dày mãn" },
  { id: "APT-003", patientName: "Lê Quang Vinh",       doctorName: "BS. Nguyễn Mai Anh", specialty: "Da liễu",    time: "10:30", date: "2026-09-25", status: "Đã hoàn thành", type: "Khám lần đầu",                room: "Phòng 108", note: "" },
  { id: "APT-004", patientName: "Phạm Thị Hoa",        doctorName: "BS. Phạm Minh Đức",  specialty: "Ngoại khoa", time: "14:00", date: "2026-09-25", status: "Đã hủy",        type: "Tư vấn AI & Khám trực tiếp", room: "Phòng 305", note: "Sỏi mật" },
  { id: "APT-005", patientName: "Võ Minh Khoa",        doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "15:00", date: "2026-09-25", status: "Đã hoàn thành", type: "Tư vấn AI & Khám trực tiếp", room: "Phòng 201", note: "Loạn nhịp tim" },

  // ── 26/09/2026 ──
  { id: "APT-006", patientName: "Đặng Thị Nga",        doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "08:30", date: "2026-09-26", status: "Đã hoàn thành", type: "Khám trực tiếp",              room: "Phòng 102", note: "Mỡ máu cao" },
  { id: "APT-007", patientName: "Bùi Quốc Toàn",       doctorName: "BS. Nguyễn Mai Anh", specialty: "Da liễu",    time: "09:30", date: "2026-09-26", status: "Đã hoàn thành", type: "Tái khám",                    room: "Phòng 108", note: "" },
  { id: "APT-008", patientName: "Hoàng Văn Tâm",       doctorName: "BS. Phạm Minh Đức",  specialty: "Ngoại khoa", time: "11:00", date: "2026-09-26", status: "Đã hoàn thành", type: "Khám lần đầu",                room: "Phòng 305", note: "Thoát vị đĩa đệm" },
  { id: "APT-009", patientName: "Nguyễn Thị Linh",     doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "14:30", date: "2026-09-26", status: "Đã hủy",        type: "Khám trực tiếp",              room: "Phòng 201", note: "" },
  { id: "APT-010", patientName: "Trần Văn Đức",        doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "16:00", date: "2026-09-26", status: "Đã hoàn thành", type: "Tư vấn AI & Khám trực tiếp", room: "Phòng 102", note: "Đau đầu, mất ngủ" },

  // ── 29/09/2026 ──
  { id: "APT-011", patientName: "Lý Thị Thu",          doctorName: "BS. Nguyễn Mai Anh", specialty: "Nhi khoa",   time: "08:00", date: "2026-09-29", status: "Đã hoàn thành", type: "Khám lần đầu",                room: "Phòng 203", note: "Trẻ sốt cao 3 ngày" },
  { id: "APT-012", patientName: "Phan Văn Minh",       doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "09:00", date: "2026-09-29", status: "Đã hoàn thành", type: "Tái khám",                    room: "Phòng 201", note: "Sau đặt stent" },
  { id: "APT-013", patientName: "Vũ Thị Hằng",        doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "10:30", date: "2026-09-29", status: "Đã hoàn thành", type: "Khám trực tiếp",              room: "Phòng 102", note: "" },
  { id: "APT-014", patientName: "Đỗ Quang Huy",        doctorName: "BS. Phạm Minh Đức",  specialty: "Ngoại khoa", time: "14:00", date: "2026-09-29", status: "Đã hủy",        type: "Tư vấn AI & Khám trực tiếp", room: "Phòng 305", note: "Viêm ruột thừa" },
  { id: "APT-015", patientName: "Ngô Thị Bích",        doctorName: "BS. Nguyễn Mai Anh", specialty: "Da liễu",    time: "15:30", date: "2026-09-29", status: "Đã hoàn thành", type: "Tái khám",                    room: "Phòng 108", note: "Vảy nến" },

  // ── 30/09/2026 ──
  { id: "APT-016", patientName: "Cao Văn Lâm",         doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "08:30", date: "2026-09-30", status: "Đã hoàn thành", type: "Khám trực tiếp",              room: "Phòng 201", note: "Hở van tim" },
  { id: "APT-017", patientName: "Đinh Thị Nhung",      doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "09:30", date: "2026-09-30", status: "Đã hoàn thành", type: "Tư vấn AI & Khám trực tiếp", room: "Phòng 102", note: "Tiểu đường type 2" },
  { id: "APT-018", patientName: "Trịnh Văn Sơn",       doctorName: "BS. Phạm Minh Đức",  specialty: "Ngoại khoa", time: "11:00", date: "2026-09-30", status: "Đã hoàn thành", type: "Khám lần đầu",                room: "Phòng 305", note: "" },
  { id: "APT-019", patientName: "Mai Thị Loan",         doctorName: "BS. Nguyễn Mai Anh", specialty: "Da liễu",    time: "14:30", date: "2026-09-30", status: "Đã hủy",        type: "Khám trực tiếp",              room: "Phòng 108", note: "Viêm da cơ địa" },
  { id: "APT-020", patientName: "Lưu Hoàng Nam",       doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "16:00", date: "2026-09-30", status: "Đã hoàn thành", type: "Tái khám",                    room: "Phòng 201", note: "" },

  // ── 01/10/2026 ──
  { id: "APT-021", patientName: "Nguyễn Thị Cúc",      doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "08:00", date: "2026-10-01", status: "Đã hoàn thành", type: "Khám trực tiếp",              room: "Phòng 102", note: "Suy giáp" },
  { id: "APT-022", patientName: "Phạm Văn Bảo",        doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "09:30", date: "2026-10-01", status: "Đã hoàn thành", type: "Tư vấn AI & Khám trực tiếp", room: "Phòng 201", note: "Nhịp tim nhanh" },
  { id: "APT-023", patientName: "Hà Thị Yên",          doctorName: "BS. Nguyễn Mai Anh", specialty: "Nhi khoa",   time: "10:00", date: "2026-10-01", status: "Đã hoàn thành", type: "Khám lần đầu",                room: "Phòng 203", note: "Trẻ ho nhiều" },
  { id: "APT-024", patientName: "Bùi Đình Quân",       doctorName: "BS. Phạm Minh Đức",  specialty: "Ngoại khoa", time: "11:30", date: "2026-10-01", status: "Đang chờ",      type: "Tái khám",                    room: "Phòng 305", note: "Hậu phẫu thuật" },
  { id: "APT-025", patientName: "Lê Thị Tươi",         doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "14:00", date: "2026-10-01", status: "Đã hủy",        type: "Khám trực tiếp",              room: "Phòng 102", note: "" },
  { id: "APT-026", patientName: "Trần Đức Mạnh",       doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "15:30", date: "2026-10-01", status: "Đã hoàn thành", type: "Khám lần đầu",                room: "Phòng 201", note: "Đau tức ngực khi gắng sức" },

  // ── 02/10/2026 ──
  { id: "APT-027", patientName: "Đặng Thị Hồng",       doctorName: "BS. Nguyễn Mai Anh", specialty: "Da liễu",    time: "08:30", date: "2026-10-02", status: "Đã hoàn thành", type: "Tái khám",                    room: "Phòng 108", note: "Mụn trứng cá nặng" },
  { id: "APT-028", patientName: "Võ Văn Thắng",        doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "09:30", date: "2026-10-02", status: "Đã hoàn thành", type: "Tư vấn AI & Khám trực tiếp", room: "Phòng 102", note: "" },
  { id: "APT-029", patientName: "Nguyễn Thanh Tâm",    doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "10:30", date: "2026-10-02", status: "Đã hủy",        type: "Khám trực tiếp",              room: "Phòng 201", note: "Bệnh mạch vành" },
  { id: "APT-030", patientName: "Phan Thị Dung",       doctorName: "BS. Phạm Minh Đức",  specialty: "Ngoại khoa", time: "14:00", date: "2026-10-02", status: "Đã hoàn thành", type: "Khám lần đầu",                room: "Phòng 305", note: "U nang buồng trứng" },
  { id: "APT-031", patientName: "Hoàng Minh Tuấn",     doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "15:00", date: "2026-10-02", status: "Đã hoàn thành", type: "Tái khám",                    room: "Phòng 102", note: "Gout" },

  // ── 03/10/2026 ──
  { id: "APT-032", patientName: "Lý Văn Phú",          doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "08:00", date: "2026-10-03", status: "Đã hoàn thành", type: "Tái khám",                    room: "Phòng 201", note: "Sau nhồi máu cơ tim" },
  { id: "APT-033", patientName: "Trần Thị Ngọc",       doctorName: "BS. Nguyễn Mai Anh", specialty: "Nhi khoa",   time: "09:00", date: "2026-10-03", status: "Đã hoàn thành", type: "Khám lần đầu",                room: "Phòng 203", note: "Tiêm chủng định kỳ" },
  { id: "APT-034", patientName: "Đỗ Thị Thanh",        doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "10:00", date: "2026-10-03", status: "Đã hủy",        type: "Tư vấn AI & Khám trực tiếp", room: "Phòng 102", note: "" },
  { id: "APT-035", patientName: "Bùi Văn Hải",         doctorName: "BS. Phạm Minh Đức",  specialty: "Ngoại khoa", time: "11:30", date: "2026-10-03", status: "Đã hoàn thành", type: "Khám trực tiếp",              room: "Phòng 305", note: "Thoát vị bẹn" },
  { id: "APT-036", patientName: "Ngô Thị Lan",         doctorName: "BS. Nguyễn Mai Anh", specialty: "Da liễu",    time: "14:00", date: "2026-10-03", status: "Đã hoàn thành", type: "Tái khám",                    room: "Phòng 108", note: "Nấm da chân" },
  { id: "APT-037", patientName: "Cao Thị Phượng",      doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "15:30", date: "2026-10-03", status: "Đã hoàn thành", type: "Khám lần đầu",                room: "Phòng 201", note: "Đánh trống ngực" },

  // ── 04/10/2026 ──
  { id: "APT-038", patientName: "Đinh Văn Khánh",      doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "08:30", date: "2026-10-04", status: "Đã hoàn thành", type: "Tái khám",                    room: "Phòng 102", note: "Viêm gan B mãn" },
  { id: "APT-039", patientName: "Lê Thị Bảo Châu",    doctorName: "BS. Phạm Minh Đức",  specialty: "Ngoại khoa", time: "09:30", date: "2026-10-04", status: "Đã hoàn thành", type: "Khám trực tiếp",              room: "Phòng 305", note: "" },
  { id: "APT-040", patientName: "Phạm Hữu Đạt",       doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "10:30", date: "2026-10-04", status: "Đã hủy",        type: "Tư vấn AI & Khám trực tiếp", room: "Phòng 201", note: "" },
  { id: "APT-041", patientName: "Vũ Thị Ánh",         doctorName: "BS. Nguyễn Mai Anh", specialty: "Da liễu",    time: "14:30", date: "2026-10-04", status: "Đã hoàn thành", type: "Khám lần đầu",                room: "Phòng 108", note: "Eczema" },
  { id: "APT-042", patientName: "Trương Công Minh",    doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "16:00", date: "2026-10-04", status: "Đã hoàn thành", type: "Tái khám",                    room: "Phòng 102", note: "Hen phế quản" },

  // ── 05/10/2026 ──
  { id: "APT-101", patientName: "Nguyễn Văn An",       doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "09:30", date: "2026-10-05", status: "Xác nhận",      type: "Tư vấn AI & Khám trực tiếp", room: "Phòng 201", note: "Bệnh nhân đau ngực nhẹ" },
  { id: "APT-102", patientName: "Trần Thị Bình",       doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "10:15", date: "2026-10-05", status: "Đang chờ",      type: "Khám trực tiếp",              room: "Phòng 102", note: "Đau đầu kéo dài" },
  { id: "APT-103", patientName: "Phạm Quốc Cường",     doctorName: "BS. Nguyễn Mai Anh", specialty: "Da liễu",    time: "14:00", date: "2026-10-05", status: "Đã hoàn thành", type: "Tái khám",                    room: "Phòng 108", note: "Dị ứng da" },
  { id: "APT-104", patientName: "Lê Hoàng Yến",        doctorName: "BS. Phạm Minh Đức",  specialty: "Ngoại khoa", time: "15:30", date: "2026-10-05", status: "Đã hủy",        type: "Khám lần đầu",                room: "Phòng 305", note: "Đau bụng dưới" },
  { id: "APT-043", patientName: "Nguyễn Hữu Phước",   doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "08:00", date: "2026-10-05", status: "Đã hoàn thành", type: "Tái khám",                    room: "Phòng 201", note: "Huyết áp cao" },
  { id: "APT-044", patientName: "Đặng Thị Mỹ Linh",   doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "11:00", date: "2026-10-05", status: "Đang chờ",      type: "Tư vấn AI & Khám trực tiếp", room: "Phòng 102", note: "Gan nhiễm mỡ" },
  { id: "APT-045", patientName: "Bùi Thị Xuân",       doctorName: "BS. Nguyễn Mai Anh", specialty: "Nhi khoa",   time: "13:00", date: "2026-10-05", status: "Xác nhận",      type: "Khám lần đầu",                room: "Phòng 203", note: "Trẻ tiêu chảy" },

  // ── 06/10/2026 ──
  { id: "APT-105", patientName: "Vũ Minh Tú",          doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "08:00", date: "2026-10-06", status: "Đang chờ",      type: "Tư vấn AI & Khám trực tiếp", room: "Phòng 201", note: "" },
  { id: "APT-106", patientName: "Hoàng Thị Lan",       doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "11:00", date: "2026-10-06", status: "Xác nhận",      type: "Khám trực tiếp",              room: "Phòng 102", note: "Tiểu đường type 2" },
  { id: "APT-046", patientName: "Lê Văn Tín",          doctorName: "BS. Phạm Minh Đức",  specialty: "Ngoại khoa", time: "09:30", date: "2026-10-06", status: "Đang chờ",      type: "Tái khám",                    room: "Phòng 305", note: "" },
  { id: "APT-047", patientName: "Trần Thị Quỳnh",      doctorName: "BS. Nguyễn Mai Anh", specialty: "Da liễu",    time: "14:00", date: "2026-10-06", status: "Xác nhận",      type: "Khám lần đầu",                room: "Phòng 108", note: "Rụng tóc" },

  // ── 07/10/2026 ──
  { id: "APT-107", patientName: "Đỗ Văn Kiên",         doctorName: "BS. Nguyễn Mai Anh", specialty: "Da liễu",    time: "13:00", date: "2026-10-07", status: "Đang chờ",      type: "Khám lần đầu",                room: "Phòng 108", note: "" },
  { id: "APT-108", patientName: "Bùi Thị Mai",         doctorName: "BS. Phạm Minh Đức",  specialty: "Ngoại khoa", time: "09:00", date: "2026-10-07", status: "Xác nhận",      type: "Tái khám",                    room: "Phòng 305", note: "Phẫu thuật ruột thừa" },
  { id: "APT-048", patientName: "Nguyễn Thị Huyền",   doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "08:30", date: "2026-10-07", status: "Đang chờ",      type: "Khám trực tiếp",              room: "Phòng 201", note: "Rối loạn nhịp tim" },
  { id: "APT-049", patientName: "Phạm Tuấn Anh",      doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "10:00", date: "2026-10-07", status: "Đang chờ",      type: "Tư vấn AI & Khám trực tiếp", room: "Phòng 102", note: "Trào ngược dạ dày" },

  // ── 08/10/2026 ──
  { id: "APT-050", patientName: "Hoàng Anh Khoa",      doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "09:00", date: "2026-10-08", status: "Đang chờ",      type: "Tư vấn AI & Khám trực tiếp", room: "Phòng 201", note: "" },
  { id: "APT-051", patientName: "Vũ Thị Mỹ Dung",     doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "10:30", date: "2026-10-08", status: "Đang chờ",      type: "Khám lần đầu",                room: "Phòng 102", note: "Thiếu máu" },
  { id: "APT-052", patientName: "Lê Bá Thành",         doctorName: "BS. Phạm Minh Đức",  specialty: "Ngoại khoa", time: "14:00", date: "2026-10-08", status: "Đang chờ",      type: "Tái khám",                    room: "Phòng 305", note: "" },
  { id: "APT-053", patientName: "Đỗ Thị Thanh Hà",    doctorName: "BS. Nguyễn Mai Anh", specialty: "Nhi khoa",   time: "08:30", date: "2026-10-08", status: "Đang chờ",      type: "Khám trực tiếp",              room: "Phòng 203", note: "Còi xương" },

  // ── 10/10/2026 ──
  { id: "APT-054", patientName: "Trần Hoàng Long",     doctorName: "BS. Lê Hoài Nam",    specialty: "Tim mạch",   time: "08:00", date: "2026-10-10", status: "Đang chờ",      type: "Khám lần đầu",                room: "Phòng 201", note: "Đau ngực" },
  { id: "APT-055", patientName: "Nguyễn Thị Thảo",    doctorName: "BS. Trần Thu Hà",    specialty: "Nội khoa",   time: "09:30", date: "2026-10-10", status: "Đang chờ",      type: "Tư vấn AI & Khám trực tiếp", room: "Phòng 102", note: "Tiểu đường" },
  { id: "APT-056", patientName: "Bùi Trọng Nghĩa",    doctorName: "BS. Nguyễn Mai Anh", specialty: "Da liễu",    time: "11:00", date: "2026-10-10", status: "Đang chờ",      type: "Tái khám",                    room: "Phòng 108", note: "" },
];

export const APPOINTMENT_STATUS_LIST = ["Đang chờ", "Xác nhận", "Đã hoàn thành", "Đã hủy"];