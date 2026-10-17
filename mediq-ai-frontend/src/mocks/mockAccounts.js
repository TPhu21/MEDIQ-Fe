export const MOCK_ACCOUNTS = [
  {
    id: 1,
    email: "patient@mediq.ai",
    password: "123456",
    name: "Nguyễn Văn An",
    role: "PATIENT",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
    phone: "0912 345 678",
    dob: "1992-05-15",
    gender: "Nam",
    address: "Cầu Giấy, Hà Nội",
    medicalCode: "PAT-88291"
  },
  {
    id: 101,
    email: "doctor@mediq.ai",
    password: "123456",
    name: "BS. Lê Hoài Nam",
    role: "DOCTOR",
    specialty: "Tim mạch",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150",
    phone: "0988 777 666",
    room: "P.201 - Chuyên khoa Tim Mạch",
    badge: "Bác sĩ Chuyên khoa II"
  },
  {
    id: 999,
    email: "admin@mediq.ai",
    password: "123456",
    name: "Quản trị viên Hệ thống",
    role: "ADMIN",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    phone: "0900 000 000",
    department: "Ban Quản trị MEDIQ"
  }
];

export const MOCK_SPECIALTIES = [
  { id: 1, name: "Tim mạch", icon: "Heart", doctorsCount: 8, room: "Khu A - Tầng 2", description: "Chẩn đoán và điều trị các bệnh lý tim mạch", color: "rose", patientsThisMonth: 142 },
  { id: 2, name: "Nội khoa", icon: "Stethoscope", doctorsCount: 12, room: "Khu A - Tầng 1", description: "Khám và điều trị các bệnh nội tạng không cần phẫu thuật", color: "cyan", patientsThisMonth: 218 },
  { id: 3, name: "Ngoại khoa", icon: "Activity", doctorsCount: 6, room: "Khu B - Tầng 3", description: "Phẫu thuật và can thiệp ngoại khoa", color: "amber", patientsThisMonth: 89 },
  { id: 4, name: "Da liễu", icon: "Sparkles", doctorsCount: 5, room: "Khu C - Tầng 1", description: "Chẩn đoán và điều trị các bệnh về da", color: "purple", patientsThisMonth: 95 },
  { id: 5, name: "Thần kinh", icon: "Brain", doctorsCount: 7, room: "Khu B - Tầng 2", description: "Điều trị các bệnh lý về hệ thần kinh trung ương và ngoại biên", color: "indigo", patientsThisMonth: 76 },
  { id: 6, name: "Nhi khoa", icon: "Baby", doctorsCount: 9, room: "Khu C - Tầng 2", description: "Chăm sóc sức khỏe trẻ em từ sơ sinh đến 16 tuổi", color: "emerald", patientsThisMonth: 189 },
];