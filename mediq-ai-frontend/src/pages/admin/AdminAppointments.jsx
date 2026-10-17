
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  X,
  Calendar,
  Clock,
  DoorOpen,
  User,
  Stethoscope,
  Check,
  CheckCircle2,
  XCircle,
  Hourglass,
  RefreshCw,
  Eye,
} from "lucide-react";
import {
  getAppointments,
  getAppointmentById,
} from "../../services/appointmentService";

const STATUS_CONFIG = {
  CONFIRMED: {
    label: "Đã xác nhận",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  PENDING: {
    label: "Đang chờ",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
    icon: Hourglass,
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    dot: "bg-cyan-500",
    icon: Check,
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
    icon: XCircle,
  },
  NO_SHOW: {
    label: "Không đến khám",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-500",
    icon: XCircle,
  },
};

const STATUS_LIST = Object.keys(STATUS_CONFIG);

const formatDate = (date) => {
  if (!date) return "—";

  const parts = String(date).split("-");
  if (parts.length !== 3) return date;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const formatTime = (time) => {
  if (!time) return "—";
  return String(time).slice(0, 5);
};

const getStatus = (status) => {
  return STATUS_CONFIG[String(status || "").toUpperCase()] || {
    label: status || "Chưa xác định",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    icon: Hourglass,
  };
};

const getId = (value) => value == null ? "" : String(value);

export const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadAppointments = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getAppointments();

        if (!Array.isArray(data)) {
          throw new Error(
            "API không trả về danh sách lịch hẹn dạng mảng. Hãy kiểm tra cấu trúc response của backend."
          );
        }

        if (!cancelled) {
          setAppointments(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Không thể tải danh sách lịch hẹn.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return appointments
      .filter((a) => {
        const id = getId(a.appointmentId);
        const patientId = getId(a.patientId);
        const doctorId = getId(a.doctorId);
        const specialtyId = getId(a.specialtyId);
        const roomId = getId(a.roomId);

        const searchable = [
          id,
          patientId,
          doctorId,
          specialtyId,
          roomId,
          a.reason,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = searchable.includes(q);

        const matchesStatus =
          statusFilter === "ALL" ||
          String(a.status || "").toUpperCase() === statusFilter;

        const matchesDate =
          !dateFilter || a.appointmentDate === dateFilter;

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        // Ngày hẹn mới nhất lên đầu
        const dateA = String(a.appointmentDate || "");
        const dateB = String(b.appointmentDate || "");

        if (dateA !== dateB) {
          return dateB.localeCompare(dateA);
        }

        // Nếu cùng ngày, giờ hẹn muộn hơn lên trước
        const timeA = String(a.startTime || "");
        const timeB = String(b.startTime || "");

        return timeB.localeCompare(timeA);
      });
  }, [appointments, search, statusFilter, dateFilter]);


  const statusCounts = useMemo(() => {
    return STATUS_LIST.reduce((acc, status) => {
      acc[status] = appointments.filter(
        (a) => String(a.status).toUpperCase() === status
      ).length;
      return acc;
    }, {});
  }, [appointments]);

  const openDetail = async (appointment) => {
    setSelected(appointment);
    setDetailLoading(true);
    setDetailError("");

    try {
      const detail = await getAppointmentById(
        appointment.appointmentId
      );
      setSelected(detail);
    } catch (err) {
      // Giữ dữ liệu từ danh sách để admin vẫn xem được thông tin cơ bản.
      setDetailError(
        err.message || "Không thể tải chi tiết lịch hẹn."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setDateFilter("");
  };

  const detailFields = selected
    ? [
      ["Mã lịch hẹn", selected.appointmentId],
      ["Bệnh nhân", selected.patientNames || selected.patientId],
      ["Bác sĩ", selected.doctorNames || selected.doctorId],
      ["Chuyên khoa", selected.specialtyNames || selected.specialtyId],
      ["Phòng khám", selected.clinicNames || selected.clinicId],
      ["Phòng", selected.roomNames || selected.roomId],
      ["Giờ hẹn", selected.startTime],
      ["Ngày hẹn", formatDate(selected.appointmentDate)],
      ["Giờ bắt đầu", formatTime(selected.startTime)],
      ["Giờ kết thúc", formatTime(selected.endTime)],
      ["Lý do khám", selected.reason],
      ["Ngày tạo", selected.createdAt],
      ["Cập nhật lần cuối", selected.updatedAt],
    ]
    : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản Lý Lịch Hẹn
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tổng cộng{" "}
            <span className="font-bold text-slate-700">
              {appointments.length}
            </span>{" "}
            lịch hẹn
          </p>
        </div>

        <button
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STATUS_LIST.map((status) => {
          const config = getStatus(status);
          const Icon = config.icon;

          return (
            <button
              key={status}
              onClick={() =>
                setStatusFilter(
                  statusFilter === status ? "ALL" : status
                )
              }
              className={`rounded-xl border bg-white p-3 text-left transition-all hover:shadow-sm ${statusFilter === status
                ? "border-cyan-400 ring-2 ring-cyan-100"
                : "border-slate-200"
                }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-600">
                  {config.label}
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {statusCounts[status] || 0}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã lịch hẹn, bệnh nhân, bác sĩ..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
          />
        </div>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-cyan-400 focus:outline-none"
        />

        {(dateFilter || statusFilter !== "ALL" || search) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
          >
            <X className="h-3 w-3" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Loading and error */}
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{error}</p>
          <button
            onClick={() => setRefreshKey((key) => key + 1)}
            className="font-bold underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
          <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin" />
          Đang tải dữ liệu lịch hẹn...
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {[
                    "Mã lịch hẹn",
                    "Bệnh nhân",
                    "Bác sĩ / Chuyên khoa",
                    "Ngày & giờ",
                    "Phòng",
                    "Trạng thái",
                    "Thao tác",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap p-4 text-left text-xs font-bold uppercase text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-sm text-slate-400"
                    >
                      {error
                        ? "Không tải được dữ liệu từ API."
                        : "Không tìm thấy lịch hẹn nào."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => {
                    const config = getStatus(a.status);

                    return (
                      <tr
                        key={a.appointmentId}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="p-4">
                          <p className="font-mono text-xs font-bold text-cyan-700">
                            {a.appointmentId}
                          </p>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="text-xs text-slate-700">
                              {a.patientNames || a.patientId || "—"}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 shrink-0 text-slate-400" />
                            <div>
                              <p className="text-xs font-semibold text-slate-800">
                                {a.doctorNames || a.doctorId || "—"}
                              </p>
                              <p className="mt-0.5 text-[11px] text-cyan-600">
                                {a.specialtyNames || a.specialtyId || "Chưa có chuyên khoa"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <p className="flex items-center gap-1 text-xs font-bold text-slate-800">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {formatDate(a.appointmentDate)}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                            <Clock className="h-3 w-3" />
                            {formatTime(a.startTime)}
                            {" – "}
                            {formatTime(a.endTime)}
                          </p>
                        </td>

                        <td className="p-4">
                          <p className="flex items-center gap-1 text-xs text-slate-700">
                            <DoorOpen className="h-3 w-3 text-slate-400" />
                            {a.roomNames || a.roomId || "—"}
                          </p>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${config.color}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                            {config.label}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <button
                            onClick={() => openDetail(a)}
                            title="Xem chi tiết"
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-cyan-50 hover:text-cyan-600"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div className="border-t border-slate-100 px-4 py-3 text-xs font-medium text-slate-400">
              Hiển thị {filtered.length} / {appointments.length} lịch hẹn
            </div>
          </div>
        </>
      )}

      {/* Detail modal: read-only */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => {
            setSelected(null);
            setDetailError("");
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Chi tiết lịch hẹn
                </h2>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {selected.appointmentId}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelected(null);
                  setDetailError("");
                }}
                className="rounded-lg p-2 hover:bg-slate-200"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {detailLoading && (
                <p className="text-sm text-slate-500">
                  Đang tải chi tiết...
                </p>
              )}

              {detailError && (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                  {detailError}
                </p>
              )}

              <div>
                <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                  Trạng thái hiện tại
                </p>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${getStatus(selected.status).color}`}
                >
                  {getStatus(selected.status).label}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {detailFields.map(([label, value]) => (
                  <div
                    key={label}
                    className="min-w-0 rounded-xl border border-slate-100 p-3"
                  >
                    <p className="mb-1 text-xs text-slate-500">
                      {label}
                    </p>
                    <p className="break-words text-sm font-semibold text-slate-800">
                      {value == null || value === ""
                        ? "—"
                        : String(value)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button
                  onClick={() => {
                    setSelected(null);
                    setDetailError("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;
