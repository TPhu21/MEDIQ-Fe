import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  X,
  Check,
  Stethoscope,
  Star,
  Building2,
  Calendar,
  Clock,
  Award,
  UserRound,
  Phone
} from "lucide-react";

import {
  getAllDoctors,
  getAllSpecialties,
  createDoctor,
  updateDoctor
} from "../../api/adminApi";

const STATUS_CONFIG = {
  ACTIVE: {
    label: "Đang hoạt động",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500"
  },
  INACTIVE: {
    label: "Không hoạt động",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500"
  },
  SUSPENDED: {
    label: "Tạm đình chỉ",
    color: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500"
  }
};

const STATUS_LIST = ["ACTIVE", "INACTIVE", "SUSPENDED"];

const EMPTY_FORM = {
  userId: "",
  fullName: "",
  phoneNumber: "",
  licenseNumber: "",
  status: "ACTIVE",
  specialties: []
};

// Chuẩn hóa số điện thoại Việt Nam
const normalizePhoneNumber = (value = "") => {
  let phone = value.trim().replace(/[\s.-]/g, "");

  if (phone.startsWith("+84")) {
    phone = "0" + phone.slice(3);
  } else if (phone.startsWith("84")) {
    phone = "0" + phone.slice(2);
  }

  return phone;
};

// Kiểm tra số di động Việt Nam gồm 10 chữ số
const isValidPhoneNumber = (value = "") => {
  const phone = normalizePhoneNumber(value);
  return /^(03|05|07|08|09)\d{8}$/.test(phone);
};

export const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // =========================================================
  // TOAST
  // =========================================================

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // =========================================================
  // LOAD DOCTORS
  // =========================================================

  const loadDoctors = async () => {
    try {
      setLoading(true);

      const data = await getAllDoctors();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi lấy danh sách bác sĩ:", error);

      showToast(
        error?.response?.data?.message ||
        "Không thể tải danh sách bác sĩ",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD SPECIALTIES
  // =========================================================

  const loadSpecialties = async () => {
    try {
      setLoadingSpecialties(true);

      const data = await getAllSpecialties("ACTIVE");
      setSpecialties(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi lấy danh sách chuyên khoa:", error);

      showToast(
        error?.response?.data?.message ||
        "Không thể tải danh sách chuyên khoa",
        "error"
      );
    } finally {
      setLoadingSpecialties(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadDoctors();
    loadSpecialties();
  }, []);

  // =========================================================
  // GET SPECIALTY NAMES
  // =========================================================

  const getSpecialtyNames = (doctor) => {
    if (!doctor?.specialties?.length) return [];

    return doctor.specialties
      .map((specialty) => specialty.name)
      .filter(Boolean);
  };

  // =========================================================
  // GET PRIMARY SPECIALTY
  // =========================================================

  const getPrimarySpecialty = (doctor) => {
    const primary = doctor?.specialties?.find(
      (specialty) => specialty.primary === true
    );

    if (primary?.name) return primary.name;

    return getSpecialtyNames(doctor)[0] || "Chưa cập nhật";
  };

  // =========================================================
  // GET DOCTOR ROOM
  // =========================================================

  const getDoctorRoom = (doctor) => {
    if (!doctor?.workSchedules?.length) return null;

    const approvedSchedule = doctor.workSchedules.find(
      (schedule) => schedule.status === "APPROVED"
    );

    const schedule = approvedSchedule || doctor.workSchedules[0];

    if (!schedule) return null;

    if (schedule.roomCode && schedule.roomName) {
      return `${schedule.roomCode} - ${schedule.roomName}`;
    }

    return schedule.roomName || schedule.roomCode || null;
  };

  // =========================================================
  // GET APPROVED SCHEDULES
  // =========================================================

  const getApprovedSchedules = (doctor) => {
    return (doctor?.workSchedules || [])
      .filter((schedule) => schedule.status === "APPROVED")
      .sort((a, b) => {
        const dateA = `${a.date || ""} ${a.startTime || ""}`;
        const dateB = `${b.date || ""} ${b.startTime || ""}`;

        return dateA.localeCompare(dateB);
      });
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "—";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) return date;

    return d.toLocaleDateString("vi-VN");
  };

  // =========================================================
  // FILTER DOCTORS
  // =========================================================

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const specialtyText = getSpecialtyNames(doctor)
        .join(" ")
        .toLowerCase();

      const room = getDoctorRoom(doctor)?.toLowerCase() || "";

      const matchSearch =
        !q ||
        doctor.fullName?.toLowerCase().includes(q) ||
        doctor.phoneNumber?.toLowerCase().includes(q) ||
        doctor.licenseNumber?.toLowerCase().includes(q) ||
        specialtyText.includes(q) ||
        room.includes(q);

      const matchSpecialty =
        specialtyFilter === "ALL" ||
        getSpecialtyNames(doctor).includes(specialtyFilter);

      const matchStatus =
        statusFilter === "ALL" || doctor.status === statusFilter;

      return matchSearch && matchSpecialty && matchStatus;
    });
  }, [doctors, search, specialtyFilter, statusFilter]);

  // =========================================================
  // STATUS COUNTS
  // =========================================================

  const statusCounts = useMemo(() => {
    return STATUS_LIST.reduce((acc, status) => {
      acc[status] = doctors.filter(
        (doctor) => doctor.status === status
      ).length;

      return acc;
    }, {});
  }, [doctors]);

  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const openAdd = () => {
    setSelected(null);
    setForm({ ...EMPTY_FORM, specialties: [] });
    setModal("add");
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEdit = (doctor) => {
    setSelected(doctor);

    setForm({
      userId: doctor.userId || "",
      fullName: doctor.fullName || "",
      phoneNumber: doctor.phoneNumber || "",
      licenseNumber: doctor.licenseNumber || "",
      status: doctor.status || "ACTIVE",
      specialties: (doctor.specialties || []).map((specialty) => ({
        specialtyId: specialty.specialtyId,
        name: specialty.name,
        primary: specialty.primary === true
      }))
    });

    setModal("edit");
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setForm({ ...EMPTY_FORM, specialties: [] });
  };

  // =========================================================
  // TOGGLE SPECIALTY
  // =========================================================

  const toggleSpecialty = (specialty) => {
    setForm((prev) => {
      const exists = prev.specialties.some(
        (item) => item.specialtyId === specialty.specialtyId
      );

      if (exists) {
        let newSpecialties = prev.specialties.filter(
          (item) => item.specialtyId !== specialty.specialtyId
        );

        const hasPrimary = newSpecialties.some(
          (item) => item.primary === true
        );

        if (newSpecialties.length > 0 && !hasPrimary) {
          newSpecialties = newSpecialties.map((item, index) => ({
            ...item,
            primary: index === 0
          }));
        }

        return { ...prev, specialties: newSpecialties };
      }

      const isFirst = prev.specialties.length === 0;

      return {
        ...prev,
        specialties: [
          ...prev.specialties,
          {
            specialtyId: specialty.specialtyId,
            name: specialty.name,
            primary: isFirst
          }
        ]
      };
    });
  };

  // =========================================================
  // SET PRIMARY SPECIALTY
  // =========================================================

  const setPrimarySpecialty = (specialtyId) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.map((specialty) => ({
        ...specialty,
        primary: specialty.specialtyId === specialtyId
      }))
    }));
  };

  // =========================================================
  // VALIDATE PHONE NUMBER
  // =========================================================

  const validatePhone = () => {
    if (!form.phoneNumber.trim()) {
      showToast("Vui lòng nhập số điện thoại bác sĩ", "error");
      return null;
    }

    const normalizedPhone = normalizePhoneNumber(form.phoneNumber);

    if (!isValidPhoneNumber(form.phoneNumber)) {
      showToast(
        "SĐT không hợp lệ. Nhập số di động Việt Nam gồm 10 chữ số",
        "error"
      );
      return null;
    }

    return normalizedPhone;
  };

  // =========================================================
  // ADD DOCTOR
  // =========================================================

  const handleAdd = async () => {
    if (
      !form.userId.trim() ||
      !form.fullName.trim() ||
      !form.licenseNumber.trim()
    ) {
      showToast(
        "Vui lòng nhập User ID, họ tên và số giấy phép",
        "error"
      );
      return;
    }

    const normalizedPhone = validatePhone();
    if (!normalizedPhone) return;

    if (form.specialties.length === 0) {
      showToast("Vui lòng chọn ít nhất một chuyên khoa", "error");
      return;
    }

    const hasPrimary = form.specialties.some(
      (specialty) => specialty.primary === true
    );

    if (!hasPrimary) {
      showToast("Vui lòng chọn một chuyên khoa chính", "error");
      return;
    }

    try {
      setSaving(true);

      const doctorName = form.fullName.trim();


      const payload = {
        userId: form.userId.trim(),
        fullName: doctorName,
        phoneNumber: normalizedPhone,
        licenseNumber: form.licenseNumber.trim(),
        status: form.status,
        specialties: form.specialties.map((specialty) => ({
          specialtyId: specialty.specialtyId,
          isPrimary: specialty.primary === true
        }))
      };


      await createDoctor(payload);
      await loadDoctors();
      closeModal();

      showToast(`Đã thêm bác sĩ "${doctorName}"`);
    } catch (error) {
      console.error("Lỗi thêm bác sĩ:", error);

      showToast(
        error?.response?.data?.message || "Không thể thêm bác sĩ",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // EDIT DOCTOR
  // =========================================================

  const handleEdit = async () => {
    if (!selected) return;

    if (!form.fullName.trim()) {
      showToast("Họ tên bác sĩ không được để trống", "error");
      return;
    }

    const normalizedPhone = validatePhone();
    if (!normalizedPhone) return;

    if (form.specialties.length === 0) {
      showToast("Vui lòng chọn ít nhất một chuyên khoa", "error");
      return;
    }

    const primaryCount = form.specialties.filter(
      (specialty) => specialty.primary === true
    ).length;

    if (primaryCount === 0) {
      showToast("Vui lòng chọn một chuyên khoa chính", "error");
      return;
    }

    if (primaryCount > 1) {
      showToast("Chỉ được chọn một chuyên khoa chính", "error");
      return;
    }

    try {
      setSaving(true);

      const doctorName = form.fullName.trim();

      const payload = {
        fullName: doctorName,
        phoneNumber: normalizedPhone,
        licenseNumber: form.licenseNumber.trim(),
        status: form.status,
        specialties: form.specialties.map((specialty) => ({
          specialtyId: specialty.specialtyId,
          isPrimary: specialty.primary === true
        }))
      };

      await updateDoctor(selected.doctorId, payload);
      await loadDoctors();
      closeModal();

      showToast(`Đã cập nhật bác sĩ "${doctorName}"`);
    } catch (error) {
      console.error("Lỗi cập nhật bác sĩ:", error);

      showToast(
        error?.response?.data?.message ||
        "Không thể cập nhật bác sĩ",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // RENDER STARS
  // =========================================================

  const renderStars = () => (
    <span className="flex items-center gap-0.5">
      {[...Array(5)].map((_, index) => (
        <Star
          key={index}
          className="w-3 h-3 text-slate-300"
        />
      ))}

      <span className="text-[11px] text-slate-400 ml-1">
        Chưa có đánh giá
      </span>
    </span>
  );

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-slate-500">
          Đang tải danh sách bác sĩ...
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-5">
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 ${toast.type === "error"
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

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản Lý Bác Sĩ
          </h1>

          <p className="text-sm text-slate-500 mt-0.5">
            Tổng cộng{" "}
            <span className="font-bold text-slate-700">
              {doctors.length}
            </span>{" "}
            bác sĩ
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm Bác Sĩ
        </button>
      </div>

      {/* STATUS SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STATUS_LIST.map((status) => {
          const config = STATUS_CONFIG[status];

          return (
            <button
              key={status}
              onClick={() =>
                setStatusFilter(
                  statusFilter === status ? "ALL" : status
                )
              }
              className={`bg-white rounded-xl border p-3 text-left transition-all hover:shadow-sm ${statusFilter === status
                ? "border-cyan-400 ring-2 ring-cyan-100"
                : "border-slate-200"
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                <span className="text-[11px] font-bold text-slate-600 uppercase">
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

      {/* SEARCH + FILTER */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, SĐT, mã giấy phép, chuyên khoa..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </div>

        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-cyan-400"
        >
          <option value="ALL">Tất cả chuyên khoa</option>

          {specialties.map((specialty) => (
            <option
              key={specialty.specialtyId}
              value={specialty.name}
            >
              {specialty.name}
            </option>
          ))}
        </select>
      </div>

      {/* DOCTOR CARDS */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
          Không tìm thấy bác sĩ
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doctor) => {
            const status =
              STATUS_CONFIG[doctor.status] ||
              STATUS_CONFIG.INACTIVE;

            const specialty = getPrimarySpecialty(doctor);
            const room = getDoctorRoom(doctor);
            const schedules = getApprovedSchedules(doctor);

            return (
              <div
                key={doctor.doctorId}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5"
              >
                {/* CARD HEADER */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 shrink-0 bg-cyan-100 rounded-xl flex items-center justify-center text-lg font-bold text-cyan-700">
                      {doctor.fullName
                        ?.trim()
                        ?.split(" ")
                        ?.pop()
                        ?.charAt(0)
                        ?.toUpperCase() || "B"}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm break-words">
                        {doctor.fullName}
                      </p>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.color} mt-0.5`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
                        />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openEdit(doctor)}
                    title="Chỉnh sửa bác sĩ"
                    className="p-1.5 rounded-lg hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* CARD INFO */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Stethoscope className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span className="font-semibold text-cyan-700">
                      {specialty}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span className="break-all">
                      {doctor.phoneNumber || "Chưa cập nhật SĐT"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      {doctor.licenseNumber || "Chưa cập nhật giấy phép"}
                    </span>
                  </div>

                  {room && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{room}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Tham gia: {formatDate(doctor.createdAt)}
                    </span>
                  </div>
                </div>

                {/* ALL SPECIALTIES */}
                {doctor.specialties?.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                      Chuyên khoa
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {doctor.specialties.map((specialtyItem) => (
                        <span
                          key={specialtyItem.specialtyId}
                          className={`px-2 py-1 rounded-md text-[10px] font-medium ${specialtyItem.primary
                            ? "bg-cyan-100 text-cyan-700"
                            : "bg-slate-100 text-slate-600"
                            }`}
                        >
                          {specialtyItem.name}
                          {specialtyItem.primary && " • Chính"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* WORK SCHEDULE */}
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2">
                    <Clock className="w-3.5 h-3.5 text-cyan-500" />
                    Lịch làm việc
                  </div>

                  {schedules.length === 0 ? (
                    <span className="text-[11px] text-slate-400">
                      Chưa có lịch đã duyệt
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {schedules.slice(0, 2).map((schedule) => (
                        <span
                          key={schedule.scheduleId}
                          className="px-1.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md"
                        >
                          {formatDate(schedule.date)}{" "}
                          {schedule.startTime?.slice(0, 5)} -{" "}
                          {schedule.endTime?.slice(0, 5)}
                        </span>
                      ))}

                      {schedules.length > 2 && (
                        <span className="px-1.5 py-1 bg-slate-100 text-slate-400 text-[10px] font-medium rounded-md">
                          +{schedules.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* CARD FOOTER */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {renderStars()}

                  <span className="text-[10px] text-slate-400">
                    {doctor.specialties?.length || 0} chuyên khoa
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-20">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {modal === "add"
                    ? "Thêm Bác Sĩ Mới"
                    : "Chỉnh Sửa Bác Sĩ"}
                </h2>

                {modal === "edit" && selected && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selected.fullName}
                  </p>
                )}
              </div>

              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                disabled={saving}
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 space-y-4">
              {/* USER ID - ADD ONLY */}
              {modal === "add" && (
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    User ID <span className="text-red-500">*</span>
                  </label>

                  <input
                    value={form.userId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        userId: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    placeholder="UUID của tài khoản User"
                  />

                  <p className="text-[11px] text-slate-400 mt-1">
                    Tài khoản User phải tồn tại trước trong Auth Service.
                  </p>
                </div>
              )}

              {/* FULL NAME */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                  Họ và tên <span className="text-red-500">*</span>
                </label>

                <input
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      fullName: e.target.value
                    }))
                  }
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              {/* PHONE NUMBER */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value
                      }))
                    }
                    maxLength={15}
                    autoComplete="tel"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    placeholder="0912345678"
                  />
                </div>

                <p className="text-[11px] text-slate-400 mt-1">
                  Chấp nhận số Việt Nam như 0912345678 hoặc +84912345678.
                </p>
              </div>

              {/* LICENSE NUMBER */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                  Số giấy phép <span className="text-red-500">*</span>
                </label>

                <input
                  value={form.licenseNumber}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      licenseNumber: e.target.value
                    }))
                  }

                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  placeholder="BS-MEDIQ-001"
                />

                {modal === "edit" && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Số giấy phép được giữ nguyên sau khi bác sĩ được tạo.
                  </p>
                )}
              </div>

              {/* SPECIALTIES */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-600">
                    Chuyên khoa <span className="text-red-500">*</span>
                  </label>

                  {form.specialties.length > 0 && (
                    <span className="text-[11px] text-cyan-600 font-semibold">
                      {form.specialties.length} đã chọn
                    </span>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  {loadingSpecialties ? (
                    <div className="p-4 text-center text-sm text-slate-400">
                      Đang tải chuyên khoa...
                    </div>
                  ) : specialties.length === 0 ? (
                    <div className="p-4 bg-amber-50 text-xs text-amber-700">
                      Chưa có chuyên khoa đang hoạt động. Hãy tạo chuyên khoa
                      trong Scheduling Service trước.
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto p-2">
                      {specialties.map((specialtyItem) => {
                        const selectedSpecialty = form.specialties.find(
                          (item) =>
                            item.specialtyId === specialtyItem.specialtyId
                        );

                        const isSelected = Boolean(selectedSpecialty);
                        const isPrimary =
                          selectedSpecialty?.primary === true;

                        return (
                          <div
                            key={specialtyItem.specialtyId}
                            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${isSelected
                              ? "bg-cyan-50 border border-cyan-100"
                              : "hover:bg-slate-50 border border-transparent"
                              }`}
                          >
                            <label className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleSpecialty(specialtyItem)
                                }
                                className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                              />

                              <div className="min-w-0">
                                <p
                                  className={`text-sm ${isSelected
                                    ? "font-semibold text-cyan-700"
                                    : "font-medium text-slate-700"
                                    }`}
                                >
                                  {specialtyItem.name}
                                </p>

                                {specialtyItem.description && (
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {specialtyItem.description}
                                  </p>
                                )}
                              </div>
                            </label>

                            {isSelected && (
                              <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                                <input
                                  type="radio"
                                  name="primarySpecialty"
                                  checked={isPrimary}
                                  onChange={() =>
                                    setPrimarySpecialty(
                                      specialtyItem.specialtyId
                                    )
                                  }
                                  className="w-3.5 h-3.5 text-cyan-600 focus:ring-cyan-500"
                                />

                                <span
                                  className={`text-[11px] ${isPrimary
                                    ? "text-cyan-700 font-semibold"
                                    : "text-slate-500"
                                    }`}
                                >
                                  Chính
                                </span>
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-1.5">
                  Có thể chọn nhiều chuyên khoa nhưng chỉ được chọn một chuyên khoa chính.
                </p>
              </div>

              {/* STATUS - EDIT ONLY */}
              {modal === "edit" && (
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                    Trạng thái
                  </label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        status: e.target.value
                      }))
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  >
                    {STATUS_LIST.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_CONFIG[status].label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* NOTE */}
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <UserRound className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />

                  <div className="text-xs text-cyan-700">
                    {modal === "add" ? (
                      <p>
                        Bác sĩ được tạo từ tài khoản User đã tồn tại. Số điện
                        thoại sẽ được lưu cùng thông tin bác sĩ.
                      </p>
                    ) : (
                      <p>
                        Bạn có thể thay đổi họ tên, SĐT, chuyên khoa và trạng
                        thái của bác sĩ. Lịch làm việc và phòng khám được quản
                        lý tại Scheduling Service.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  onClick={modal === "add" ? handleAdd : handleEdit}
                  disabled={saving || loadingSpecialties || specialties.length === 0}
                  className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors"
                >
                  {saving
                    ? "Đang lưu..."
                    : modal === "add"
                      ? "Thêm Mới"
                      : "Lưu Thay Đổi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

