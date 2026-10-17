
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Eye,
  Stethoscope,
  X,
  User,
  RefreshCw,
  AlertCircle,
  FileText,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const PATIENT_API =
  import.meta.env.VITE_PATIENT_API_URL || "http://localhost:8083";

const APPOINTMENT_API = API_BASE_URL;
const DOCTOR_API = API_BASE_URL;

function getToken(tokenFromContext) {
  return (
    tokenFromContext ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

async function apiGet(url, token) {
  const accessToken = getToken(token);

  if (!accessToken) {
    throw new Error("Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.");
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
  }

  if (response.status === 403) {
    throw new Error("Bạn không có quyền truy cập dữ liệu này.");
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `API ${response.status}: ${body || response.statusText}`
    );
  }

  if (response.status === 204) return null;

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();

  if (
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() &&
      today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age >= 0 ? age : null;
}

function normalizePatient(patient) {
  return {
    id: patient.id,
    name: patient.fullName || patient.name || "Chưa cập nhật",
    code: patient.patientCode || `PAT-${patient.id}`,
    age: patient.age ?? calculateAge(patient.dateOfBirth),
    gender: patient.gender || "Chưa cập nhật",
    phone: patient.phone || "",
    email: patient.email || "",
    dob: patient.dateOfBirth || "",
    address: patient.address || "",
    bloodType: patient.bloodType || "",
    symptoms: patient.symptoms || "",
    medicalHistory: patient.medicalHistory || "",
    status: patient.status || "Chưa xác định",
    appointmentStatuses: patient.appointmentStatuses || [],
    appointmentCount: patient.appointmentCount || 0,
    lastAppointmentDate: patient.lastAppointmentDate || "",
  };
}

function getAppointmentStatusLabel(statuses = []) {
  if (statuses.includes("CONFIRMED")) return "Đã xác nhận";
  if (statuses.includes("PENDING")) return "Chờ khám";
  if (statuses.includes("COMPLETED")) return "Hoàn thành";
  if (statuses.includes("NO_SHOW")) return "Không đến khám";
  if (statuses.includes("CANCELLED")) return "Đã hủy";
  return "Chưa xác định";
}

function getStatusStyle(status) {
  switch (status) {
    case "Đã xác nhận":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Chờ khám":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Hoàn thành":
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    case "Không đến khám":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Đã hủy":
      return "bg-rose-100 text-rose-800 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function formatDate(value) {
  if (!value) return "Chưa cập nhật";
  return String(value).slice(0, 10);
}

export const DoctorPatients = () => {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const highlightId = searchParams.get("id");

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctor, setDoctor] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [medicalRecords, setMedicalRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPatients = useCallback(async () => {
    if (authLoading) return;

    if (!user || user.role !== "DOCTOR") {
      setPatients([]);
      setLoading(false);
      setError("Trang này chỉ dành cho tài khoản bác sĩ.");
      return;
    }

    if (!getToken(token)) {
      setPatients([]);
      setLoading(false);
      setError("Vui lòng đăng nhập lại để xem danh sách bệnh nhân.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Lấy hồ sơ bác sĩ từ Gateway.
      const doctorResult = await apiGet(
        `${DOCTOR_API}/doctors`,
        token
      );

      const doctors = Array.isArray(doctorResult)
        ? doctorResult
        : doctorResult?.content || [];

      const currentDoctor = doctors.find(
        (item) => String(item.userId) === String(user.id)
      );

      if (!currentDoctor) {
        throw new Error(
          "Không tìm thấy hồ sơ bác sĩ liên kết với tài khoản đang đăng nhập."
        );
      }

      const doctorId = currentDoctor.doctorId ?? currentDoctor.id;

      if (doctorId == null) {
        throw new Error("Hồ sơ bác sĩ không có doctorId hợp lệ.");
      }

      setDoctor(currentDoctor);

      // 2. Lấy lịch hẹn của bác sĩ hiện tại.
      const params = new URLSearchParams({
        doctorId: String(doctorId),
      });

      const appointmentResult = await apiGet(
        `${APPOINTMENT_API}/appointments?${params.toString()}`,
        token
      );

      const appointmentList = Array.isArray(appointmentResult)
        ? appointmentResult
        : appointmentResult?.content || [];

      setAppointments(appointmentList);

      // 3. Gom bệnh nhân từ lịch hẹn, mỗi bệnh nhân chỉ xuất hiện một lần.
      // Bỏ lịch đã hủy để không đưa bệnh nhân chỉ có lịch hủy vào danh sách.
      const patientMap = new Map();

      appointmentList.forEach((appointment) => {
        if (
          appointment.patientId == null ||
          String(appointment.status || "").toUpperCase() === "CANCELLED"
        ) {
          return;
        }

        const key = String(appointment.patientId);

        if (!patientMap.has(key)) {
          patientMap.set(key, {
            id: appointment.patientId,
            name:
              appointment.patientName ||
              `Bệnh nhân #${appointment.patientId}`,
            appointmentStatuses: [],
            appointmentCount: 0,
            lastAppointmentDate: "",
          });
        }

        const patient = patientMap.get(key);
        patient.appointmentCount++;

        const status = String(appointment.status || "").toUpperCase();

        if (
          status &&
          !patient.appointmentStatuses.includes(status)
        ) {
          patient.appointmentStatuses.push(status);
        }

        const appointmentDate = appointment.appointmentDate || "";

        if (
          appointmentDate &&
          appointmentDate > patient.lastAppointmentDate
        ) {
          patient.lastAppointmentDate = appointmentDate;
        }
      });

      const appointmentPatients = Array.from(patientMap.values());

      // 4. Lấy thông tin chi tiết từng bệnh nhân từ patient-service.
      const detailResults = await Promise.allSettled(
        appointmentPatients.map((patient) =>
          apiGet(
            `${PATIENT_API}/api/v1/patients/${encodeURIComponent(patient.id)}`,
            token
          )
        )
      );

      const patientList = appointmentPatients.map((appointmentPatient, index) => {
        const result = detailResults[index];

        if (result.status === "fulfilled" && result.value) {
          const detail = result.value;
          const normalized = normalizePatient({
            ...detail,
            id: detail.id ?? appointmentPatient.id,
            fullName:
              detail.fullName ||
              detail.name ||
              appointmentPatient.name,
            appointmentStatuses:
              appointmentPatient.appointmentStatuses,
            appointmentCount:
              appointmentPatient.appointmentCount,
            lastAppointmentDate:
              appointmentPatient.lastAppointmentDate,
          });

          return normalized;
        }

        // Nếu API chi tiết lỗi, vẫn giữ thông tin có được từ lịch hẹn.
        return normalizePatient({
          id: appointmentPatient.id,
          fullName: appointmentPatient.name,
          appointmentStatuses: appointmentPatient.appointmentStatuses,
          appointmentCount: appointmentPatient.appointmentCount,
          lastAppointmentDate: appointmentPatient.lastAppointmentDate,
        });
      });

      setPatients(patientList);

      // 5. Nếu mở trang bằng ?id=..., tự mở bệnh nhân tương ứng.
      if (highlightId) {
        const highlightedPatient = patientList.find(
          (patient) => String(patient.id) === String(highlightId)
        );
        setSelectedPatient(highlightedPatient || null);
      } else {
        setSelectedPatient((current) => {
          if (!current) return null;
          return (
            patientList.find(
              (patient) => String(patient.id) === String(current.id)
            ) || null
          );
        });
      }
    } catch (err) {
      console.error("Load doctor patients error:", err);
      setError(err.message || "Không thể tải danh sách bệnh nhân.");
      setPatients([]);
      setAppointments([]);
      setDoctor(null);
    } finally {
      setLoading(false);
    }
  }, [user, token, authLoading, highlightId]);

  useEffect(() => {
    if (!authLoading) {
      loadPatients();
    }
  }, [authLoading, loadPatients]);

  // Tải bệnh án thật khi mở chi tiết một bệnh nhân.
  const loadMedicalRecords = useCallback(
    async (patient) => {
      if (!patient?.id) return;

      setRecordsLoading(true);
      setRecordsError("");
      setMedicalRecords([]);

      try {
        const result = await apiGet(
          `${PATIENT_API}/api/v1/medical-records/patient/${encodeURIComponent(
            patient.id
          )}`,
          token
        );

        setMedicalRecords(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error("Load patient medical records error:", err);
        setRecordsError(
          err.message || "Không tải được lịch sử bệnh án."
        );
      } finally {
        setRecordsLoading(false);
      }
    },
    [token]
  );

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    loadMedicalRecords(patient);
  };

  const handleStartExam = (patient) => {
    if (!patient) return;

    navigate(
      `/doctor/workspace?patientId=${encodeURIComponent(
        patient.id
      )}&patientName=${encodeURIComponent(patient.name)}`
    );
  };

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return patients.filter((patient) => {
      const searchable = [
        patient.name,
        patient.code,
        patient.phone,
        patient.email,
        patient.symptoms,
        patient.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch = !query || searchable.includes(query);

      const matchStatus =
        statusFilter === "ALL" ||
        patient.appointmentStatuses.includes(statusFilter);

      return matchSearch && matchStatus;
    });
  }, [patients, search, statusFilter]);

  if (authLoading) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Danh Sách Bệnh Nhân Đăng Ký Khám
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bác sĩ:{" "}
            <b className="text-slate-800">
              {doctor?.fullName ||
                doctor?.name ||
                user?.fullName ||
                "Bác sĩ"}
            </b>
            {" · "}Quản lý bệnh nhân có lịch hẹn với bác sĩ.
          </p>
        </div>

        <button
          onClick={loadPatients}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
          />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Không tải được dữ liệu</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã bệnh nhân, họ tên, số điện thoại..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Tất cả trạng thái lịch hẹn</option>
            <option value="PENDING">Chờ khám</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="NO_SHOW">Không đến khám</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Danh sách bệnh nhân ({filteredPatients.length})
          </span>
          <span className="text-xs text-slate-400">
            {appointments.length} lịch hẹn được tải
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Mã BN</th>
                <th className="p-3.5">Họ tên</th>
                <th className="p-3.5">Tuổi / Giới</th>
                <th className="p-3.5">Triệu chứng</th>
                <th className="p-3.5">Trạng thái lịch hẹn</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Đang tải danh sách bệnh nhân...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {error
                      ? "Không có dữ liệu để hiển thị."
                      : "Không tìm thấy bệnh nhân phù hợp."}
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const displayStatus = getAppointmentStatusLabel(
                    patient.appointmentStatuses
                  );

                  return (
                    <tr key={patient.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-bold text-cyan-700">
                        {patient.code}
                      </td>

                      <td className="p-3.5 font-bold text-slate-900">
                        <div>{patient.name}</div>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {patient.phone || "Chưa có số điện thoại"}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {patient.age ?? "—"} / {patient.gender}
                      </td>

                      <td
                        className="p-3.5 max-w-xs truncate"
                        title={patient.symptoms}
                      >
                        {patient.symptoms || "Chưa có thông tin"}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-semibold border text-[11px] ${getStatusStyle(
                            displayStatus
                          )}`}
                        >
                          {displayStatus}
                        </span>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {patient.appointmentCount} lịch hẹn
                        </p>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewPatient(patient)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Chi tiết
                          </button>

                          <button
                            onClick={() => handleStartExam(patient)}
                            className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg flex items-center gap-1 transition shadow-xs"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            Khám
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedPatient.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono font-bold">
                    Mã hồ sơ: {selectedPatient.code}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setMedicalRecords([]);
                  setRecordsError("");
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Đóng chi tiết"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-700 uppercase mb-2">
                Thông tin cá nhân
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <Info label="Tuổi / Giới tính">
                  {selectedPatient.age ?? "—"} tuổi • {selectedPatient.gender}
                </Info>
                <Info label="Nhóm máu">
                  {selectedPatient.bloodType || "Chưa cập nhật"}
                </Info>
                <Info label="Số điện thoại">
                  {selectedPatient.phone || "Chưa cập nhật"}
                </Info>
                <Info label="Email">
                  {selectedPatient.email || "Chưa cập nhật"}
                </Info>
                <Info label="Ngày sinh">
                  {selectedPatient.dob || "Chưa cập nhật"}
                </Info>
                <Info label="Địa chỉ">
                  {selectedPatient.address || "Chưa cập nhật"}
                </Info>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs space-y-1">
              <span className="font-bold text-amber-900 block">
                Triệu chứng / lý do khám
              </span>
              <p className="text-amber-800 font-medium">
                {selectedPatient.symptoms || "Chưa có thông tin"}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase">
                Tiền sử bệnh
              </span>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 whitespace-pre-wrap">
                {selectedPatient.medicalHistory ||
                  "Chưa có thông tin tiền sử bệnh."}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase">
                  Lịch sử bệnh án ({medicalRecords.length})
                </span>
                <button
                  onClick={() => loadMedicalRecords(selectedPatient)}
                  disabled={recordsLoading}
                  className="text-xs text-cyan-700 font-bold hover:underline disabled:opacity-50"
                >
                  {recordsLoading ? "Đang tải..." : "Tải lại"}
                </button>
              </div>

              {recordsError && (
                <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700">
                  {recordsError}
                </div>
              )}

              {recordsLoading ? (
                <div className="p-5 text-center text-xs text-slate-500">
                  Đang tải bệnh án từ máy chủ...
                </div>
              ) : medicalRecords.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500">
                  {recordsError
                    ? "Không thể tải lịch sử bệnh án."
                    : "Bệnh nhân chưa có bệnh án hoặc chưa có dữ liệu."}
                </div>
              ) : (
                <div className="space-y-3">
                  {medicalRecords.map((record) => (
                    <div
                      key={record.id}
                      className="border border-slate-200 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono font-bold text-cyan-700 text-xs">
                          REC-{record.id}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(record.recordDate)}
                        </span>
                      </div>

                      <Info label="Triệu chứng">
                        {record.symptoms || "Chưa cập nhật"}
                      </Info>

                      <Info label="Chẩn đoán">
                        {record.diagnosis || "Chưa cập nhật"}
                      </Info>

                      <Info label="Điều trị">
                        {record.treatment || "Chưa cập nhật"}
                      </Info>

                      <p className="text-xs text-slate-500">
                        Trạng thái:{" "}
                        <b className="text-slate-700">
                          {record.status || "Chưa cập nhật"}
                        </b>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setMedicalRecords([]);
                  setRecordsError("");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  handleStartExam(selectedPatient);
                  setSelectedPatient(null);
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Stethoscope className="w-4 h-4" />
                Bắt đầu khám
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function Info({ label, children }) {
  return (
    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 min-w-0">
      <span className="text-slate-400 block text-[10px]">{label}</span>
      <span className="font-bold text-slate-800 break-words whitespace-pre-wrap">
        {children}
      </span>
    </div>
  );
}

export default DoctorPatients;
