import React, { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Calendar,
  FileText,
  Activity,
  Clock,
  Search,
  LoaderCircle,
  AlertCircle,
  Filter,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/$/, "");

const STATUS_MAP = {
  PENDING: {
    label: "Đang chờ",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  CONFIRMED: {
    label: "Xác nhận",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  NO_SHOW: {
    label: "Vắng mặt",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const getToken = () => {
  // Ưu tiên các tên key thường dùng trong ứng dụng.
  // Nếu AuthContext lưu token ở nơi khác, hãy đổi hàm này.
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token")
  );
};

const formatDate = (date) => {
  if (!date) return "Chưa có ngày";

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return parsedDate.toLocaleDateString("vi-VN");
};

const formatTime = (time) => {
  if (!time) return "Chưa có giờ";

  // Hỗ trợ cả HH:mm:ss và HH:mm
  return time.slice(0, 5);
};

const getStatus = (status) => {
  return (
    STATUS_MAP[String(status || "").toUpperCase()] || {
      label: status || "Không xác định",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    }
  );
};

export const PatientDashboard = () => {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [patient, setPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAppointments = async () => {
      setLoading(true);
      setError("");

      try {
        const token = getToken();

        if (!token) {
          throw new Error(
            "Bạn chưa đăng nhập hoặc không tìm thấy access token."
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/appointments/my`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            signal: controller.signal,
          }
        );

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Phiên đăng nhập không hợp lệ hoặc bạn không có quyền xem lịch hẹn."
          );
        }

        if (!response.ok) {
          throw new Error(
            `Không thể tải lịch hẹn (HTTP ${response.status}).`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "Dữ liệu lịch hẹn trả về không đúng định dạng danh sách."
          );
        }

        setAppointments(data);
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Lỗi tải lịch hẹn:", err);
        setError(
          err.message ||
          "Đã xảy ra lỗi khi tải danh sách lịch hẹn."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAppointments();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchMyPatient = async () => {
      setPatientLoading(true);

      try {
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("token");

        if (!token) {
          throw new Error("Không tìm thấy access token.");
        }

        const response = await fetch(
          `${API_BASE_URL}/api/v1/patients/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Không thể tải hồ sơ bệnh nhân (HTTP ${response.status}).`
          );
        }

        const data = await response.json();
        setPatient(data);
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Lỗi tải hồ sơ bệnh nhân:", err);
        setPatient(null);
      } finally {
        if (!controller.signal.aborted) {
          setPatientLoading(false);
        }
      }
    };

    fetchMyPatient();

    return () => controller.abort();
  }, []);

  // Tìm kiếm theo mã lịch, bác sĩ hoặc chuyên khoa.
  const filteredAppointments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return appointments.filter((apt) => {
      const appointmentId = String(
        apt.appointmentId || apt.id || ""
      );

      const doctorName = String(
        apt.doctorName || ""
      );

      const specialtyName = String(
        apt.specialtyName || ""
      );

      const matchesSearch =
        !keyword ||
        appointmentId.toLowerCase().includes(keyword) ||
        doctorName.toLowerCase().includes(keyword) ||
        specialtyName.toLowerCase().includes(keyword);

      const matchesStatus =
        selectedStatus === "ALL" ||
        String(apt.status || "").toUpperCase() === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, selectedStatus]);

  // Thống kê từ dữ liệu API, không dùng số liệu giả.
  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return appointments
      .filter((apt) => {
        const status = String(apt.status || "").toUpperCase();
        const date = apt.appointmentDate
          ? new Date(`${apt.appointmentDate}T00:00:00`)
          : null;

        return (
          date &&
          !Number.isNaN(date.getTime()) &&
          date >= today &&
          ["PENDING", "CONFIRMED"].includes(status)
        );
      })
      .sort((a, b) => {
        const dateA = `${a.appointmentDate}T${a.startTime || "00:00:00"}`;
        const dateB = `${b.appointmentDate}T${b.startTime || "00:00:00"}`;
        return dateA.localeCompare(dateB);
      });
  }, [appointments]);

  const completedCount = appointments.filter(
    (apt) => String(apt.status).toUpperCase() === "COMPLETED"
  ).length;

  const nextAppointment = upcomingAppointments[0];

  return (
    <div className="space-y-6">
      {/* Banner chào mừng */}
      <div className="bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 p-6 rounded-2xl shadow-md text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Xin chào, {user?.name || "bạn"}! 👋
          </h1>

          <p className="text-cyan-100 text-sm mt-1">
            Mã định danh:{" "}
            <span className="font-mono font-bold text-white">
              {patient?.patientCode || "Chưa cập nhật"}
            </span>
          </p>
        </div>

        <Link
          to="/patient/ai-chat"
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-cyan-50 text-cyan-700 font-bold text-sm flex items-center gap-2 shadow-sm transition"
        >
          <Bot className="w-4 h-4 text-cyan-600" />
          Tư vấn AI Triage ngay
        </Link>
      </div>

      {/* Thẻ thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600 border border-cyan-100">
            <Calendar className="w-6 h-6" />
          </div>

          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">
              Lịch hẹn sắp tới
            </p>

            {loading ? (
              <p className="text-sm text-slate-400 mt-1">
                Đang tải...
              </p>
            ) : nextAppointment ? (
              <>
                <p className="text-lg font-bold text-slate-800">
                  {formatTime(nextAppointment.startTime)} -{" "}
                  {formatDate(nextAppointment.appointmentDate)}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  BS. {nextAppointment.doctorName || "Chưa cập nhật"}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-slate-600 mt-1">
                Chưa có lịch hẹn
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <FileText className="w-6 h-6" />
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium">
              Lịch khám đã hoàn thành
            </p>
            <p className="text-lg font-bold text-slate-800">
              {loading ? "..." : `${completedCount} lịch khám`}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600 border border-purple-100">
            <Activity className="w-6 h-6" />
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium">
              Tổng số lịch hẹn
            </p>
            <p className="text-lg font-bold text-slate-800">
              {loading ? "..." : `${appointments.length} lịch hẹn`}
            </p>
          </div>
        </div>
      </div>

      {/* Danh sách lịch hẹn */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-600" />
            Lịch khám đã đặt
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã lịch, bác sĩ, chuyên khoa..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>

            <div className="relative">
              <Filter className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Đang chờ</option>
                <option value="CONFIRMED">Xác nhận</option>
                <option value="COMPLETED">Đã hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
                <option value="NO_SHOW">Vắng mặt</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trạng thái tải dữ liệu */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-500 text-sm">
            <LoaderCircle className="w-5 h-5 animate-spin text-cyan-600" />
            Đang tải lịch hẹn...
          </div>
        )}

        {/* Trạng thái lỗi */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />

            <div>
              <p className="text-sm font-semibold text-red-700">
                Không thể tải lịch hẹn
              </p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <p className="text-xs text-red-500 mt-2">
                Hãy kiểm tra đăng nhập, URL API và trạng thái của backend.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 rounded-l-lg">Mã lịch</th>
                  <th className="p-3.5">Bác sĩ</th>
                  <th className="p-3.5">Chuyên khoa</th>
                  <th className="p-3.5">Thời gian</th>
                  <th className="p-3.5 rounded-r-lg">Trạng thái</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((apt) => {
                    const id = apt.appointmentId || apt.id;
                    const status = getStatus(apt.status);

                    return (
                      <tr
                        key={id}
                        className="hover:bg-slate-50 transition"
                      >
                        <td className="p-3.5 font-mono font-bold text-cyan-600 whitespace-nowrap">
                          {id || "—"}
                        </td>

                        <td className="p-3.5 font-bold text-slate-800">
                          {apt.doctorName || "Chưa cập nhật"}
                        </td>

                        <td className="p-3.5">
                          {apt.specialtyName || "Chưa cập nhật"}
                        </td>

                        <td className="p-3.5 font-medium whitespace-nowrap">
                          {formatTime(apt.startTime)}
                          {" - "}
                          {formatDate(apt.appointmentDate)}
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-sm text-slate-400 font-medium"
                    >
                      {appointments.length === 0
                        ? "Bạn chưa có lịch khám nào."
                        : "Không tìm thấy lịch khám phù hợp."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && appointments.length > 0 && (
          <p className="text-xs text-slate-400">
            Hiển thị {filteredAppointments.length} / {appointments.length} lịch hẹn
          </p>
        )}
      </div>
    </div>
  );
};
