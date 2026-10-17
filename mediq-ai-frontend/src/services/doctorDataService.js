import { MOCK_APPOINTMENTS } from "../mocks/mockAppointments";
import { MOCK_PATIENTS } from "../mocks/mockPatients";
import { MOCK_MEDICAL_RECORDS } from "../mocks/mockMedicalRecords";

const STORAGE_KEYS = {
  APPOINTMENTS: "mediq_appointments",
  PATIENTS: "mediq_patients",
  RECORDS: "mediq_medical_records"
};

// Khởi tạo storage nếu chưa có
const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(MOCK_APPOINTMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(MOCK_PATIENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RECORDS)) {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(MOCK_MEDICAL_RECORDS));
  }
};

initStorage();

const dispatchDataChange = () => {
  window.dispatchEvent(new CustomEvent("mediq_data_updated"));
};

export const doctorDataService = {
  // ── APPOINTMENTS ──
  getAppointments: (doctorName = null) => {
    initStorage();
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || "[]");
      if (!doctorName) return data;
      return data.filter(a => a.doctorName?.toLowerCase() === doctorName.toLowerCase());
    } catch {
      return MOCK_APPOINTMENTS;
    }
  },

  updateAppointmentStatus: (id, status) => {
    initStorage();
    const list = doctorDataService.getAppointments();
    const updated = list.map(a => (a.id === id ? { ...a, status } : a));
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));
    dispatchDataChange();
    return updated.find(a => a.id === id);
  },

  // ── PATIENTS ──
  getPatients: () => {
    initStorage();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS) || "[]");
    } catch {
      return MOCK_PATIENTS;
    }
  },

  getPatientById: (id) => {
    const list = doctorDataService.getPatients();
    return list.find(p => String(p.id) === String(id) || p.code === id) || null;
  },

  getPatientByName: (name) => {
    const list = doctorDataService.getPatients();
    return list.find(p => p.name?.toLowerCase() === name?.toLowerCase()) || null;
  },

  updatePatientStatus: (id, status) => {
    initStorage();
    const list = doctorDataService.getPatients();
    const updated = list.map(p => (String(p.id) === String(id) || p.code === id ? { ...p, status } : p));
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(updated));
    dispatchDataChange();
    return updated.find(p => String(p.id) === String(id) || p.code === id);
  },

  // ── MEDICAL RECORDS (EMR) ──
  getMedicalRecords: () => {
    initStorage();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECORDS) || "[]");
    } catch {
      return MOCK_MEDICAL_RECORDS;
    }
  },

  getRecordsByPatientName: (patientName) => {
    const list = doctorDataService.getMedicalRecords();
    return list.filter(r => r.patientName?.toLowerCase() === patientName?.toLowerCase());
  },

  // ── WORKFLOW HOÀN TẤT KHÁM BỆNH (TÍCH HỢP TOÀN BỘ) ──
  completeExamination: ({
    patientId,
    patientName,
    appointmentId,
    doctorName = "BS. Lê Hoài Nam",
    diagnosis,
    symptoms,
    prescription,
    note,
    vitals
  }) => {
    initStorage();
    const today = new Date().toISOString().split("T")[0];
    const newRecordId = `REC-${Math.floor(10000 + Math.random() * 90000)}`;

    const newRecord = {
      id: newRecordId,
      patientName,
      doctorName,
      date: today,
      diagnosis: diagnosis || "Chẩn đoán thông thường",
      symptoms: symptoms || "Không ghi nhận",
      prescription: prescription || "Không kê đơn",
      note: note || "Tái khám theo chỉ định nếu có bất thường.",
      status: "Đã hoàn thành",
      vitals: vitals || { bp: "120/80", hr: "75", temp: "36.8", spo2: "99" }
    };

    // 1. Thêm vào records
    const records = doctorDataService.getMedicalRecords();
    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));

    // 2. Cập nhật trạng thái bệnh nhân
    if (patientId || patientName) {
      const patients = doctorDataService.getPatients();
      const updatedPatients = patients.map(p => {
        if ((patientId && String(p.id) === String(patientId)) || p.name === patientName) {
          return { ...p, status: "Hoàn thành" };
        }
        return p;
      });
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(updatedPatients));
    }

    // 3. Cập nhật lịch hẹn (nếu có appointmentId hoặc trùng patientName hôm nay)
    const appointments = doctorDataService.getAppointments();
    const updatedAppointments = appointments.map(a => {
      if ((appointmentId && a.id === appointmentId) || (a.patientName === patientName && a.status !== "Đã hoàn thành")) {
        return { ...a, status: "Đã hoàn thành" };
      }
      return a;
    });
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updatedAppointments));

    dispatchDataChange();
    return newRecord;
  }
};