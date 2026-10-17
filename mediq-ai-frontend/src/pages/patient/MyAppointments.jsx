import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Search,
  RotateCcw,
  RefreshCw,
  Building2,
  MapPin,
} from "lucide-react";
import { getMyAppointments } from "../../services/appointmentServicePatient";

const STATUS_LABELS = {
  PENDING: "Đang chờ",
  CONFIRMED: "Xác nhận",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Vắng mặt",
};

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
  CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
  NO_SHOW: "bg-slate-200 text-slate-700 border-slate-300",
};

const normalizeStatus = (status) => {
  if (!status) return "UNKNOWN";

  const value = String(status).toUpperCase();

  // Hỗ trợ cả dữ liệu mock cũ nếu backend trả nhãn tiếng Việt
  const legacyStatuses = {
    "ĐANG CHỜ": "PENDING",
    "XÁC NHẬN": "CONFIRMED",
    "ĐÃ HOÀN THÀNH": "COMPLETED",
    "ĐÃ HỦY": "CANCELLED",
    "VẮNG MẶT": "NO_SHOW",
  };

  return legacyStatuses[value] || value;
};

const getStatusLabel = (status) => {
  const normalized = normalizeStatus(status);
  return STATUS_LABELS[normalized] || status || "Không xác định";
};

const getStatusStyle = (status) => {
  return (
    STATUS_STYLES[normalizeStatus(status)] ||
    "bg-slate-100 text-slate-700 border-slate-200"
  );
};

const formatDate = (value) => {
  if (!value) return "Chưa có ngày";

  // Hỗ trợ LocalDate dạng YYYY-MM-DD hoặc datetime ISO
  const dateString = String(value).slice(0, 10);
  const parts = dateString.split("-");

  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return value;
};

const getAppointmentDate = (apt) => {
  return (
    apt.appointmentDate ||
    apt.date ||
    apt.slot?.appointmentDate ||
    apt.slot?.date ||
    ""
  );
};

const getAppointmentTime = (apt) => {
  return (
    apt.startTime ||
    apt.time ||
    apt.slot?.startTime ||
    apt.slot?.start ||
    ""
  );
};

const getAppointmentId = (apt) => {
  return apt.appointmentId || apt.id || "";
};

const getDoctorName = (apt) => {
  const rawName =
    apt.doctorName ||
    apt.doctor?.fullName ||
    apt.doctor?.name ||
    apt.slot?.doctorName ||
    "";
  if (!rawName) return "Chưa cập nhật";
  return rawName.replace(/^(BS\.?\s*|Bác sĩ\s*)/i, "").trim();
};

const getSpecialty = (apt) => {
  return (
    apt.specialtyName ||
    apt.specialty ||
    apt.doctor?.specialtyName ||
    apt.slot?.specialtyName ||
    "Chưa cập nhật chuyên khoa"
  );
};

const getClinicName = (apt) => {
  return (
    apt.clinicName ||
    apt.clinic?.name ||
    apt.slot?.clinicName ||
    ""
  );
};

const getRoomInfo = (apt) => {
  const roomName = apt.roomName || apt.room?.name || apt.slot?.roomName || "";
  const roomCode = apt.roomCode || apt.room?.code || "";
  if (roomName && roomCode) return `${roomName} (${roomCode})`;
  return roomName || roomCode;
};

const getAppointmentType = (apt) => {
  return apt.type || apt.appointmentType || "Khám bệnh";
};

export const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách lịch khám.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments, refreshKey]);

  const filteredAppointments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return appointments.filter((apt) => {
      const id = String(getAppointmentId(apt)).toLowerCase();
      const doctor = String(getDoctorName(apt)).toLowerCase();
      const specialty = String(getSpecialty(apt)).toLowerCase();
      const clinic = String(getClinicName(apt)).toLowerCase();
      const status = normalizeStatus(apt.status);

      const matchesSearch =
        !keyword ||
        id.includes(keyword) ||
        doctor.includes(keyword) ||
        specialty.includes(keyword) ||
        clinic.includes(keyword);

      const matchesStatus =
        filterStatus === "ALL" || status === filterStatus;

      const appointmentDate = String(getAppointmentDate(apt)).slice(0, 10);
      const matchesDate =
        !filterDate || appointmentDate === filterDate;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, searchTerm, filterDate, filterStatus]);

  const handleReset = () => {
    setSearchTerm("");
    setFilterDate("");
    setFilterStatus("ALL");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-slate-900">
          Lịch Khám Của Tôi
        </h1>

        <button
          type="button"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
          />
          Làm mới
        </button>
      </div>

      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã lịch, bác sĩ, chuyên khoa, cơ sở khám..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Đang chờ</option>
            <option value="CONFIRMED">Xác nhận</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="NO_SHOW">Vắng mặt</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="sm:col-span-1 flex items-center justify-center">
          <button
            type="button"
            onClick={handleReset}
            title="Xóa bộ lọc"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Danh sách lịch khám */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mb-3" />
            <p className="text-sm">Đang tải lịch khám...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-sm font-semibold text-rose-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="mt-4 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700"
            >
              Thử lại
            </button>
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((apt, index) => {
              const id = getAppointmentId(apt);
              const date = getAppointmentDate(apt);
              const time = getAppointmentTime(apt);

              return (
                <div
                  key={id || index}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-cyan-50/50 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-cyan-100 rounded-xl text-cyan-700 border border-cyan-200 shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>

                    <div>
                      <p className="text-xs font-mono font-bold text-cyan-700 break-all">
                        {id || "Chưa có mã lịch"}
                      </p>

                      <p className="text-sm font-bold text-slate-800 mt-1">
                        {"BS. " + getDoctorName(apt)} - {"Khoa khám: " + getSpecialty(apt)}
                      </p>

                      {getClinicName(apt) && (
                        <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1.5 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span>Cơ sở: <b>{getClinicName(apt)}</b></span>
                          {getRoomInfo(apt) && (
                            <span className="text-slate-500"> • Phòng: <b>{getRoomInfo(apt)}</b></span>
                          )}
                        </p>
                      )}

                      <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-2 font-medium">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {time || "Chưa có giờ khám"} ({formatDate(date)})
                        {" "}• {getAppointmentType(apt)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border self-start sm:self-center ${getStatusStyle(
                      apt.status
                    )}`}
                  >
                    {getStatusLabel(apt.status)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs font-medium">
            {appointments.length === 0
              ? "Bạn chưa có lịch khám nào."
              : "Không tìm thấy lịch khám phù hợp với tìm kiếm của bạn."}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;
