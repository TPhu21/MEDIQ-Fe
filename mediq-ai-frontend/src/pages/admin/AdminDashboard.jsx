import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Stethoscope,
  CalendarCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  X,
  RefreshCw,
  Activity,
} from "lucide-react";

import {
  getAllAppointments,
  getAllUsers,
  getAllPatients,
  getAllDoctors,
  getSpecialties,
} from "../../api/adminApi";

const TIME_RANGES = [
  { key: "today", label: "Hôm nay" },
  { key: "7days", label: "7 ngày" },
  { key: "30days", label: "30 ngày" },
  { key: "3months", label: "3 tháng" },
];

const STATUS_CONFIG = [
  { key: "CONFIRMED", label: "Xác nhận", color: "#10b981" },
  { key: "PENDING", label: "Đang chờ", color: "#f59e0b" },
  { key: "COMPLETED", label: "Đã hoàn thành", color: "#06b6d4" },
  { key: "CANCELLED", label: "Đã hủy", color: "#f43f5e" },
];

const SPECIALTY_COLORS = [
  "#f43f5e",
  "#06b6d4",
  "#10b981",
  "#a855f7",
  "#f59e0b",
  "#6366f1",
];

const normalizeArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) {
    return response.data.content;
  }
  return [];
};

const localDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeStatus = (status) =>
  String(status || "").trim().toUpperCase();

const formatNumber = (number) =>
  Number(number || 0).toLocaleString("vi-VN");

const getDoctorName = (doctor) =>
  doctor.fullName ||
  doctor.name ||
  doctor.doctorName ||
  "Bác sĩ chưa có tên";

const getDoctorSpecialty = (doctor) =>
  doctor.specialtyName ||
  doctor.specialtyNames ||
  doctor.specialty ||
  "Chưa xác định";

const getDoctorStatus = (doctor) => {
  const status = normalizeStatus(doctor.status);

  if (
    ["ACTIVE", "AVAILABLE", "ON_DUTY", "ĐANG TRỰC"].includes(status)
  ) {
    return "Đang hoạt động";
  }

  if (["INACTIVE", "OFFLINE", "ON_LEAVE", "NGHỈ PHÉP"].includes(status)) {
    return "Không hoạt động";
  }

  return doctor.status || "Chưa xác định";
};

const getAppointmentStatusLabel = (status) => {
  const normalized = normalizeStatus(status);

  return (
    STATUS_CONFIG.find((item) => item.key === normalized)?.label ||
    status ||
    "Chưa xác định"
  );
};

const isStatus = (appointment, status) =>
  normalizeStatus(appointment.status) === status;

const buildDayChart = (appointments) => {
  const groups = {};

  appointments.forEach((appointment) => {
    const time = appointment.startTime?.slice(0, 5) || "00:00";

    if (!groups[time]) {
      groups[time] = {
        label: time,
        apt: 0,
        done: 0,
        cancel: 0,
      };
    }

    groups[time].apt += 1;

    if (isStatus(appointment, "COMPLETED")) {
      groups[time].done += 1;
    }

    if (isStatus(appointment, "CANCELLED")) {
      groups[time].cancel += 1;
    }
  });

  return Object.values(groups).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
};

const buildAppointmentChart = (appointments, range) => {
  if (range === "today") {
    return buildDayChart(appointments);
  }

  const groups = {};

  appointments.forEach((appointment) => {
    const date = appointment.appointmentDate;

    if (!date) return;

    let label = date;

    if (range === "7days") {
      const [year, month, day] = date.split("-");
      label = `${day}/${month}`;
    } else if (range === "30days") {
      const day = Number(date.slice(8, 10));
      label = `Tuần ${Math.ceil(day / 7)}`;
    } else {
      const [year, month] = date.split("-");
      label = `${month}/${year}`;
    }

    if (!groups[label]) {
      groups[label] = {
        label,
        apt: 0,
        done: 0,
        cancel: 0,
        sortDate: date,
      };
    }

    groups[label].apt += 1;

    if (isStatus(appointment, "COMPLETED")) {
      groups[label].done += 1;
    }

    if (isStatus(appointment, "CANCELLED")) {
      groups[label].cancel += 1;
    }
  });

  return Object.values(groups)
    .sort((a, b) => a.sortDate.localeCompare(b.sortDate))
    .map(({ sortDate, ...item }) => item);
};

const buildSpecialties = (appointments) => {
  const groups = {};

  appointments.forEach((appointment) => {
    const name = appointment.specialtyNames || "Chưa xác định";
    groups[name] = (groups[name] || 0) + 1;
  });

  return Object.entries(groups)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .map((item, index) => ({
      ...item,
      color: SPECIALTY_COLORS[index % SPECIALTY_COLORS.length],
    }));
};

const Panel = ({ title, children, className = "" }) => (
  <section
    className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
  >
    <h3 className="mb-4 text-sm font-bold text-slate-900">{title}</h3>
    {children}
  </section>
);

const KpiCard = ({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
}) => (
  <div
    className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-md ${gradient}`}
  >
    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
    <div className="absolute -right-2 bottom-2 h-14 w-14 rounded-full bg-white/10" />

    <div className="relative">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 break-words text-3xl font-black tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-sm font-semibold opacity-90">{label}</p>
      <p className="mt-1 text-[11px] opacity-75">{sub}</p>
    </div>
  </div>
);

const BarChart = ({ data }) => {
  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-slate-400">
        Không có dữ liệu lịch khám trong khoảng thời gian này
      </div>
    );
  }

  const max = Math.max(...data.map((item) => item.apt), 1);

  return (
    <div className="flex h-full items-end gap-2 overflow-x-auto pb-1">
      {data.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
          title={`${item.label}: ${item.apt} lịch, ${item.done} hoàn thành`}
        >
          <div className="flex h-full w-full items-end justify-center gap-1">
            <div
              className="w-1/2 max-w-7 rounded-t-md bg-cyan-500/90 transition-all"
              style={{
                height: `${Math.max((item.apt / max) * 100, item.apt ? 2 : 0)}%`,
              }}
            />
            <div
              className="w-1/2 max-w-7 rounded-t-md bg-emerald-500/90 transition-all"
              style={{
                height: `${Math.max((item.done / max) * 100, item.done ? 2 : 0)}%`,
              }}
            />
          </div>

          <span className="mt-2 w-full truncate text-center text-[10px] text-slate-400">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (!total) {
    return (
      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-8 border-slate-100 text-xs text-slate-400">
        Chưa có dữ liệu
      </div>
    );
  }

  let offset = 0;

  const segments = data.map((item) => {
    const percentage = (item.count / total) * 100;
    const segment = { ...item, percentage, offset };
    offset += percentage;
    return segment;
  });

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
        <circle
          cx="21"
          cy="21"
          r="15.915"
          fill="transparent"
          stroke="#f1f5f9"
          strokeWidth="7"
        />

        {segments.map((item, index) => (
          <circle
            key={`${item.label}-${index}`}
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke={item.color}
            strokeWidth="7"
            strokeDasharray={`${item.percentage} ${100 - item.percentage}`}
            strokeDashoffset={-item.offset}
          />
        ))}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-black text-slate-800">
          {formatNumber(total)}
        </span>
        <span className="text-[9px] text-slate-400">lượt khám</span>
      </div>
    </div>
  );
};

export const AdminDashboard = () => {
  const [range, setRange] = useState("7days");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        getAllAppointments(),
        getAllUsers(),
        getAllPatients(),
        getAllDoctors(),
        getSpecialties(),
      ]);

      if (cancelled) return;

      const [
        appointmentsResult,
        usersResult,
        patientsResult,
        doctorsResult,
        specialtiesResult,
      ] = results;

      const read = (result) =>
        result.status === "fulfilled"
          ? normalizeArray(result.value)
          : [];

      setAppointments(read(appointmentsResult));
      setUsers(read(usersResult));
      setPatients(read(patientsResult));
      setDoctors(read(doctorsResult));
      setSpecialties(read(specialtiesResult));

      const failedNames = [
        "lịch khám",
        "người dùng",
        "bệnh nhân",
        "bác sĩ",
        "chuyên khoa",
      ].filter((_, index) => results[index].status === "rejected");

      if (failedNames.length) {
        setError(
          `Không tải được dữ liệu: ${failedNames.join(", ")}. Kiểm tra API, token đăng nhập và kết nối backend.`
        );
      }

      setLastUpdated(new Date());
      setLoading(false);
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const isCustomDate = showDatePicker && Boolean(customDate);

  const selectedAppointments = useMemo(() => {
    if (isCustomDate) {
      return appointments.filter(
        (appointment) =>
          appointment.appointmentDate === customDate
      );
    }

    const today = localDateString();
    const end = new Date(`${today}T00:00:00`);
    const start = new Date(end);

    if (range === "today") {
      // Chỉ lấy lịch trong ngày hiện tại.
    } else if (range === "7days") {
      start.setDate(start.getDate() - 6);
    } else if (range === "30days") {
      start.setDate(start.getDate() - 29);
    } else {
      start.setMonth(start.getMonth() - 2);
      start.setDate(1);
    }

    const startString = localDateString(start);

    return appointments.filter(
      (appointment) =>
        appointment.appointmentDate &&
        appointment.appointmentDate >= startString &&
        appointment.appointmentDate <= today
    );
  }, [appointments, range, isCustomDate, customDate]);

  const countStatus = (status) =>
    selectedAppointments.filter((appointment) =>
      isStatus(appointment, status)
    ).length;

  const totalAppointments = selectedAppointments.length;
  const confirmedCount = countStatus("CONFIRMED");
  const pendingCount = countStatus("PENDING");
  const completedCount = countStatus("COMPLETED");
  const cancelledCount = countStatus("CANCELLED");

  const completionRate = totalAppointments
    ? (completedCount / totalAppointments) * 100
    : 0;

  const cancellationRate = totalAppointments
    ? (cancelledCount / totalAppointments) * 100
    : 0;

  const activeChart = useMemo(
    () => buildAppointmentChart(selectedAppointments, range),
    [selectedAppointments, range]
  );

  const activeSpecialties = useMemo(
    () => buildSpecialties(selectedAppointments),
    [selectedAppointments]
  );

  const maxSpecialty = Math.max(
    ...activeSpecialties.map((item) => item.count),
    1
  );

  const statusDistribution = STATUS_CONFIG.map((status) => ({
    label: status.label,
    count: countStatus(status.key),
    color: status.color,
  }));

  const activeDoctors = doctors.filter((doctor) =>
    ["ACTIVE", "AVAILABLE", "ON_DUTY", "ĐANG TRỰC"].includes(
      normalizeStatus(doctor.status)
    )
  );

  const todayString = localDateString();

  const todayAppointments = appointments.filter(
    (appointment) => appointment.appointmentDate === todayString
  );

  const todayCancelled = todayAppointments.filter((appointment) =>
    isStatus(appointment, "CANCELLED")
  ).length;

  const todayCompleted = todayAppointments.filter((appointment) =>
    isStatus(appointment, "COMPLETED")
  ).length;

  const todayCancellationRate = todayAppointments.length
    ? (todayCancelled / todayAppointments.length) * 100
    : 0;

  const newPatients = patients.filter((patient) => {
    const createdAt = patient.createdAt;

    if (!createdAt) return false;

    const createdDate = String(createdAt).slice(0, 10);
    const start = new Date();
    start.setDate(start.getDate() - 6);

    return createdDate >= localDateString(start) &&
      createdDate <= todayString;
  }).length;

  const kpiCards = [
    {
      label: "Tổng Người Dùng",
      value: formatNumber(users.length),
      sub: "Số tài khoản trả về từ API",
      icon: Users,
      gradient: "bg-gradient-to-br from-cyan-500 to-cyan-700",
    },
    {
      label: "Bác Sĩ",
      value: formatNumber(doctors.length),
      sub: `${formatNumber(activeDoctors.length)} đang hoạt động theo trạng thái API`,
      icon: Stethoscope,
      gradient: "bg-gradient-to-br from-indigo-500 to-indigo-700",
    },
    {
      label: isCustomDate
        ? "Lịch Hẹn Ngày Đã Chọn"
        : range === "today"
          ? "Lịch Hẹn Hôm Nay"
          : "Tổng Lịch Hẹn",
      value: formatNumber(totalAppointments),
      sub: `${confirmedCount} xác nhận · ${cancelledCount} đã hủy`,
      icon: CalendarCheck,
      gradient: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    },
    {
      label: "Tỷ Lệ Hoàn Thành",
      value: `${completionRate.toFixed(1)}%`,
      sub: `${completedCount}/${totalAppointments} lịch hoàn thành`,
      icon: TrendingUp,
      gradient: "bg-gradient-to-br from-rose-500 to-rose-700",
    },
  ];

  const formatCustomDate = (value) => {
    if (!value) return "";

    const [year, month, day] = value.split("-");
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    ).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const rangeLabel = {
    today: "giờ",
    "7days": "ngày",
    "30days": "ngày",
    "3months": "tháng",
  }[range];

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Bảng Điều Khiển Quản Trị
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Tổng quan hệ thống MEDIQ AI
            {lastUpdated && (
              <>
                {" "}· Cập nhật lúc{" "}
                {lastUpdated.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Làm mới
          </button>

          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {TIME_RANGES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setRange(item.key);
                  setShowDatePicker(false);
                  setCustomDate("");
                }}
                className={`px-3 py-2 text-xs font-bold transition-all ${!showDatePicker && range === item.key
                    ? "bg-cyan-600 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                {item.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowDatePicker((value) => !value)}
              className={`flex items-center gap-1.5 border-l border-slate-200 px-3 py-2 text-xs font-bold ${showDatePicker
                  ? "bg-violet-600 text-white"
                  : "text-slate-500 hover:bg-slate-50"
                }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Ngày cụ thể
            </button>
          </div>

          {showDatePicker && (
            <div className="flex items-center gap-2 rounded-xl border border-violet-300 bg-white px-3 py-1.5 shadow-sm">
              <CalendarDays className="h-4 w-4 text-violet-500" />

              <input
                type="date"
                value={customDate}
                max={todayString}
                onChange={(event) =>
                  setCustomDate(event.target.value)
                }
                className="cursor-pointer bg-transparent text-xs font-semibold text-slate-700 outline-none"
              />

              {customDate && (
                <button
                  type="button"
                  onClick={() => setCustomDate("")}
                  className="rounded-md p-0.5 hover:bg-slate-100"
                >
                  <X className="h-3.5 w-3.5 text-slate-400" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* LOADING / ERROR */}
      {loading && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-700">
          Đang tải dữ liệu từ backend...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {/* CUSTOM DATE */}
      {isCustomDate && (
        <div className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-violet-600" />

            <span className="text-sm font-bold text-violet-800">
              Đang xem: {formatCustomDate(customDate)}
            </span>

            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
              {totalAppointments} lịch hẹn
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setCustomDate("");
              setShowDatePicker(false);
            }}
            className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800"
          >
            <X className="h-3.5 w-3.5" />
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      {/* CHART + SPECIALTIES */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel
          title={`Thống Kê Lịch Hẹn · theo ${isCustomDate ? "giờ trong ngày" : rangeLabel}`}
          className="lg:col-span-3"
        >
          <div className="mb-4 flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-500">
            <span>
              Tổng:{" "}
              <strong className="text-slate-800">
                {formatNumber(totalAppointments)}
              </strong>
            </span>
            <span>
              Hoàn thành:{" "}
              <strong className="text-emerald-600">
                {formatNumber(completedCount)}
              </strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500" />
              Tổng lịch
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              Hoàn thành
            </span>
          </div>

          <div className="h-44">
            <BarChart data={activeChart} />
          </div>
        </Panel>

        <Panel title="Phân Bổ Chuyên Khoa" className="lg:col-span-2">
          <div className="flex items-center gap-4">
            <DonutChart data={activeSpecialties.map((item) => ({
              label: item.name,
              count: item.count,
              color: item.color,
            }))} />

            <div className="min-w-0 flex-1 space-y-2">
              {activeSpecialties.length === 0 ? (
                <p className="text-xs italic text-slate-400">
                  Không có dữ liệu chuyên khoa trong kỳ.
                </p>
              ) : (
                activeSpecialties.slice(0, 6).map((item) => (
                  <div key={item.name}>
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-semibold text-slate-700">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-500">
                        {formatNumber(item.count)}
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(item.count / maxSpecialty) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Panel>
      </div>

      {/* STATUS + PERFORMANCE */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Trạng Thái Lịch Hẹn">
          <div className="space-y-4">
            {statusDistribution.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {formatNumber(item.count)}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${totalAppointments ? (item.count / totalAppointments) * 100 : 0}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Chỉ Số Hiệu Suất">
          <div className="space-y-3">
            <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-700">
                <Users className="h-4 w-4" />
                Bệnh Nhân
              </div>
              <p className="mt-1 text-2xl font-black text-cyan-800">
                {formatNumber(patients.length)}
              </p>
              <p className="mt-1 text-[10px] text-cyan-700">
                {formatNumber(newPatients)} bệnh nhân có createdAt trong 7 ngày gần đây
              </p>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
                <XCircle className="h-4 w-4" />
                Tỷ Lệ Hủy
              </div>
              <p className="mt-1 text-2xl font-black text-rose-800">
                {cancellationRate.toFixed(1)}%
              </p>
              <p className="mt-1 text-[10px] text-rose-700">
                {cancelledCount} lịch hủy trong khoảng thời gian đã chọn
              </p>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Tỷ Lệ Hoàn Thành
              </div>
              <p className="mt-1 text-2xl font-black text-emerald-800">
                {completionRate.toFixed(1)}%
              </p>
              <p className="mt-1 text-[10px] text-emerald-700">
                {completedCount} lịch đã hoàn thành
              </p>
            </div>
          </div>
        </Panel>

        <Panel title="Tổng Quan Hôm Nay">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span className="flex items-center gap-2 text-xs text-slate-600">
                <CalendarCheck className="h-4 w-4 text-cyan-600" />
                Lịch khám hôm nay
              </span>
              <strong className="text-lg text-slate-900">
                {formatNumber(todayAppointments.length)}
              </strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Hoàn thành
              </span>
              <strong className="text-lg text-slate-900">
                {formatNumber(todayCompleted)}
              </strong>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span className="flex items-center gap-2 text-xs text-slate-600">
                <XCircle className="h-4 w-4 text-rose-600" />
                Đã hủy
              </span>
              <strong className="text-lg text-slate-900">
                {formatNumber(todayCancelled)}
              </strong>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
              <p className="text-xs font-bold text-rose-700">
                Tỷ lệ hủy hôm nay
              </p>
              <p className="mt-1 text-2xl font-black text-rose-800">
                {todayCancellationRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {/* DOCTORS + QUICK STATS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Trạng Thái Bác Sĩ" className="lg:col-span-2">
          {doctors.length === 0 ? (
            <p className="text-xs text-slate-400">
              Không có dữ liệu bác sĩ hoặc API chưa trả về danh sách.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {doctors.slice(0, 10).map((doctor, index) => {
                const name = getDoctorName(doctor);
                const status = getDoctorStatus(doctor);
                const active = status === "Đang hoạt động";

                return (
                  <div
                    key={doctor.doctorId || doctor.id || index}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                  >
                    {doctor.avatarUrl || doctor.avatar ? (
                      <img
                        src={doctor.avatarUrl || doctor.avatar}
                        alt={name}
                        className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-800">
                        {name}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">
                        {getDoctorSpecialty(doctor)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${active
                          ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-500"
                        }`}
                    >
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Thống Kê Dữ Liệu">
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Tổng lịch",
                value: appointments.length,
                color: "text-slate-800",
              },
              {
                label: "Xác nhận",
                value: appointments.filter((a) =>
                  isStatus(a, "CONFIRMED")
                ).length,
                color: "text-emerald-700",
              },
              {
                label: "Đang chờ",
                value: appointments.filter((a) =>
                  isStatus(a, "PENDING")
                ).length,
                color: "text-amber-600",
              },
              {
                label: "Đã hủy",
                value: appointments.filter((a) =>
                  isStatus(a, "CANCELLED")
                ).length,
                color: "text-rose-600",
              },
              {
                label: "Bệnh nhân",
                value: patients.length,
                color: "text-cyan-700",
              },
              {
                label: "Chuyên khoa",
                value: specialties.length,
                color: "text-violet-700",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center"
              >
                <p className={`text-xl font-black ${item.color}`}>
                  {formatNumber(item.value)}
                </p>
                <p className="mt-1 text-[10px] font-medium text-slate-500">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <Activity className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
            <p className="text-[11px] leading-relaxed text-slate-500">
              Các chỉ số được tính từ dữ liệu API đã tải. Số liệu có thể chưa đại diện toàn hệ thống nếu backend giới hạn danh sách hoặc phân trang.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default AdminDashboard;
