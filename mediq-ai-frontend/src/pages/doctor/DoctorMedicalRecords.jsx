
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText, Search, Calendar, Printer, Eye, RefreshCw, X, Pill,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const PATIENT_API =
  import.meta.env.VITE_PATIENT_API_URL || "http://localhost:8083";

const getToken = (token) =>
  token ||
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken") ||
  "";

async function apiGet(url, token) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      `${response.status} ${response.statusText}${message ? `: ${message}` : ""}`
    );
  }

  return response.json();
}

function normalizeDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export const DoctorMedicalRecords = () => {
  const { user, token, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const initialPatient = searchParams.get("patient") || "";

  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState(initialPatient);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRecords = useCallback(async () => {
    if (!user || authLoading) return;

    if (user.role !== "DOCTOR") {
      setError("Chỉ tài khoản bác sĩ mới được xem danh sách bệnh án.");
      setRecords([]);
      return;
    }

    const accessToken = getToken(token);

    if (!accessToken) {
      setError("Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Tìm hồ sơ bác sĩ đang đăng nhập.
      const doctors = await apiGet(
        `${API_BASE_URL}/doctors`,
        accessToken
      );

      const doctor = (doctors || []).find(
        (item) => String(item.userId) === String(user.id)
      );

      const doctorId = doctor?.doctorId ?? doctor?.id;

      if (!doctorId) {
        throw new Error("Không tìm thấy hồ sơ bác sĩ đang đăng nhập.");
      }

      // 2. Chỉ lấy lịch hẹn của bác sĩ hiện tại.
      const params = new URLSearchParams({
        doctorId: String(doctorId),
      });

      const appointmentResult = await apiGet(
        `${API_BASE_URL}/appointments?${params.toString()}`,
        accessToken
      );

      const appointments = Array.isArray(appointmentResult)
        ? appointmentResult
        : appointmentResult?.content || [];

      // 3. Gom các bệnh nhân có lịch hẹn với bác sĩ này.
      const patientsMap = new Map();

      appointments
        .filter((appointment) => {
          const status = String(appointment.status || "").toUpperCase();
          return status !== "CANCELLED";
        })
        .forEach((appointment) => {
          const patientId = appointment.patientId;
          if (patientId == null) return;

          if (!patientsMap.has(String(patientId))) {
            patientsMap.set(String(patientId), {
              patientId,
              patientName: appointment.patientName || "Chưa có tên",
            });
          }
        });

      // 4. Tải bệnh án của từng bệnh nhân qua API thật.
      const patientResults = await Promise.allSettled(
        Array.from(patientsMap.values()).map(async (patient) => {
          const patientRecords = await apiGet(
            `${PATIENT_API}/api/v1/medical-records/patient/${patient.patientId}`,
            accessToken
          );

          return (Array.isArray(patientRecords) ? patientRecords : []).map(
            (record) => ({
              id: String(record.id),
              patientId: record.patientId ?? patient.patientId,
              patientName: patient.patientName,
              date: normalizeDate(record.recordDate),
              diagnosis: record.diagnosis || "",
              symptoms: record.symptoms || "",
              treatment: record.treatment || "",
              status: record.status || "Chưa cập nhật",
              doctorName:
                doctor.fullName || doctor.name || user.fullName || user.name || "",
            })
          );
        })
      );

      const loadedRecords = [];
      const failedPatients = [];

      patientResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          loadedRecords.push(...result.value);
        } else {
          const patient = Array.from(patientsMap.values())[index];
          failedPatients.push(patient?.patientName || "Bệnh nhân");
          console.error("Không tải được bệnh án:", result.reason);
        }
      });

      loadedRecords.sort((a, b) => b.date.localeCompare(a.date));
      setRecords(loadedRecords);

      if (failedPatients.length > 0) {
        setError(
          `Không tải được bệnh án của ${failedPatients.length} bệnh nhân. ` +
          "Hãy kiểm tra quyền truy cập API và log backend."
        );
      }
    } catch (err) {
      console.error("Load medical records error:", err);
      setError(err.message || "Không tải được dữ liệu bệnh án.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [user, token, authLoading]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchSearch =
        !query ||
        record.patientName.toLowerCase().includes(query) ||
        record.id.toLowerCase().includes(query) ||
        record.diagnosis.toLowerCase().includes(query) ||
        record.symptoms.toLowerCase().includes(query) ||
        record.doctorName.toLowerCase().includes(query);

      const matchDate = !dateFilter || record.date === dateFilter;

      return matchSearch && matchDate;
    });
  }, [records, search, dateFilter]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Hồ Sơ Bệnh Án Điện Tử (EMR)
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold border border-cyan-200">
              {records.length} hồ sơ
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tra cứu bệnh án của bệnh nhân có lịch hẹn với bác sĩ.
          </p>
        </div>

        <button
          onClick={loadRecords}
          disabled={loading || authLoading}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã bệnh án, tên bệnh nhân, chẩn đoán..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="sm:col-span-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
          />
        </div>

        <div className="sm:col-span-1 flex items-center justify-end">
          <button
            onClick={() => {
              setSearch("");
              setDateFilter("");
            }}
            title="Đặt lại bộ lọc"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          Đang tải bệnh án từ máy chủ...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium">
            Không tìm thấy hồ sơ bệnh án phù hợp.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-white border border-slate-200 hover:border-cyan-300 rounded-2xl p-5 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-1 rounded">
                      REC-{record.id}
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-2">
                      {record.patientName}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {record.date || "Chưa có ngày"}
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Chẩn đoán
                  </span>
                  <p className="text-sm font-semibold text-slate-800">
                    {record.diagnosis || "Chưa cập nhật"}
                  </p>
                </div>

                <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Triệu chứng
                  </span>
                  <p className="text-sm text-slate-700">
                    {record.symptoms || "Chưa cập nhật"}
                  </p>
                </div>

                <div className="mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Điều trị
                  </span>
                  <p className="text-sm text-cyan-800 whitespace-pre-line">
                    {record.treatment || "Chưa có thông tin điều trị"}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-500">
                  Trạng thái: <b className="text-slate-800">{record.status}</b>
                </span>
                <button
                  onClick={() => setSelectedRecord(record)}
                  className="px-3 py-2 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 rounded-lg flex items-center gap-1.5 font-bold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-700">
                  REC-{selectedRecord.id}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Chi tiết bệnh án
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1 text-xs font-bold"
                >
                  <Printer className="w-4 h-4" /> In phiếu
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-xs text-slate-400 block">Bệnh nhân</span>
                <b>{selectedRecord.patientName}</b>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-xs text-slate-400 block">Ngày khám</span>
                <b>{selectedRecord.date || "Chưa có ngày"}</b>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-xs text-slate-400 block">Bác sĩ</span>
                <b>{selectedRecord.doctorName || "Chưa có thông tin"}</b>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-xs text-slate-400 block">Trạng thái</span>
                <b>{selectedRecord.status}</b>
              </div>
            </div>

            <section>
              <h4 className="font-bold text-slate-700 mb-2">Triệu chứng</h4>
              <div className="p-3 bg-slate-50 border rounded-xl whitespace-pre-line">
                {selectedRecord.symptoms || "Chưa cập nhật"}
              </div>
            </section>

            <section>
              <h4 className="font-bold text-slate-700 mb-2">Chẩn đoán</h4>
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl whitespace-pre-line">
                {selectedRecord.diagnosis || "Chưa cập nhật"}
              </div>
            </section>

            <section>
              <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Pill className="w-4 h-4" /> Điều trị
              </h4>
              <div className="p-3 bg-slate-50 border rounded-xl whitespace-pre-line">
                {selectedRecord.treatment || "Chưa có thông tin điều trị"}
              </div>
            </section>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
