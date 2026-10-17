import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  DoorOpen,
  Users,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  ArrowUpRight,
  MapPin,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const DAY_NAMES = [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDate = (dateString) => {
  if (!dateString) return new Date();

  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getMonday = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));

  return result;
};

const formatVietnameseDate = (dateString) => {
  if (!dateString) return "";
  return parseDate(dateString).toLocaleDateString("vi-VN");
};

const formatTime = (time) => {
  if (!time) return "--:--";
  return String(time).slice(0, 5);
};

const getStatusLabel = (status) => {
  const labels = {
    APPROVED: "Đã duyệt",
    PENDING: "Chờ duyệt",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành",
    IN_PROGRESS: "Đang trực",
    REJECTED: "Từ chối",
  };

  return labels[status] || status || "Chưa xác định";
};

const getStatusClass = (status) => {
  switch (status) {
    case "APPROVED":
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "IN_PROGRESS":
      return "bg-cyan-100 text-cyan-700";
    case "CANCELLED":
    case "REJECTED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-amber-100 text-amber-800";
  }
};

async function apiGet(path, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Lỗi gọi API (${response.status}).`);
  }

  return response.json();
}

async function getDoctorByUserId(userId, token) {
  const doctors = await apiGet("/doctors", token);

  if (!Array.isArray(doctors)) {
    throw new Error("API /doctors không trả về danh sách hợp lệ.");
  }

  return (
    doctors.find(
      (doctor) => String(doctor.userId) === String(userId)
    ) || null
  );
}

async function getWorkSchedules(doctorId, token) {
  const query = new URLSearchParams({
    doctorId: String(doctorId),
  });

  const result = await apiGet(
    `/work-schedules?${query.toString()}`,
    token
  );

  if (!Array.isArray(result)) {
    throw new Error(
      "API /work-schedules không trả về danh sách hợp lệ."
    );
  }

  return result;
}

async function getSpecialties(token) {
  const result = await apiGet("/specialties", token);

  if (!Array.isArray(result)) {
    throw new Error("API /specialties không trả về danh sách hợp lệ.");
  }

  return result;
}

async function getRooms(token) {
  const result = await apiGet("/rooms", token);
  if (!Array.isArray(result)) {
    throw new Error("API /rooms không trả về danh sách hợp lệ.");
  }
  return result;
}

async function getClinics(token) {
  const result = await apiGet("/clinics", token);
  if (!Array.isArray(result)) {
    throw new Error("API /clinics không trả về danh sách hợp lệ.");
  }
  return result;
}

const findById = (items, id, idField) => {
  if (!id || !Array.isArray(items)) return null;

  return (
    items.find(
      (item) => String(item[idField]) === String(id)
    ) || null
  );
};

// Ưu tiên tên trả trực tiếp từ lịch làm việc,
// sau đó tra cứu tên từ danh sách danh mục.
const getRoomName = (schedule, rooms) => {
  const directName =
    schedule.roomName ||
    schedule.room?.name;

  if (directName) return directName;

  const roomId = schedule.roomId || schedule.room?.roomId;
  const room = findById(rooms, roomId, "roomId");

  return room?.name || "Chưa có thông tin phòng";
};

const getClinicName = (schedule, clinics, rooms) => {
  const directName =
    schedule.clinicName ||
    schedule.clinic?.name;

  if (directName) return directName;

  const clinicId =
    schedule.clinicId ||
    schedule.clinic?.clinicId;

  if (clinicId) {
    const clinic = findById(clinics, clinicId, "clinicId");
    if (clinic?.name) return clinic.name;
  }

  // Một số API chỉ trả roomId; có thể suy ra clinicId từ phòng.
  const roomId = schedule.roomId || schedule.room?.roomId;
  const room = findById(rooms, roomId, "roomId");

  if (room?.clinicId) {
    const clinic = findById(clinics, room.clinicId, "clinicId");
    if (clinic?.name) return clinic.name;
  }

  return "Chưa có thông tin cơ sở";
};

const getSpecialtyName = (schedule, specialties) => {
  const directName =
    schedule.specialtyName ||
    schedule.specialty?.name;

  if (directName) return directName;

  const specialtyId =
    schedule.specialtyId ||
    schedule.specialty?.specialtyId;

  const specialty = findById(
    specialties,
    specialtyId,
    "specialtyId"
  );

  return specialty?.name || "Chưa có thông tin chuyên khoa";
};

export const DoctorSchedules = () => {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const today = useMemo(() => new Date(), []);
  const [viewMode, setViewMode] = useState("week");
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [weekStart, setWeekStart] = useState(() => getMonday(today));

  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [clinics, setClinics] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!token || !user?.id) {
      setLoading(false);
      setError(
        "Không xác định được tài khoản đăng nhập. Vui lòng đăng nhập lại."
      );
      return;
    }

    let cancelled = false;

    const loadSchedules = async () => {
      setLoading(true);
      setError("");

      try {
        const doctorData = await getDoctorByUserId(user.id, token);

        if (!doctorData) {
          throw new Error(
            "Không tìm thấy hồ sơ bác sĩ tương ứng với tài khoản hiện tại."
          );
        }

        // Lịch và các danh mục được tải song song.
        // Nếu API danh mục chưa được cấu hình qua Gateway,
        // vẫn ưu tiên tên đã được trả trực tiếp trong lịch.
        const results = await Promise.allSettled([
          getWorkSchedules(doctorData.doctorId, token),
          getSpecialties(token),
          getRooms(token),
          getClinics(token),
        ]);

        const scheduleResult = results[0];

        if (scheduleResult.status === "rejected") {
          throw scheduleResult.reason;
        }

        const scheduleData = scheduleResult.value;
        const specialtyData =
          results[1].status === "fulfilled" ? results[1].value : [];
        const roomData =
          results[2].status === "fulfilled" ? results[2].value : [];
        const clinicData =
          results[3].status === "fulfilled" ? results[3].value : [];

        if (!cancelled) {
          setDoctor(doctorData);
          setSchedules(scheduleData);
          setSpecialties(specialtyData);
          setRooms(roomData);
          setClinics(clinicData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message || "Không thể tải lịch làm việc."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSchedules();

    return () => {
      cancelled = true;
    };
  }, [authLoading, token, user?.id]);

  const schedulesByDate = useMemo(() => {
    return schedules.reduce((result, schedule) => {
      if (!schedule.date) return result;

      if (!result[schedule.date]) {
        result[schedule.date] = [];
      }

      result[schedule.date].push(schedule);
      return result;
    }, {});
  }, [schedules]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);

      const dateString = formatDate(date);

      return {
        date: dateString,
        day: DAY_NAMES[date.getDay()],
        schedules: schedulesByDate[dateString] || [],
      };
    });
  }, [weekStart, schedulesByDate]);

  const selectedSchedules = schedulesByDate[selectedDate] || [];

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const totalWeekSchedules = weekDays.reduce(
    (total, day) => total + day.schedules.length,
    0
  );

  const approvedSchedules = selectedSchedules.filter(
    (schedule) => schedule.status === "APPROVED"
  ).length;

  // Một bác sĩ có thể có nhiều chuyên khoa.
  // Đối chiếu specialtyId của bác sĩ với danh mục /specialties.
  const doctorSpecialties = useMemo(() => {
    const doctorSpecialtyList = doctor?.specialties || [];

    const names = doctorSpecialtyList.map((item) => {
      const specialty = findById(
        specialties,
        item.specialtyId,
        "specialtyId"
      );

      return (
        item.specialtyName ||
        item.name ||
        specialty?.name ||
        null
      );
    });

    return [...new Set(names.filter(Boolean))].join(", ");
  }, [doctor, specialties]);

  const goToPreviousWeek = () => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() - 7);
    setWeekStart(date);
  };

  const goToNextWeek = () => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + 7);
    setWeekStart(date);
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    setWeekStart(getMonday(now));
    setSelectedDate(formatDate(now));
  };

  const renderSchedule = (schedule) => (
    <div
      key={schedule.scheduleId}
      className="rounded-xl border border-slate-200 bg-white p-3 space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-800">
          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
        </span>

        <span
          className={`text-[10px] px-2 py-1 rounded-full font-bold ${getStatusClass(
            schedule.status
          )}`}
        >
          {getStatusLabel(schedule.status)}
        </span>
      </div>

      <div className="text-[11px] text-slate-500 space-y-1.5">
        <div className="flex items-start gap-1.5">
          <DoorOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Phòng: {getRoomName(schedule, rooms)}
          </span>
        </div>

        <div className="flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Cơ sở: {getClinicName(schedule, clinics, rooms)}
          </span>
        </div>

        <div className="flex items-start gap-1.5">
          <Stethoscope className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Chuyên khoa: {getSpecialtyName(schedule, specialties)}
          </span>
        </div>

        <div className="text-slate-400 break-all">
          Mã ca: {schedule.scheduleId}
        </div>
      </div>
    </div>
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-60 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin" />
        <p className="text-sm">Đang tải lịch làm việc...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Lịch Làm Việc & Ca Trực Bác Sĩ
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Bác sĩ:{" "}
            <b className="text-slate-800">
              {doctor?.fullName || user?.fullName || "Chưa xác định"}
            </b>
            {" • "}
            Chuyên khoa:{" "}
            <b className="text-slate-800">
              {doctorSpecialties || "Chưa có thông tin"}
            </b>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-200/70 p-1 rounded-xl flex text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-lg transition ${viewMode === "week"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Lịch Tuần
            </button>

            <button
              type="button"
              onClick={() => setViewMode("day")}
              className={`px-3 py-1.5 rounded-lg transition ${viewMode === "day"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Lịch Ngày
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(`/doctor/appointments?date=${selectedDate}`)
            }
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            Quản Lý Lịch Hẹn
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">
          <p className="font-bold">Không thể tải lịch làm việc</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 px-3 py-1.5 rounded-lg bg-white border border-rose-200 font-semibold hover:bg-rose-100"
          >
            Thử tải lại
          </button>
        </div>
      )}

      {!error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                <DoorOpen className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 font-bold uppercase">
                  Phòng Khám
                </div>
                <div className="text-sm font-bold text-slate-800 break-words">
                  {selectedSchedules.length > 0
                    ? getRoomName(selectedSchedules[0], rooms)
                    : "Theo lịch phân phòng"}
                </div>
                <div className="text-[11px] text-slate-500">
                  Phòng theo ca của ngày đang chọn
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>

              <div>
                <div className="text-[11px] text-slate-400 font-bold uppercase">
                  Ca Làm Việc Ngày Chọn
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {selectedSchedules.length} ca
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold">
                  {approvedSchedules} ca đã duyệt
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>

              <div>
                <div className="text-[11px] text-slate-400 font-bold uppercase">
                  Tổng Ca Trong Tuần
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {totalWeekSchedules} ca
                </div>
                <div className="text-[11px] text-cyan-600 font-semibold">
                  Dữ liệu từ lịch làm việc
                </div>
              </div>
            </div>
          </div>

          {viewMode === "week" && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-cyan-600" />
                  <h2 className="text-sm font-bold text-slate-800">
                    Lịch Phân Ca Tuần (
                    {formatVietnameseDate(formatDate(weekStart))} -{" "}
                    {formatVietnameseDate(formatDate(weekEnd))})
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goToPreviousWeek}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                    title="Tuần trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={goToCurrentWeek}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50"
                  >
                    Tuần này
                  </button>

                  <button
                    type="button"
                    onClick={goToNextWeek}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                    title="Tuần sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {weekDays.map((item) => {
                  const isToday = item.date === formatDate(new Date());
                  const isSelected = item.date === selectedDate;

                  return (
                    <button
                      type="button"
                      key={item.date}
                      onClick={() => {
                        setSelectedDate(item.date);
                        setViewMode("day");
                      }}
                      className={`text-left rounded-2xl p-3.5 border transition flex flex-col justify-between min-h-[170px] ${isSelected
                          ? "bg-cyan-50 border-cyan-400 ring-2 ring-cyan-200"
                          : "bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                        }`}
                    >
                      <div className="w-full">
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className={`text-xs font-bold ${isSelected
                                ? "text-cyan-800"
                                : "text-slate-800"
                              }`}
                          >
                            {item.day}
                          </span>

                          {isToday && (
                            <span className="text-[9px] rounded-full bg-cyan-600 text-white px-1.5 py-0.5">
                              Hôm nay
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-mono text-slate-500 mb-3">
                          {item.date}
                        </div>

                        {item.schedules.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic py-3">
                            Không có ca trực
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {item.schedules.map((schedule) => (
                              <div
                                key={schedule.scheduleId}
                                className="bg-white/80 p-2 rounded-lg border border-slate-200"
                              >
                                <span className="text-[10px] text-slate-400 block font-semibold">
                                  Giờ trực
                                </span>

                                <span className="font-medium text-[11px] text-slate-700">
                                  {formatTime(schedule.startTime)} -{" "}
                                  {formatTime(schedule.endTime)}
                                </span>

                                <span className="block mt-1 text-[10px] text-slate-500">
                                  {getStatusLabel(schedule.status)}
                                </span>

                                <span className="block mt-1 text-[10px] text-slate-600">
                                  {getRoomName(schedule, rooms)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Số ca</span>
                        <span className="font-bold text-cyan-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {item.schedules.length}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === "day" && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:border-cyan-500"
                  />

                  <span className="text-xs font-bold text-slate-700">
                    {DAY_NAMES[parseDate(selectedDate).getDay()]}
                  </span>
                </div>

                <div className="text-xs text-slate-500">
                  Tổng số ca:{" "}
                  <b className="text-cyan-700">
                    {selectedSchedules.length} ca
                  </b>
                </div>
              </div>

              {selectedSchedules.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium">
                    Không có lịch làm việc ngày{" "}
                    {formatVietnameseDate(selectedDate)}.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedSchedules.map((schedule) => (
                    <div
                      key={schedule.scheduleId}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-xl bg-cyan-100 text-cyan-800 font-bold flex flex-col items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 mb-1 text-cyan-600" />
                          <span className="text-[11px]">
                            {formatTime(schedule.startTime)}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {formatTime(schedule.startTime)} -{" "}
                              {formatTime(schedule.endTime)}
                            </span>

                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusClass(
                                schedule.status
                              )}`}
                            >
                              {getStatusLabel(schedule.status)}
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 mt-2 space-y-1.5">
                            <p>
                              Phòng:{" "}
                              <b className="text-slate-800">
                                {getRoomName(schedule, rooms)}
                              </b>
                            </p>

                            <p>
                              Cơ sở:{" "}
                              <b className="text-slate-800">
                                {getClinicName(schedule, clinics, rooms)}
                              </b>
                            </p>

                            <p>
                              Chuyên khoa:{" "}
                              <b className="text-slate-800">
                                {getSpecialtyName(schedule, specialties)}
                              </b>
                            </p>

                            <p>
                              Mã ca:{" "}
                              <span className="font-mono break-all">
                                {schedule.scheduleId}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/doctor/appointments?date=${selectedDate}`
                            )
                          }
                          className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition shadow-sm"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          Xem Lịch Hẹn
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DoctorSchedules;