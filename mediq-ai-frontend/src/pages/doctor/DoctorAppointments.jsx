import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  Search,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCcw,
  User,
  Check,
  DoorOpen,
  FileText,
  X,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const STATUS_LABELS = {
  PENDING: "Đang chờ",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Không đến",
};

const STATUS_BADGES = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-cyan-100 text-cyan-800 border-cyan-200",
  CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
  NO_SHOW: "bg-slate-100 text-slate-700 border-slate-200",
};

async function apiRequest(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `API lỗi ${response.status}: ${response.statusText}`
    );
  }

  if (response.status === 204) return null;

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const formatDate = (date) => {
  if (!date) return "Chưa có ngày";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

const formatTime = (time) => (time ? time.slice(0, 5) : "--:--");

export const DoctorAppointments = () => {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [appointments, setAppointments] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState(
    searchParams.get("date") || ""
  );
  const [selectedApt, setSelectedApt] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const loadAppointments = useCallback(async () => {
    if (!user || !token) return;

    setLoading(true);
    setError("");

    try {
      // Xác định đúng bác sĩ thuộc tài khoản đang đăng nhập.
      const doctors = await apiRequest("/doctors", token);
      const currentDoctor = (doctors || []).find(
        (item) => String(item.userId) === String(user.id)
      );

      if (!currentDoctor) {
        setDoctor(null);
        setAppointments([]);
        setError(
          "Không tìm thấy hồ sơ bác sĩ liên kết với tài khoản đang đăng nhập."
        );
        return;
      }

      setDoctor(currentDoctor);

      // Lấy lịch hẹn đúng theo UUID doctorId.
      const params = new URLSearchParams({
        doctorId: currentDoctor.doctorId,
      });

      if (dateFilter) params.set("date", dateFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const data = await apiRequest(
        `/appointments?${params.toString()}`,
        token
      );

      setAppointments(Array.isArray(data) ? data : []);

      // Cập nhật dữ liệu lịch hẹn đang mở trong modal.
      setSelectedApt((current) => {
        if (!current) return null;
        return (
          (Array.isArray(data) ? data : []).find(
            (item) => item.appointmentId === current.appointmentId
          ) || null
        );
      });
    } catch (err) {
      console.error("Load doctor appointments error:", err);
      setError(err.message || "Không thể tải danh sách lịch hẹn.");
    } finally {
      setLoading(false);
    }
  }, [user, token, dateFilter, statusFilter]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !token) {
        setLoading(false);
        setError("Vui lòng đăng nhập để xem lịch hẹn.");
        return;
      }

      if (user.role !== "DOCTOR") {
        setLoading(false);
        setError("Trang này chỉ dành cho tài khoản bác sĩ.");
        return;
      }

      loadAppointments();
    }
  }, [authLoading, user, token, loadAppointments]);

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    if (!appointmentId || updatingId) return;

    setUpdatingId(appointmentId);

    try {
      await apiRequest(
        `/appointments/${appointmentId}/status`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      showToast(
        `Đã cập nhật lịch hẹn thành "${STATUS_LABELS[newStatus] || newStatus}".`
      );

      await loadAppointments();
    } catch (err) {
      console.error("Update appointment status error:", err);
      showToast(
        err.message || "Không thể cập nhật trạng thái lịch hẹn.",
        "error"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStartExam = (appointment) => {
    if (!appointment) return;

    navigate(
      `/doctor/workspace?patientId=${encodeURIComponent(
        appointment.patientId ?? ""
      )}&appointmentId=${encodeURIComponent(appointment.appointmentId)}`
    );
  };

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const searchable = [
        appointment.appointmentId,
        appointment.patientId,
        appointment.doctorName,
        appointment.clinicName,
        appointment.specialtyName,
        appointment.roomName,
        appointment.roomCode,
        appointment.reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !query || searchable.includes(query);
    });
  }, [appointments, search]);

  const canConfirm = (appointment) => appointment.status === "PENDING";
  const canComplete = (appointment) => appointment.status === "CONFIRMED";
  const isFinalStatus = (appointment) =>
    ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appointment.status);

  if (authLoading) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${toast.type === "error" ? "bg-rose-700" : "bg-slate-900"
            }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Quản Lý Lịch Hẹn Khám Bệnh
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Bác sĩ:{" "}
            <b className="text-slate-800">
              {doctor?.fullName || user?.fullName || "Bác sĩ"}
            </b>
            {doctor?.specialties?.length > 0 && (
              <>
                {" "}• Chuyên khoa:{" "}
                <b className="text-slate-800">
                  {doctor.specialties
                    .map((item) => item.specialtyName || item.name)
                    .filter(Boolean)
                    .join(", ")}
                </b>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setDateFilter(new Date().toLocaleDateString("en-CA"))
            }
            className="px-3 py-2 rounded-xl text-xs font-bold border bg-white text-slate-700 hover:bg-slate-50"
          >
            Hôm nay
          </button>

          <button
            onClick={() => loadAppointments()}
            disabled={loading}
            className="px-3 py-2 rounded-xl text-xs font-bold border bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm mã lịch hẹn, mã bệnh nhân, lý do khám..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="sm:col-span-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Đang chờ</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="NO_SHOW">Không đến</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>

        <div className="sm:col-span-1 flex items-center justify-end">
          <button
            onClick={() => {
              setSearch("");
              setDateFilter("");
              setStatusFilter("ALL");
            }}
            title="Đặt lại bộ lọc"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Danh sách lịch hẹn ({filteredAppointments.length})
          </span>
          <span className="text-xs text-slate-400">
            Dữ liệu từ Appointment Service
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-slate-500">
            Đang tải lịch hẹn...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium">
              Không tìm thấy lịch hẹn phù hợp.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAppointments.map((apt) => (
              <div
                key={apt.appointmentId}
                className="p-4 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-14 min-h-14 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-800 font-bold flex flex-col items-center justify-center shrink-0 p-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-600 mb-1" />
                    <span className="text-xs">
                      {formatTime(apt.startTime)}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {`Bệnh nhân: ${apt.patientName || `Bệnh nhân #${apt.patientId ?? "N/A"}`}`}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-cyan-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {apt.appointmentId}
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${STATUS_BADGES[apt.status] ||
                          "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                      >
                        {STATUS_LABELS[apt.status] || apt.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-y-1 gap-x-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(apt.appointmentDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DoorOpen className="w-3 h-3 text-slate-400" />
                        {apt.roomName
                          ? `${apt.roomName}${apt.roomCode ? ` (${apt.roomCode})` : ""}`
                          : apt.roomCode || "Chưa xếp phòng"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                      {apt.doctorName && (
                        <span>Bác sĩ: {apt.doctorName}</span>
                      )}
                      {apt.specialtyName && (
                        <span>Chuyên khoa: {apt.specialtyName}</span>
                      )}
                      {apt.clinicName && <span>Cơ sở: {apt.clinicName}</span>}
                    </div>

                    {apt.reason && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100 max-w-xl">
                        Lý do khám: {apt.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedApt(apt)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Chi tiết
                  </button>

                  {canConfirm(apt) && (
                    <button
                      disabled={updatingId === apt.appointmentId}
                      onClick={() =>
                        handleUpdateStatus(apt.appointmentId, "CONFIRMED")
                      }
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Xác nhận
                    </button>
                  )}

                  {canComplete(apt) && (
                    <>
                      <button
                        onClick={() => handleStartExam(apt)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        Bắt đầu khám
                      </button>
                      <button
                        disabled={updatingId === apt.appointmentId}
                        onClick={() =>
                          handleUpdateStatus(apt.appointmentId, "NO_SHOW")
                        }
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl disabled:opacity-50"
                      >
                        Không đến
                      </button>
                    </>
                  )}

                  {apt.status === "COMPLETED" && (
                    <button
                      onClick={() => navigate("/doctor/records")}
                      className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold text-xs rounded-xl border border-cyan-200 flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Xem bệnh án
                    </button>
                  )}

                  {isFinalStatus(apt) && apt.status !== "COMPLETED" && (
                    <span className="text-xs text-slate-400">
                      Không còn thao tác
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedApt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Chi tiết lịch hẹn
              </h3>
              <button
                onClick={() => setSelectedApt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Mã lịch hẹn:</span>
                <span className="font-mono font-bold text-slate-800 break-all text-right">
                  {selectedApt.appointmentId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bệnh nhân:</span>
                <span className="font-bold text-slate-800">
                  {selectedApt.patientName ||
                    (selectedApt.patientId != null
                      ? `Bệnh nhân #${selectedApt.patientId}`
                      : "Chưa có thông tin")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bác sĩ:</span>
                <span className="font-bold text-slate-800">
                  {selectedApt.doctorName || doctor?.fullName || "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Chuyên khoa:</span>
                <span className="font-medium text-slate-700 text-right">
                  {selectedApt.specialtyName || "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Phòng:</span>
                <span className="font-medium text-slate-700 text-right">
                  {selectedApt.roomName
                    ? `${selectedApt.roomName}${selectedApt.roomCode ? ` (${selectedApt.roomCode})` : ""
                    }`
                    : selectedApt.roomCode || "Chưa xếp phòng"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Cơ sở:</span>
                <span className="font-medium text-slate-700 text-right">
                  {selectedApt.clinicName || "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Ngày khám:</span>
                <span className="font-bold text-cyan-700">
                  {formatDate(selectedApt.appointmentDate)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Giờ khám:</span>
                <span className="font-mono font-bold text-cyan-700">
                  {formatTime(selectedApt.startTime)} -{" "}
                  {formatTime(selectedApt.endTime)}
                </span>
              </div>
              <div className="flex justify-between gap-4 items-center">
                <span className="text-slate-500">Trạng thái:</span>
                <span
                  className={`px-2.5 py-1 rounded-full font-bold border ${STATUS_BADGES[selectedApt.status] || ""
                    }`}
                >
                  {STATUS_LABELS[selectedApt.status] || selectedApt.status}
                </span>
              </div>
              {selectedApt.reason && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">
                    Lý do khám:
                  </span>
                  <p className="text-slate-800 bg-white p-2 rounded-lg border border-slate-200">
                    {selectedApt.reason}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedApt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Đóng
              </button>

              {canConfirm(selectedApt) && (
                <button
                  disabled={updatingId === selectedApt.appointmentId}
                  onClick={() =>
                    handleUpdateStatus(
                      selectedApt.appointmentId,
                      "CONFIRMED"
                    )
                  }
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl disabled:opacity-50"
                >
                  Xác nhận lịch
                </button>
              )}

              {canComplete(selectedApt) && (
                <button
                  onClick={() => handleStartExam(selectedApt)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Stethoscope className="w-4 h-4" />
                  Bắt đầu khám
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
