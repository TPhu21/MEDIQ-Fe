import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Clock, Stethoscope, CheckCircle2, Calendar, ArrowRight,
  ChevronRight, FileText, CalendarCheck, AlertCircle, RefreshCw, LoaderCircle
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const PATIENTS_API = `${API_BASE_URL}/api/v1/patients`;
const APPOINTMENTS_API = `${API_BASE_URL}/appointments`;

function getToken(contextToken) {
  return contextToken || localStorage.getItem("token") || localStorage.getItem("accessToken") || "";
}

async function apiRequest(url, token) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { headers });
  const raw = await response.text();
  let data = null;
  if (raw) {
    try { data = JSON.parse(raw); } catch { data = raw; }
  }
  if (!response.ok) {
    const message = data && typeof data === "object" && (data.message || data.error || data.detail);
    throw new Error(message || (response.status === 401
      ? "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
      : response.status === 403
        ? "Bạn không có quyền xem dữ liệu này."
        : `Không tải được dữ liệu (${response.status}).`));
  }
  return data;
}

function getDoctorId(user) {
  return user?.doctorId || user?.doctor?.id || user?.profile?.doctorId || user?.doctorProfile?.id || null;
}

function unwrapList(result, keys = []) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.content)) return result.content;
  if (Array.isArray(result?.data)) return result.data;
  for (const key of keys) if (Array.isArray(result?.[key])) return result[key];
  return [];
}

function localDateISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!date) return "—";
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("vi-VN");
}

function formatTime(time) {
  return time ? String(time).slice(0, 5) : "—";
}

function statusText(status) {
  return ({
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    COMPLETED: "Đã hoàn thành",
    NO_SHOW: "Không đến",
    CANCELLED: "Đã hủy",
  })[status] || status || "Chưa rõ";
}

function statusClass(status) {
  if (status === "COMPLETED") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "CONFIRMED") return "bg-cyan-50 text-cyan-700 border-cyan-200";
  if (status === "PENDING") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "CANCELLED" || status === "NO_SHOW") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export const DoctorDashboard = () => {
  const { user, token: contextToken } = useAuth();
  const navigate = useNavigate();
  const token = getToken(contextToken);
  const doctorId = getDoctorId(user);

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const appointmentUrl = new URL(APPOINTMENTS_API);
      if (doctorId) appointmentUrl.searchParams.set("doctorId", doctorId);

      const [patientResponse, appointmentResponse] = await Promise.all([
        apiRequest(PATIENTS_API, token),
        apiRequest(appointmentUrl.toString(), token),
      ]);

      setPatients(unwrapList(patientResponse, ["patients"]));
      setAppointments(unwrapList(appointmentResponse, ["appointments"]));
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || "Không thể tải dữ liệu Dashboard từ Gateway.");
    } finally {
      setLoading(false);
    }
  }, [token, doctorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const today = localDateISO();

  const patientById = useMemo(
    () => new Map(patients.map((patient) => [String(patient.id), patient])),
    [patients]
  );

  const appointmentsToday = useMemo(
    () => appointments.filter((appointment) =>
      appointment?.appointmentDate === today && appointment.status !== "CANCELLED"
    ).sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || ""))),
    [appointments, today]
  );

  const queue = useMemo(() => appointmentsToday.map((appointment) => {
    const patient = patientById.get(String(appointment.patientId));
    return {
      id: patient?.id ?? appointment.patientId,
      appointmentId: appointment.appointmentId,
      name: patient?.fullName || appointment.patientName || "Chưa có tên",
      code: patient?.patientCode || "—",
      gender: patient?.gender || "Chưa cập nhật",
      age: patient?.age,
      symptoms: patient?.symptoms || appointment.reason || "",
      phone: patient?.phone || "",
      status: appointment.status,
      date: appointment.appointmentDate,
      time: appointment.startTime,
      specialty: appointment.specialtyName || "Chưa có chuyên khoa",
      room: appointment.roomName || appointment.roomCode || "Chưa xếp phòng",
    };
  }), [appointmentsToday, patientById]);

  const waitingPatients = queue.filter((patient) => ["PENDING", "CONFIRMED"].includes(patient.status));
  const completedPatients = queue.filter((patient) => patient.status === "COMPLETED");
  const inProgressPatient = querySelectedPatient(queue, new URLSearchParams(window.location.search).get("patientId"));
  const totalPatientsToday = queue.length;
  const waitingCount = waitingPatients.length;
  const inProgressCount = 0; // Backend appointment contract has no IN_PROGRESS status.
  const completedCount = completedPatients.length;

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {getGreeting()}, {user?.name || user?.fullName || "Bác sĩ"}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Dashboard
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</span>
            <span>·</span>
            <span>{user?.room || user?.roomName || "Chưa có phòng khám"}</span>
            <span>·</span>
            <span className="text-cyan-700 font-semibold">{user?.specialty || user?.specialtyName || "Chưa có chuyên khoa"}</span>
          </p>
          {lastUpdated && <p className="mt-1 text-[11px] text-slate-400">Cập nhật lúc {lastUpdated.toLocaleTimeString("vi-VN")}</p>}
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={loadData} disabled={loading} className="px-3 py-2.5 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
          </button>
          <button
            onClick={() => navigate(inProgressPatient ? `/doctor/workspace?patientId=${inProgressPatient.id}&appointmentId=${inProgressPatient.appointmentId}` : "/doctor/workspace")}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition"
          >
            <Stethoscope className="w-4 h-4" /><span>Bắt Đầu Khám</span>
          </button>
        </div>
      </div>

      {error && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle size={18} className="shrink-0 mt-0.5" /><span>{error}</span></div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Bệnh nhân hôm nay" value={loading ? "—" : totalPatientsToday} note="Theo lịch hẹn từ hệ thống" icon={<Users className="w-4 h-4 text-cyan-600" />} />
        <KpiCard title="Chờ khám" value={loading ? "—" : waitingCount} note="Lịch chờ / đã xác nhận" icon={<Clock className="w-4 h-4 text-amber-600" />} />
        <KpiCard title="Đang khám" value={loading ? "—" : inProgressCount} note="API hiện chưa có trạng thái IN_PROGRESS" icon={<Stethoscope className="w-4 h-4 text-cyan-600" />} />
        <KpiCard title="Đã hoàn thành" value={loading ? "—" : completedCount} note="Lịch có trạng thái COMPLETED" icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
      </div>

      {inProgressPatient && (
        <div className="bg-white border border-cyan-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-cyan-50/40 via-white to-white">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">{inProgressPatient.name.charAt(0)}</div>
            <div>
              <div className="flex items-center gap-2"><span className="text-[11px] font-bold text-cyan-700 uppercase tracking-wide">Lịch khám được chọn</span><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" /></div>
              <div className="text-sm font-bold text-slate-900">{inProgressPatient.name} <span className="text-xs text-slate-400 font-normal">({inProgressPatient.gender}{inProgressPatient.age !== undefined && inProgressPatient.age !== null ? `, ${inProgressPatient.age} tuổi` : ""})</span></div>
              <p className="text-xs text-slate-500 mt-0.5">Lúc {formatTime(inProgressPatient.time)} · {inProgressPatient.symptoms || "Chưa có triệu chứng"}</p>
            </div>
          </div>
          <button onClick={() => navigate(`/doctor/workspace?patientId=${inProgressPatient.id}&appointmentId=${inProgressPatient.appointmentId}`)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shrink-0">
            Tiếp tục khám <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-slate-900">Hàng chờ khám hôm nay</h2><span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">{waitingPatients.length} bệnh nhân</span></div>
              <button onClick={() => navigate("/doctor/patients")} className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-0.5">Xem tất cả <ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
            {loading ? <Loading /> : waitingPatients.length === 0 ? <Empty text="Không có lịch đang chờ khám hôm nay." /> : (
              <div className="divide-y divide-slate-100 mt-1">
                {waitingPatients.slice(0, 4).map((p) => (
                  <div key={p.appointmentId} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl px-2 -mx-2 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">{p.name.charAt(0)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5"><span className="text-xs font-bold text-slate-800 truncate">{p.name}</span><span className="text-[10px] text-slate-400">({p.gender}{p.age !== undefined && p.age !== null ? `, ${p.age} tuổi` : ""})</span></div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{p.symptoms || "Chưa có lý do khám"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 font-medium">{formatTime(p.time)}</span>
                      <button onClick={() => navigate(`/doctor/workspace?patientId=${p.id}&appointmentId=${p.appointmentId}`)} className="px-2.5 py-1 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 text-[11px] font-bold rounded-lg transition">Gọi khám</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 mt-2 text-center"><button onClick={() => navigate("/doctor/patients")} className="text-xs text-slate-500 hover:text-slate-700 font-medium">Xem danh sách bệnh nhân trong ngày →</button></div>
        </div>
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-slate-900">Lịch hẹn hôm nay</h2><span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">{appointmentsToday.length} ca</span></div>
              <button onClick={() => navigate(`/doctor/appointments?date=${today}`)} className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-0.5">Xem tất cả <ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
            {loading ? <Loading /> : appointmentsToday.length === 0 ? <Empty text="Không có lịch hẹn trong ngày hôm nay." /> : (
              <div className="space-y-2 mt-3">
                {appointmentsToday.slice(0, 4).map((apt) => {
                  const patient = patientById.get(String(apt.patientId));
                  return (
                    <button key={apt.appointmentId} onClick={() => navigate(`/doctor/workspace?patientId=${apt.patientId}&appointmentId=${apt.appointmentId}`)} className="w-full text-left p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-cyan-50/60 hover:border-cyan-200 transition flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="px-2 py-1 rounded-lg text-xs font-mono font-bold shrink-0 bg-white text-slate-700 border border-slate-200">{formatTime(apt.startTime)}</div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{patient?.fullName || apt.patientName || `Bệnh nhân #${apt.patientId}`}</div>
                          <div className="text-[11px] text-slate-500 truncate">{apt.specialtyName || "Chưa có chuyên khoa"} · {apt.roomName || apt.roomCode || "Chưa xếp phòng"}</div>
                        </div>
                      </div>
                      <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusClass(apt.status)}`}>{statusText(apt.status)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 mt-2 text-center"><button onClick={() => navigate(`/doctor/appointments?date=${today}`)} className="text-xs text-slate-500 hover:text-slate-700 font-medium">Xem tiến độ lịch hẹn trong ngày →</button></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-700 uppercase">Lịch làm việc hôm nay</span><span className="text-xs font-bold text-cyan-700">{user?.room || user?.roomName || "Chưa có phòng"} · {user?.specialty || user?.specialtyName || "Chưa có chuyên khoa"}</span></div>
          <div className="flex items-baseline justify-between"><div className="text-lg font-bold text-slate-900">08:00 – 17:00</div><div className="text-xs text-slate-500">Khung giờ tham khảo</div></div>
          <p className="text-xs text-slate-500">Chưa có API lịch làm việc trong các endpoint được cung cấp, nên khung giờ này chỉ là thông tin tĩnh.</p>
          <div className="pt-2 border-t border-slate-100 flex justify-end"><button onClick={() => navigate("/doctor/schedules")} className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold flex items-center gap-1">Xem lịch làm việc <ChevronRight className="w-3.5 h-3.5" /></button></div>
        </div>

        <div className="md:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase mb-2">Thao tác nhanh</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <QuickAction onClick={() => navigate("/doctor/appointments")} icon={<Calendar className="w-3.5 h-3.5 text-cyan-600" />} label="Lịch hẹn" />
            <QuickAction onClick={() => navigate("/doctor/patients")} icon={<Users className="w-3.5 h-3.5 text-cyan-600" />} label="Bệnh nhân" />
            <QuickAction onClick={() => navigate("/doctor/records")} icon={<FileText className="w-3.5 h-3.5 text-cyan-600" />} label="Bệnh án EMR" />
            <QuickAction onClick={() => navigate("/doctor/schedules")} icon={<CalendarCheck className="w-3.5 h-3.5 text-cyan-600" />} label="Lịch làm việc" />
          </div>
        </div>
        <div className="md:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase mb-2">Trạng thái dữ liệu</span>
          <div className="space-y-3 text-xs">
            <StatusRow label="API Gateway" online={!error && !loading} />
            <StatusRow label="Dữ liệu bệnh nhân" online={!error && !loading && patients.length >= 0} />
            <StatusRow label="Lịch hẹn" online={!error && !loading && appointments.length >= 0} />
          </div>
          <p className="mt-3 text-[10px] text-slate-400">Đây là trạng thái request gần nhất, không phải health check độc lập của từng service.</p>
        </div>
      </div>
    </div>
  );
};

function querySelectedPatient(queue, patientId) {
  if (!patientId) return null;
  return queue.find((patient) => String(patient.id) === String(patientId)) || null;
}
function KpiCard({ title, value, note, icon }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-semibold">{title}</span>
        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">{icon}</div>
      </div>
      <div><div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div><div className="text-[11px] text-slate-500 font-medium mt-0.5">{note}</div></div>
    </div>
  );
}

function QuickAction({ onClick, icon, label }) {
  return <button onClick={onClick} className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-cyan-50 hover:border-cyan-200 text-slate-700 font-semibold flex items-center gap-2 transition">{icon}<span>{label}</span></button>;
}

function StatusRow({ label, online }) {
  return <div className="flex items-center justify-between"><span className="text-slate-500">{label}</span><span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${online ? "text-emerald-600" : "text-rose-600"}`}><span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-rose-500"}`} />{online ? "Đã phản hồi" : "Lỗi / chưa tải"}</span></div>;
}

function Loading() {
  return <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><LoaderCircle size={17} className="animate-spin" /> Đang tải dữ liệu...</div>;
}

function Empty({ text }) {
  return <div className="py-10 text-center text-sm text-slate-500">{text}</div>;
}

