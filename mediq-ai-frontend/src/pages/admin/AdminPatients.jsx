import React, { useEffect, useMemo, useState } from "react";

import {
  Search,
  Pencil,
  X,
  Check,
  User,
  Phone,
  Mail,
  Calendar,
  Droplets,
  MapPin,
  Activity,
  FileText,
  Save,
} from "lucide-react";

import {
  getAllPatients,
  getPatientById,
  updatePatient,
  getMedicalRecords,
  updateMedicalRecord,
} from "../../api/adminApi";

const STATUS_CONFIG = {
  "Chờ khám": {
    color: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500 animate-pulse",
  },
  "Đang khám": {
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    dot: "bg-cyan-500",
  },
  "Hoàn thành": {
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  "Chờ kết quả": {
    color: "bg-purple-100 text-purple-800 border-purple-200",
    dot: "bg-purple-500 animate-pulse",
  },
};

const STATUS_LIST = [
  "Chờ khám",
  "Đang khám",
  "Hoàn thành",
  "Chờ kết quả",
];

const GENDER_LIST = ["Nam", "Nữ", "Khác"];

const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const EMPTY_PATIENT_FORM = {
  fullName: "",
  phone: "",
  gender: "Nam",
  dateOfBirth: "",
  address: "",
  bloodType: "O+",
  medicalHistory: "",
};

const EMPTY_RECORD_FORM = {
  symptoms: "",
  diagnosis: "",
  treatment: "",
  recordDate: "",
  status: "",
};

export const AdminPatients = () => {
  // =========================================================
  // DATA
  // =========================================================
  const [patients, setPatients] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);

  // =========================================================
  // FILTER
  // =========================================================
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");

  // =========================================================
  // MODAL
  // =========================================================
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // =========================================================
  // FORM
  // =========================================================
  const [patientForm, setPatientForm] = useState(
    EMPTY_PATIENT_FORM
  );

  const [recordForm, setRecordForm] = useState(
    EMPTY_RECORD_FORM
  );

  // =========================================================
  // STATE
  // =========================================================
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // =========================================================
  // TOAST
  // =========================================================
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // =========================================================
  // LOAD PATIENTS
  // =========================================================
  const loadPatients = async () => {
    try {
      setLoading(true);

      const data = await getAllPatients();
      console.log("ADMIN PATIENTS:", data);

      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Lỗi lấy danh sách bệnh nhân:",
        error
      );

      showToast(
        error?.response?.data?.message ||
        "Không thể tải danh sách bệnh nhân",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // =========================================================
  // FILTER
  // =========================================================
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return patients.filter((p) => {
      const matchQ =
        !q ||
        p.fullName?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.patientCode?.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "ALL" ||
        p.status === statusFilter;

      const matchGender =
        genderFilter === "ALL" ||
        p.gender === genderFilter;

      return matchQ && matchStatus && matchGender;
    });
  }, [
    patients,
    search,
    statusFilter,
    genderFilter,
  ]);

  // =========================================================
  // STATUS COUNT
  // =========================================================
  const statusCounts = STATUS_LIST.reduce(
    (acc, status) => {
      acc[status] = patients.filter(
        (p) => p.status === status
      ).length;

      return acc;
    },
    {}
  );

  // =========================================================
  // VIEW DETAIL
  // =========================================================
  const openDetail = async (patient) => {
    try {
      setSelected(patient);
      setMedicalRecords([]);
      setModal("detail");
      setDetailLoading(true);

      const [patientData, records] =
        await Promise.all([
          getPatientById(patient.id),
          getMedicalRecords(patient.id),
        ]);

      setSelected(patientData);

      setMedicalRecords(
        Array.isArray(records) ? records : []
      );
    } catch (error) {
      console.error(
        "Lỗi lấy chi tiết bệnh nhân:",
        error
      );

      showToast(
        error?.response?.data?.message ||
        "Không thể tải chi tiết bệnh nhân",
        "error"
      );

      setModal(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // =========================================================
  // OPEN EDIT PATIENT
  // =========================================================
  const openEditPatient = () => {
    if (!selected) {
      return;
    }

    setPatientForm({
      fullName: selected.fullName || "",
      phone: selected.phone || "",
      gender: selected.gender || "Nam",
      dateOfBirth: selected.dateOfBirth || "",
      address: selected.address || "",
      bloodType: selected.bloodType || "O+",
      medicalHistory:
        selected.medicalHistory || "",
    });

    setModal("editPatient");
  };

  // =========================================================
  // OPEN EDIT MEDICAL RECORD
  // =========================================================
  const openEditRecord = (record) => {
    setSelectedRecord(record);

    setRecordForm({
      symptoms: record.symptoms || "",
      diagnosis: record.diagnosis || "",
      treatment: record.treatment || "",
      recordDate: record.recordDate || "",
      status: record.status || "",
    });

    setModal("editRecord");
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================
  const closeModal = () => {
    if (saving) {
      return;
    }

    setModal(null);
    setSelectedRecord(null);
    setPatientForm(EMPTY_PATIENT_FORM);
    setRecordForm(EMPTY_RECORD_FORM);
  };

  // =========================================================
  // CHANGE PATIENT FORM
  // =========================================================
  const handlePatientChange = (e) => {
    const { name, value } = e.target;

    setPatientForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // CHANGE MEDICAL RECORD FORM
  // =========================================================
  const handleRecordChange = (e) => {
    const { name, value } = e.target;

    setRecordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // UPDATE PATIENT
  // =========================================================
  const handleEditPatient = async () => {
    if (!selected) {
      return;
    }

    if (!patientForm.fullName.trim()) {
      showToast(
        "Vui lòng nhập họ và tên",
        "error"
      );

      return;
    }

    if (!patientForm.phone.trim()) {
      showToast(
        "Vui lòng nhập số điện thoại",
        "error"
      );

      return;
    }

    try {
      setSaving(true);

      const request = {
        userId: selected.userId,
        fullName: patientForm.fullName,
        phone: patientForm.phone,
        gender: patientForm.gender,
        dateOfBirth:
          patientForm.dateOfBirth || null,
        address: patientForm.address,
        bloodType: patientForm.bloodType,
        medicalHistory:
          patientForm.medicalHistory,
      };

      const updatedPatient =
        await updatePatient(
          selected.id,
          request
        );

      // Giữ avatar cũ nếu backend update không trả về avatarUrl
      const mergedPatient = {
        ...selected,
        ...updatedPatient,
        avatarUrl:
          updatedPatient.avatarUrl ??
          selected.avatarUrl ??
          null,
      };

      // Cập nhật patient đang xem
      setSelected(mergedPatient);

      // Cập nhật danh sách
      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === mergedPatient.id
            ? mergedPatient
            : patient
        )
      );

      setModal("detail");

      showToast(
        `Đã cập nhật bệnh nhân "${mergedPatient.fullName}"`
      );
    } catch (error) {
      console.error(
        "Lỗi cập nhật bệnh nhân:",
        error
      );

      showToast(
        error?.response?.data?.message ||
        "Không thể cập nhật bệnh nhân",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // UPDATE MEDICAL RECORD
  // =========================================================
  const handleEditRecord = async () => {
    if (!selectedRecord) {
      return;
    }

    try {
      setSaving(true);

      const request = {
        patientId:
          selectedRecord.patientId,
        symptoms: recordForm.symptoms,
        diagnosis: recordForm.diagnosis,
        treatment: recordForm.treatment,
        recordDate:
          recordForm.recordDate || null,
        status: recordForm.status,
      };

      const updatedRecord =
        await updateMedicalRecord(
          selectedRecord.id,
          request
        );

      // Update record trong danh sách
      setMedicalRecords((prev) =>
        prev.map((record) =>
          record.id === updatedRecord.id
            ? updatedRecord
            : record
        )
      );

      // Tìm hồ sơ mới nhất để cập nhật
      // symptoms + status trên patient
      const updatedRecords =
        medicalRecords.map((record) =>
          record.id === updatedRecord.id
            ? updatedRecord
            : record
        );

      const sortedRecords =
        [...updatedRecords].sort((a, b) => {
          const dateA = new Date(
            a.recordDate || 0
          );

          const dateB = new Date(
            b.recordDate || 0
          );

          if (dateB - dateA !== 0) {
            return dateB - dateA;
          }

          return (
            (b.id || 0) -
            (a.id || 0)
          );
        });

      const latestRecord =
        sortedRecords[0];

      if (latestRecord && selected) {
        const updatedPatient = {
          ...selected,
          symptoms:
            latestRecord.symptoms || null,
          status:
            latestRecord.status || null,
        };

        setSelected(updatedPatient);

        setPatients((prev) =>
          prev.map((patient) =>
            patient.id === selected.id
              ? {
                ...patient,
                symptoms:
                  latestRecord.symptoms ||
                  null,
                status:
                  latestRecord.status ||
                  null,
              }
              : patient
          )
        );
      }

      setModal("detail");
      setSelectedRecord(null);

      showToast(
        "Đã cập nhật hồ sơ bệnh án"
      );
    } catch (error) {
      console.error(
        "Lỗi cập nhật hồ sơ bệnh án:",
        error
      );

      showToast(
        error?.response?.data?.message ||
        "Không thể cập nhật hồ sơ bệnh án",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================
  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return date;
    }

    return d.toLocaleDateString("vi-VN");
  };

  return (
    <div className="space-y-5">
      {/* =====================================================
                TOAST
            ===================================================== */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${toast.type === "error"
            ? "bg-red-600 text-white"
            : "bg-emerald-600 text-white"
            }`}
        >
          {toast.type === "error" ? (
            <X className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}

          {toast.msg}
        </div>
      )}

      {/* =====================================================
                HEADER
            ===================================================== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản Lý Bệnh Nhân
          </h1>

          <p className="text-sm text-slate-500 mt-0.5">
            Tổng cộng{" "}
            <span className="font-bold text-slate-700">
              {patients.length}
            </span>{" "}
            bệnh nhân
          </p>
        </div>
      </div>

      {/* =====================================================
                STATUS TABS
            ===================================================== */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() =>
            setStatusFilter("ALL")
          }
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${statusFilter === "ALL"
            ? "bg-cyan-600 text-white border-cyan-600"
            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
        >
          Tất cả{" "}
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {patients.length}
          </span>
        </button>

        {STATUS_LIST.map((s) => {
          const sc = STATUS_CONFIG[s];

          return (
            <button
              key={s}
              onClick={() =>
                setStatusFilter(
                  statusFilter === s
                    ? "ALL"
                    : s
                )
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${statusFilter === s
                ? "bg-cyan-600 text-white border-cyan-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
            >
              {s}{" "}
              <span className="ml-1 opacity-70">
                {statusCounts[s] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* =====================================================
                SEARCH + GENDER
            ===================================================== */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Tìm theo tên, mã BN, email, SĐT..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </div>

        <select
          value={genderFilter}
          onChange={(e) =>
            setGenderFilter(e.target.value)
          }
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-cyan-400"
        >
          <option value="ALL">
            Tất cả giới tính
          </option>

          {GENDER_LIST.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* =====================================================
                TABLE
            ===================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">
                Bệnh Nhân
              </th>

              <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">
                Liên Hệ
              </th>

              <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">
                Thông Tin
              </th>

              <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">
                Triệu Chứng
              </th>

              <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">
                Trạng Thái
              </th>

              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">
                Thao Tác
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-slate-400 text-sm"
                >
                  Đang tải danh sách bệnh nhân...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-slate-400 text-sm"
                >
                  Không tìm thấy kết quả
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const sc =
                  STATUS_CONFIG[p.status];

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* BỆNH NHÂN */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {/* AVATAR */}
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-cyan-100 flex items-center justify-center text-sm font-bold text-cyan-700 shrink-0">
                          {p.avatarUrl ? (
                            <img
                              src={p.avatarUrl}
                              alt={
                                p.fullName ||
                                "Bệnh nhân"
                              }
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            p.fullName
                              ?.split(" ")
                              .pop()?.[0]
                              ?.toUpperCase() || (
                              <User className="w-4 h-4" />
                            )
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {p.fullName}
                          </p>

                          <p className="text-[11px] font-mono text-cyan-600">
                            {p.patientCode}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* LIÊN HỆ */}
                    <td className="p-4">
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {p.phone || "—"}
                      </p>

                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {p.email || "—"}
                      </p>
                    </td>

                    {/* THÔNG TIN */}
                    <td className="p-4">
                      <p className="text-xs text-slate-600">
                        {p.age != null
                          ? `${p.age} tuổi`
                          : "—"}{" "}
                        ·{" "}
                        {p.gender || "—"}
                      </p>

                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Droplets className="w-3 h-3 text-red-400" />
                        {p.bloodType || "—"}
                      </p>
                    </td>

                    {/* TRIỆU CHỨNG */}
                    <td className="p-4">
                      <p className="text-xs text-slate-600 flex items-center gap-1 max-w-[160px]">
                        <Activity className="w-3 h-3 text-orange-400 shrink-0" />

                        <span className="truncate">
                          {p.symptoms || "—"}
                        </span>
                      </p>
                    </td>

                    {/* STATUS */}
                    <td className="p-4">
                      {p.status && sc ? (
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border w-fit ${sc.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                          />

                          {p.status}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Chưa có hồ sơ
                        </span>
                      )}
                    </td>

                    {/* ACTION */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* XEM */}
                        <button
                          onClick={() =>
                            openDetail(p)
                          }
                          title="Xem chi tiết"
                          className="p-1.5 rounded-lg hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* SỬA */}
                        <button
                          onClick={() => {
                            setSelected(
                              p
                            );

                            setPatientForm(
                              {
                                fullName:
                                  p.fullName ||
                                  "",
                                phone:
                                  p.phone ||
                                  "",
                                gender:
                                  p.gender ||
                                  "Nam",
                                dateOfBirth:
                                  p.dateOfBirth ||
                                  "",
                                address:
                                  p.address ||
                                  "",
                                bloodType:
                                  p.bloodType ||
                                  "O+",
                                medicalHistory:
                                  p.medicalHistory ||
                                  "",
                              }
                            );

                            setModal(
                              "editPatient"
                            );
                          }}
                          title="Sửa thông tin"
                          className="p-1.5 rounded-lg hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
          Hiển thị {filtered.length} /{" "}
          {patients.length} bệnh nhân
        </div>
      </div>

      {/* =====================================================
                DETAIL MODAL
            ===================================================== */}
      {modal === "detail" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Chi Tiết Bệnh Nhân
                </h2>

                {selected && (
                  <p className="text-xs font-mono text-cyan-600 mt-0.5">
                    {selected.patientCode}
                  </p>
                )}
              </div>

              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* BODY */}
            {detailLoading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Đang tải thông tin bệnh nhân...
              </div>
            ) : selected ? (
              <div className="p-6 space-y-6">
                {/* =================================================
                                    PATIENT INFO
                                ================================================= */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    {/* AVATAR + TITLE */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-cyan-100 flex items-center justify-center text-lg font-bold text-cyan-700 shrink-0">
                        {selected.avatarUrl ? (
                          <img
                            src={
                              selected.avatarUrl
                            }
                            alt={
                              selected.fullName ||
                              "Bệnh nhân"
                            }
                            className="w-full h-full object-cover"
                            onError={(
                              e
                            ) => {
                              e.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          selected.fullName
                            ?.split(
                              " "
                            )
                            .pop()?.[0]
                            ?.toUpperCase() || (
                            <User className="w-5 h-5" />
                          )
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900">
                          Thông Tin Bệnh Nhân
                        </h3>

                        <p className="text-xs text-slate-400">
                          {selected.fullName ||
                            "—"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={
                        openEditPatient
                      }
                      className="flex items-center gap-1.5 px-3 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Sửa thông tin
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Họ và tên
                      </p>

                      <p className="text-sm font-semibold text-slate-800">
                        {selected.fullName ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Mã bệnh nhân
                      </p>

                      <p className="text-sm font-mono font-semibold text-cyan-600">
                        {selected.patientCode ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Email
                      </p>

                      <p className="text-sm text-slate-700 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />

                        {selected.email ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Số điện thoại
                      </p>

                      <p className="text-sm text-slate-700 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />

                        {selected.phone ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Giới tính
                      </p>

                      <p className="text-sm text-slate-700">
                        {selected.gender ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Ngày sinh
                      </p>

                      <p className="text-sm text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />

                        {formatDate(
                          selected.dateOfBirth
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Tuổi
                      </p>

                      <p className="text-sm text-slate-700">
                        {selected.age !=
                          null
                          ? `${selected.age} tuổi`
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-1">
                        Nhóm máu
                      </p>

                      <p className="text-sm text-slate-700 flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-red-400" />

                        {selected.bloodType ||
                          "—"}
                      </p>
                    </div>

                    <div className="col-span-2 md:col-span-3">
                      <p className="text-xs text-slate-400 mb-1">
                        Địa chỉ
                      </p>

                      <p className="text-sm text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />

                        {selected.address ||
                          "—"}
                      </p>
                    </div>

                    <div className="col-span-2 md:col-span-3">
                      <p className="text-xs text-slate-400 mb-1">
                        Tiền sử bệnh
                      </p>

                      <p className="text-sm text-slate-700">
                        {selected.medicalHistory ||
                          "Chưa có thông tin"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* =================================================
                                    MEDICAL RECORDS
                                ================================================= */}
                <div className="border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-cyan-600" />

                    <h3 className="font-bold text-slate-900">
                      Hồ Sơ Bệnh Án
                    </h3>

                    <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold">
                      {
                        medicalRecords.length
                      }
                    </span>
                  </div>

                  {medicalRecords.length ===
                    0 ? (
                    <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
                      <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />

                      <p className="text-sm text-slate-400">
                        Bệnh nhân chưa có hồ sơ bệnh án
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        ...medicalRecords,
                      ]
                        .sort(
                          (
                            a,
                            b
                          ) => {
                            const dateA =
                              new Date(
                                a.recordDate ||
                                0
                              );

                            const dateB =
                              new Date(
                                b.recordDate ||
                                0
                              );

                            if (
                              dateB -
                              dateA !==
                              0
                            ) {
                              return (
                                dateB -
                                dateA
                              );
                            }

                            return (
                              (b.id ||
                                0) -
                              (a.id ||
                                0)
                            );
                          }
                        )
                        .map(
                          (
                            record
                          ) => {
                            const sc =
                              STATUS_CONFIG[
                              record
                                .status
                              ];

                            return (
                              <div
                                key={
                                  record.id
                                }
                                className="border border-slate-200 rounded-xl p-4 hover:border-cyan-200 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">
                                      Hồ sơ khám #
                                      {
                                        record.id
                                      }
                                    </p>

                                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                      <Calendar className="w-3 h-3" />

                                      {formatDate(
                                        record.recordDate
                                      )}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {record.status &&
                                      sc ? (
                                      <span
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sc.color}`}
                                      >
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                                        />

                                        {
                                          record.status
                                        }
                                      </span>
                                    ) : (
                                      <span className="text-xs text-slate-400">
                                        Chưa cập nhật
                                      </span>
                                    )}

                                    <button
                                      onClick={() =>
                                        openEditRecord(
                                          record
                                        )
                                      }
                                      className="p-1.5 rounded-lg hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 transition-colors"
                                      title="Sửa hồ sơ"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                                      Triệu chứng
                                    </p>

                                    <p className="text-sm text-slate-700">
                                      {record.symptoms ||
                                        "—"}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                                      Chẩn đoán
                                    </p>

                                    <p className="text-sm text-slate-700">
                                      {record.diagnosis ||
                                        "—"}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                                      Điều trị
                                    </p>

                                    <p className="text-sm text-slate-700">
                                      {record.treatment ||
                                        "—"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* FOOTER */}
            <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={closeModal}
                className="px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-semibold hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
                EDIT PATIENT MODAL
            ===================================================== */}
      {modal === "editPatient" &&
        selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* HEADER */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Chỉnh Sửa Thông Tin Bệnh Nhân
                  </h2>

                  <p className="text-xs font-mono text-cyan-600 mt-0.5">
                    {
                      selected.patientCode
                    }
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* HỌ TÊN */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Họ và tên{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    value={
                      patientForm.fullName
                    }
                    onChange={
                      handlePatientChange
                    }
                    name="fullName"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Email
                  </label>

                  <div className="flex items-center gap-2 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500">
                    <Mail className="w-4 h-4" />

                    {selected.email ||
                      "—"}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1">
                    Email được quản lý bởi
                    Auth Service và không thể
                    chỉnh sửa tại đây.
                  </p>
                </div>

                {/* PHONE */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Số điện thoại{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    name="phone"
                    value={
                      patientForm.phone
                    }
                    onChange={
                      handlePatientChange
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                    placeholder="09xx xxx xxx"
                  />
                </div>

                {/* GENDER + BLOOD */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      Giới tính
                    </label>

                    <select
                      name="gender"
                      value={
                        patientForm.gender
                      }
                      onChange={
                        handlePatientChange
                      }
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                    >
                      {GENDER_LIST.map(
                        (g) => (
                          <option
                            key={g}
                            value={g}
                          >
                            {g}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      Nhóm máu
                    </label>

                    <select
                      name="bloodType"
                      value={
                        patientForm.bloodType
                      }
                      onChange={
                        handlePatientChange
                      }
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                    >
                      {BLOOD_TYPES.map(
                        (b) => (
                          <option
                            key={b}
                            value={b}
                          >
                            {b}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* DATE OF BIRTH */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Ngày sinh
                  </label>

                  <input
                    type="date"
                    name="dateOfBirth"
                    value={
                      patientForm.dateOfBirth
                    }
                    onChange={
                      handlePatientChange
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* ADDRESS */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Địa chỉ
                  </label>

                  <input
                    name="address"
                    value={
                      patientForm.address
                    }
                    onChange={
                      handlePatientChange
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                    placeholder="Địa chỉ cư trú..."
                  />
                </div>

                {/* MEDICAL HISTORY */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Tiền sử bệnh
                  </label>

                  <textarea
                    name="medicalHistory"
                    value={
                      patientForm.medicalHistory
                    }
                    onChange={
                      handlePatientChange
                    }
                    rows={3}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 resize-none"
                    placeholder="Tiền sử bệnh..."
                  />
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  onClick={
                    handleEditPatient
                  }
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />

                  {saving
                    ? "Đang lưu..."
                    : "Lưu Thay Đổi"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* =====================================================
                EDIT MEDICAL RECORD MODAL
            ===================================================== */}
      {modal === "editRecord" &&
        selectedRecord && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* HEADER */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Chỉnh Sửa Hồ Sơ Bệnh Án
                  </h2>

                  <p className="text-xs text-slate-400 mt-0.5">
                    Hồ sơ #
                    {
                      selectedRecord.id
                    }
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* NGÀY KHÁM */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Ngày khám
                  </label>

                  <input
                    type="date"
                    name="recordDate"
                    value={
                      recordForm.recordDate
                    }
                    onChange={
                      handleRecordChange
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* STATUS */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Trạng thái
                  </label>

                  <select
                    name="status"
                    value={
                      recordForm.status
                    }
                    onChange={
                      handleRecordChange
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">
                      Chọn trạng thái
                    </option>

                    {STATUS_LIST.map(
                      (s) => (
                        <option
                          key={s}
                          value={s}
                        >
                          {s}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* TRIỆU CHỨNG */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Triệu chứng
                  </label>

                  <textarea
                    name="symptoms"
                    value={
                      recordForm.symptoms
                    }
                    onChange={
                      handleRecordChange
                    }
                    rows={3}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 resize-none"
                    placeholder="Mô tả triệu chứng..."
                  />
                </div>

                {/* CHẨN ĐOÁN */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Chẩn đoán
                  </label>

                  <textarea
                    name="diagnosis"
                    value={
                      recordForm.diagnosis
                    }
                    onChange={
                      handleRecordChange
                    }
                    rows={3}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 resize-none"
                    placeholder="Nhập chẩn đoán..."
                  />
                </div>

                {/* ĐIỀU TRỊ */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Điều trị
                  </label>

                  <textarea
                    name="treatment"
                    value={
                      recordForm.treatment
                    }
                    onChange={
                      handleRecordChange
                    }
                    rows={3}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 resize-none"
                    placeholder="Nhập phương pháp điều trị..."
                  />
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  onClick={
                    handleEditRecord
                  }
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />

                  {saving
                    ? "Đang lưu..."
                    : "Lưu Hồ Sơ"}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};