import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Activity, AlertCircle, ArrowLeft, Check, CheckCircle2, ClipboardList,
  Clock, FileText, HeartPulse, LoaderCircle, Mic, MicOff, Plus, RefreshCw,
  Save, Search, Stethoscope, UserRound, X
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

/**
 * DoctorWorkspace.jsx
 * All requests go through the API Gateway at port 8080.
 *
 * If your project uses a different relative path for AuthContext, update that
 * import only. This component expects useAuth() to expose { user, token }.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const PATIENTS_API = `${API_BASE_URL}/api/v1/patients`;
const APPOINTMENTS_API = `${API_BASE_URL}/appointments`;
const MEDICAL_RECORDS_API = `${API_BASE_URL}/api/v1/medical-records`;

function getAccessToken(contextToken) {
  if (contextToken) return contextToken;
  return localStorage.getItem("token") || localStorage.getItem("accessToken") || "";
}

async function apiRequest(url, token, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });
  const raw = await response.text();
  let data = null;
  if (raw) {
    try { data = JSON.parse(raw); } catch { data = raw; }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && (data.message || data.error || data.detail)) ||
      (response.status === 401 ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." :
        response.status === 403 ? "Bạn không có quyền thực hiện thao tác này." :
          `Yêu cầu thất bại (${response.status}).`);
    throw new Error(message);
  }
  return data;
}

function localISODate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function getDoctorId(user) {
  return user?.doctorId ||
    user?.doctor?.id ||
    user?.profile?.doctorId ||
    user?.doctorProfile?.id ||
    null;
}

function normalizePatient(patient, appointment) {
  return {
    id: patient?.id ?? appointment?.patientId,
    code: patient?.patientCode || `BN${patient?.id ?? appointment?.patientId ?? ""}`,
    name: patient?.fullName || appointment?.patientName || "Chưa có tên",
    gender: patient?.gender || "Chưa cập nhật",
    age: patient?.age ?? "",
    dob: patient?.dateOfBirth || "",
    phone: patient?.phone || "",
    email: patient?.email || "",
    address: patient?.address || "",
    bloodType: patient?.bloodType || "",
    medicalHistory: patient?.medicalHistory || "",
    symptoms: patient?.symptoms || appointment?.reason || "",
    avatarUrl: patient?.avatarUrl || "",
    appointmentId: appointment?.appointmentId || null,
    appointmentDate: appointment?.appointmentDate || "",
    startTime: appointment?.startTime || "",
    endTime: appointment?.endTime || "",
    appointmentStatus: appointment?.status || "",
    clinicName: appointment?.clinicName || "",
    roomName: appointment?.roomName || "",
    specialtyName: appointment?.specialtyName || "",
    reason: appointment?.reason || patient?.symptoms || "",
  };
}

function statusLabel(status) {
  const labels = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    COMPLETED: "Đã khám",
    NO_SHOW: "Không đến",
    CANCELLED: "Đã hủy",
  };
  return labels[status] || status || "Chưa rõ";
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : "--:--";
}

export default function DoctorWorkspace() {
  const { user, token: contextToken } = useAuth();
  const token = getAccessToken(contextToken);
  const [searchParams] = useSearchParams();

  const queryPatientId = searchParams.get("patientId");
  const queryPatientName = searchParams.get("patientName");
  const queryAppointmentId = searchParams.get("appointmentId");

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [partialWarning, setPartialWarning] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const [vitals, setVitals] = useState({
    temperature: "", bloodPressure: "", heartRate: "", respiratoryRate: "",
    spo2: "", weight: "", height: ""
  });
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [icdCode, setIcdCode] = useState("");
  const [medicalNote, setMedicalNote] = useState("");
  const [prescription, setPrescription] = useState("");
  const [advice, setAdvice] = useState("");
  const [aiNote, setAiNote] = useState("");
  const [listening, setListening] = useState(false);
  const [speechMessage, setSpeechMessage] = useState("");

  const doctorId = getDoctorId(user);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      // These are gateway URLs; do not call the individual service ports.
      const appointmentUrl = new URL(APPOINTMENTS_API);
      if (doctorId) appointmentUrl.searchParams.set("doctorId", doctorId);

      const [patientResult, appointmentResult] = await Promise.all([
        apiRequest(PATIENTS_API, token),
        apiRequest(appointmentUrl.toString(), token),
      ]);

      const patientList = Array.isArray(patientResult)
        ? patientResult
        : patientResult?.content || patientResult?.data || patientResult?.patients || [];
      const appointmentList = Array.isArray(appointmentResult)
        ? appointmentResult
        : appointmentResult?.content || appointmentResult?.data || appointmentResult?.appointments || [];

      setPatients(patientList);
      setAppointments(appointmentList);

      const patientById = new Map(patientList.map((p) => [String(p.id), p]));
      const joined = appointmentList
        .filter((a) => a && a.status !== "CANCELLED")
        .map((a) => normalizePatient(patientById.get(String(a.patientId)), a));

      // Also allow a patient passed from another screen to be opened if their
      // appointment isn't in the active list returned by the gateway.
      if (queryAppointmentId) {
        const match = joined.find((p) => String(p.appointmentId) === String(queryAppointmentId));
        if (match) setSelectedPatientId(String(match.id));
      } else if (queryPatientId) {
        const match = joined.find((p) => String(p.id) === String(queryPatientId));
        if (match) setSelectedPatientId(String(match.id));
      } else if (queryPatientName) {
        const match = joined.find((p) => p.name.toLowerCase() === queryPatientName.toLowerCase());
        if (match) setSelectedPatientId(String(match.id));
      } else if (!selectedPatientId && joined.length) {
        setSelectedPatientId(String(joined[0].id));
      }
    } catch (e) {
      setError(e.message || "Không thể tải dữ liệu từ Gateway.");
    } finally {
      setLoading(false);
    }
  }, [doctorId, token, queryAppointmentId, queryPatientId, queryPatientName]); // selected patient is intentionally not a fetch dependency

  useEffect(() => { loadData(); }, [loadData]);

  const queue = useMemo(() => {
    const patientById = new Map(patients.map((p) => [String(p.id), p]));
    let list = appointments
      .filter((a) => a && a.status !== "CANCELLED")
      .map((a) => normalizePatient(patientById.get(String(a.patientId)), a));
    // If the user profile contains a doctor UUID, the server already filtered
    // by doctorId. Without one, the Gateway's authorized list is shown as-is.
    const q = searchText.trim().toLowerCase();
    if (q) list = list.filter((p) =>
      [p.name, p.code, p.phone, p.reason].some((v) => String(v || "").toLowerCase().includes(q))
    );
    list.sort((a, b) => {
      const aDate = `${a.appointmentDate || ""} ${a.startTime || ""}`;
      const bDate = `${b.appointmentDate || ""} ${b.startTime || ""}`;
      return aDate.localeCompare(bDate);
    });
    return list;
  }, [appointments, patients, searchText]);

  const selectedPatient = useMemo(() => {
    const byAppointment = queryAppointmentId
      ? queue.find((p) => String(p.appointmentId) === String(queryAppointmentId))
      : null;
    return byAppointment ||
      queue.find((p) => String(p.id) === String(selectedPatientId)) ||
      (queryPatientId ? normalizePatient(patients.find((p) => String(p.id) === String(queryPatientId))) : null) ||
      null;
  }, [queue, selectedPatientId, queryAppointmentId, queryPatientId, patients]);

  useEffect(() => {
    if (!selectedPatient) return;
    setSymptoms(selectedPatient.symptoms || selectedPatient.reason || "");
    setVitals({ temperature: "", bloodPressure: "", heartRate: "", respiratoryRate: "", spo2: "", weight: "", height: "" });
    setDiagnosis("");
    setIcdCode("");
    setMedicalNote("");
    setPrescription("");
    setAdvice("");
    setAiNote("");
  }, [selectedPatient?.id, selectedPatient?.appointmentId]);

  const handleSaveDraft = () => {
    if (!selectedPatient) return;
    const key = `doctor-draft-${selectedPatient.appointmentId || selectedPatient.id}`;
    localStorage.setItem(key, JSON.stringify({
      patientId: selectedPatient.id, appointmentId: selectedPatient.appointmentId,
      vitals, symptoms, diagnosis, icdCode, medicalNote, prescription, advice,
      savedAt: new Date().toISOString()
    }));
    setNotice("Đã lưu bản nháp trên trình duyệt này. Hồ sơ chưa được gửi lên máy chủ.");
  };

  const handleCreateSmartNote = () => {
    // This is a local note template, not an AI API call.
    const text = [
      symptoms && `Triệu chứng: ${symptoms}`,
      diagnosis && `Chẩn đoán: ${diagnosis}${icdCode ? ` (ICD-10: ${icdCode})` : ""}`,
      medicalNote && `Ghi chú khám: ${medicalNote}`,
      prescription && `Đơn thuốc: ${prescription}`,
      advice && `Dặn dò: ${advice}`,
    ].filter(Boolean).join("\n");
    setAiNote(text || "Nhập triệu chứng, chẩn đoán hoặc ghi chú để tạo bản tổng hợp.");
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechMessage("Trình duyệt này không hỗ trợ nhận dạng giọng nói. Bạn có thể nhập nội dung trực tiếp.");
      return;
    }
    setSpeechMessage("");
    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      setListening(false);
      setSpeechMessage(`Không nhận dạng được giọng nói (${event.error || "unknown"}).`);
    };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript) setMedicalNote((old) => `${old}${old ? "\n" : ""}${transcript}`);
    };
    recognition.start();
  };

  const handleCompleteExam = async () => {
    if (!selectedPatient) {
      setError("Vui lòng chọn bệnh nhân trước khi lưu hồ sơ.");
      return;
    }
    if (!diagnosis.trim()) {
      setError("Vui lòng nhập chẩn đoán trước khi hoàn tất khám.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    setPartialWarning("");
    try {
      const treatmentParts = [
        Object.values(vitals).some(Boolean)
          ? `Sinh hiệu: ${Object.entries(vitals).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(", ")}`
          : "",
        icdCode.trim() ? `ICD-10: ${icdCode.trim()}` : "",
        medicalNote.trim() ? `Ghi chú: ${medicalNote.trim()}` : "",
        prescription.trim() ? `Đơn thuốc: ${prescription.trim()}` : "",
        advice.trim() ? `Dặn dò: ${advice.trim()}` : "",
      ].filter(Boolean);

      const recordPayload = {
        patientId: Number(selectedPatient.id),
        symptoms: symptoms.trim(),
        diagnosis: diagnosis.trim(),
        treatment: treatmentParts.join("\n"),
        recordDate: localISODate(),
        status: "COMPLETED"
      };

      await apiRequest(MEDICAL_RECORDS_API, token, {
        method: "POST",
        body: JSON.stringify(recordPayload)
      });

      const appointmentId = selectedPatient.appointmentId || queryAppointmentId;
      if (appointmentId) {
        try {
          await apiRequest(`${APPOINTMENTS_API}/${encodeURIComponent(appointmentId)}/status`, token, {
            method: "PATCH",
            body: JSON.stringify({ status: "COMPLETED", reason: selectedPatient.reason || symptoms.trim() || "" })
          });
        } catch (statusError) {
          setPartialWarning(`Hồ sơ đã lưu thành công, nhưng cập nhật lịch khám thất bại: ${statusError.message}. Vui lòng kiểm tra trạng thái lịch khám.`);
          setShowSuccess(true);
          return;
        }
      } else {
        setPartialWarning("Hồ sơ đã lưu thành công. Không tìm thấy appointmentId nên chưa thể cập nhật trạng thái lịch khám.");
        setShowSuccess(true);
        return;
      }

      localStorage.removeItem(`doctor-draft-${selectedPatient.appointmentId || selectedPatient.id}`);
      setShowSuccess(true);
      await loadData();
    } catch (e) {
      setError(e.message || "Không thể lưu hồ sơ khám.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white"><Stethoscope size={23} /></div>
            <div>
              <h1 className="text-xl font-bold">Không gian làm việc bác sĩ</h1>
              <p className="text-sm text-slate-500">Khám bệnh · Hồ sơ bệnh án</p>
            </div>
          </div>
          <button onClick={loadData} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-5 px-4 py-5 md:px-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:sticky lg:top-4 lg:self-start flex flex-col max-h-[calc(100vh-6rem)] shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Danh sách khám</h2>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{queue.length} lịch</span>
            </div>
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Tìm bệnh nhân..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Đang tải dữ liệu...</div>
          ) : queue.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">Không có lịch khám phù hợp.</div>
          ) : (
            <div className="max-h-[72vh] overflow-y-auto p-2">
              {queue.map((patient) => {
                const active = String(selectedPatient?.appointmentId || selectedPatient?.id) === String(patient.appointmentId || patient.id);
                return (
                  <button key={`${patient.appointmentId || "no-appointment"}-${patient.id}`} onClick={() => setSelectedPatientId(String(patient.id))}
                    className={`mb-1 w-full rounded-xl border p-3 text-left transition ${active ? "border-blue-200 bg-blue-50" : "border-transparent hover:bg-slate-50"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}><UserRound size={19} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{patient.name}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{patient.code}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600"><Clock size={11} /> {formatTime(patient.startTime)}</span>
                          <span className={`rounded-full px-2 py-1 text-[11px] ${patient.appointmentStatus === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{statusLabel(patient.appointmentStatus)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="min-w-0 space-y-5">
          {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span>{error}</span><button className="ml-auto" onClick={() => setError("")}><X size={16} /></button></div>}
          {notice && <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{notice}</div>}
          {partialWarning && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{partialWarning}</div>}

          {!selectedPatient ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <ClipboardList size={40} className="mb-3 text-slate-300" />
              <h2 className="font-semibold">Chọn bệnh nhân</h2>
              <p className="mt-1 text-sm text-slate-500">Chọn một lịch khám ở danh sách bên trái để bắt đầu.</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-blue-600">
                      {selectedPatient.avatarUrl ? <img src={selectedPatient.avatarUrl} alt="" className="h-full w-full object-cover" /> : <UserRound size={30} />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold">{selectedPatient.name}</h2>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{selectedPatient.code}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{selectedPatient.gender}{selectedPatient.age !== "" ? ` · ${selectedPatient.age} tuổi` : ""}{selectedPatient.dob ? ` · ${selectedPatient.dob}` : ""}</p>
                      <p className="mt-1 text-sm text-slate-500">{selectedPatient.phone || "Chưa có số điện thoại"}{selectedPatient.bloodType ? ` · Nhóm máu ${selectedPatient.bloodType}` : ""}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    <div className="text-xs text-slate-500">Lịch khám</div>
                    <div className="mt-1 font-semibold">{selectedPatient.appointmentDate || "Chưa có ngày"} · {formatTime(selectedPatient.startTime)}</div>
                    <div className="mt-1 text-slate-500">{selectedPatient.specialtyName || selectedPatient.clinicName || "Chưa có chuyên khoa"}</div>
                  </div>
                </div>
                {selectedPatient.medicalHistory && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><strong>Tiền sử bệnh:</strong> {selectedPatient.medicalHistory}</div>}
                {selectedPatient.address && <p className="mt-3 text-sm text-slate-500">Địa chỉ: {selectedPatient.address}</p>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-2"><HeartPulse className="text-rose-500" size={20} /><h3 className="font-bold">Sinh hiệu</h3></div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {[
                    ["temperature", "Nhiệt độ", "°C"], ["bloodPressure", "Huyết áp", "mmHg"],
                    ["heartRate", "Nhịp tim", "lần/phút"], ["respiratoryRate", "Nhịp thở", "lần/phút"],
                    ["spo2", "SpO₂", "%"], ["weight", "Cân nặng", "kg"], ["height", "Chiều cao", "cm"]
                  ].map(([key, label, unit]) => (
                    <label key={key} className="block">
                      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
                      <div className="flex items-center rounded-lg border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                        <input value={vitals[key]} onChange={(e) => setVitals((old) => ({ ...old, [key]: e.target.value }))} className="w-full min-w-0 rounded-lg bg-transparent px-3 py-2 text-sm outline-none" />
                        <span className="whitespace-nowrap pr-2 text-[11px] text-slate-400">{unit}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-2"><Activity className="text-blue-600" size={20} /><h3 className="font-bold">Thông tin khám bệnh</h3></div>
                <label className="mb-4 block">
                  <span className="mb-1.5 block text-sm font-medium">Triệu chứng / lý do khám</span>
                  <textarea rows={3} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="Mô tả triệu chứng bệnh nhân..." />
                </label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium">Chẩn đoán <span className="text-red-500">*</span></span>
                    <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="Nhập chẩn đoán..." />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium">Mã ICD-10</span>
                    <input value={icdCode} onChange={(e) => setIcdCode(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="VD: J06.9" />
                  </label>
                </div>
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-sm font-medium">Ghi chú / kết quả khám</span>
                  <textarea rows={4} value={medicalNote} onChange={(e) => setMedicalNote(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="Kết quả thăm khám, đánh giá của bác sĩ..." />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={startVoiceInput} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50">
                      {listening ? <MicOff size={15} /> : <Mic size={15} />} {listening ? "Đang nghe..." : "Nhập bằng giọng nói"}
                    </button>
                    {speechMessage && <span className="text-xs text-slate-500">{speechMessage}</span>}
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex items-center gap-2"><FileText className="text-indigo-600" size={20} /><h3 className="font-bold">Đơn thuốc</h3></div>
                  <textarea rows={5} value={prescription} onChange={(e) => setPrescription(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder={"Tên thuốc - liều dùng - số lần/ngày - số ngày"} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex items-center gap-2"><Plus className="text-emerald-600" size={20} /><h3 className="font-bold">Dặn dò / hướng điều trị</h3></div>
                  <textarea rows={5} value={advice} onChange={(e) => setAdvice(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="Hướng điều trị, lịch tái khám, lưu ý cho bệnh nhân..." />
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div><h3 className="font-bold text-indigo-950">Tổng hợp ghi chú</h3><p className="mt-1 text-xs text-indigo-700">Tạo bản tổng hợp từ nội dung đã nhập; chưa gọi dịch vụ AI.</p></div>
                  <button onClick={handleCreateSmartNote} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Tổng hợp nội dung</button>
                </div>
                {aiNote && <pre className="whitespace-pre-wrap rounded-xl border border-indigo-100 bg-white p-3 text-sm text-slate-700">{aiNote}</pre>}
              </div>

              <div className="sticky bottom-3 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
                <button onClick={handleSaveDraft} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"><Save size={17} /> Lưu bản nháp</button>
                <button onClick={handleCompleteExam} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? <LoaderCircle size={17} className="animate-spin" /> : <Check size={17} />} {saving ? "Đang lưu..." : "Lưu hồ sơ & hoàn tất khám"}
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl">
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${partialWarning ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
              {partialWarning ? <AlertCircle size={28} /> : <CheckCircle2 size={28} />}
            </div>
            <h2 className="text-xl font-bold">{partialWarning ? "Lưu hồ sơ một phần" : "Hoàn tất khám bệnh"}</h2>
            <p className="mt-2 text-sm text-slate-500">{partialWarning || `Đã lưu hồ sơ cho ${selectedPatient?.name || "bệnh nhân"}${selectedPatient?.appointmentId ? " và cập nhật lịch khám thành công." : "."}`}</p>
            <button onClick={() => { setShowSuccess(false); setPartialWarning(""); }} className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
