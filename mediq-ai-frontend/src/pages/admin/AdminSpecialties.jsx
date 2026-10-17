import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search, Plus, Pencil, Trash2, X, Check, Heart, Stethoscope,
  Activity, Sparkles, Brain, Baby, Users, MapPin, FileText
} from "lucide-react";

import {
  getSpecialties,
  createSpecialty,
  updateSpecialty,
  getAllClinics,
  getRoomsByClinic,
  getDoctorsFromGateway,
  getDoctorSpecialtiesFromGateway,
  getSpecialtyAppointmentStats,
} from "../../api/adminApi";

const ICON_MAP = {
  Heart, Stethoscope, Activity, Sparkles, Brain, Baby,
};

const COLOR_CONFIG = {
  rose: {
    bg: "bg-rose-50",
    icon: "text-rose-500",
    border: "border-rose-200",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
  },
  cyan: {
    bg: "bg-cyan-50",
    icon: "text-cyan-500",
    border: "border-cyan-200",
    badge: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-500",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-500",
    border: "border-purple-200",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
  },
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-500",
    border: "border-indigo-200",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-500",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
};

const ICON_OPTIONS = [
  "Heart", "Stethoscope", "Activity", "Sparkles", "Brain", "Baby",
];

const COLOR_OPTIONS = [
  "rose", "cyan", "amber", "purple", "indigo", "emerald",
];

const EMPTY_FORM = {
  name: "",
  description: "",
  defaultSlotDuration: 30,
  icon: "Stethoscope",
  color: "cyan",
  room: "",
  doctorsCount: 0,
  patientsThisMonth: 0,
};

const getList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export const AdminSpecialties = () => {
  const [specialties, setSpecialties] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // =========================
  // LOAD REAL DATA
  // =========================

  const loadSpecialties = useCallback(async () => {
    setLoading(true);

    try {
      const [
        specialtyResponse,
        clinicResponse,
        doctorResponse,
        statsResponse,
      ] = await Promise.all([
        getSpecialties(),
        getAllClinics(),
        getDoctorsFromGateway(),
        getSpecialtyAppointmentStats(),
      ]);

      const specialtyList = getList(specialtyResponse);
      const clinics = getList(clinicResponse);
      const doctors = getList(doctorResponse);
      const stats = getList(statsResponse);

      // Lấy phòng từ các phòng khám.
      const roomsByClinic = await Promise.all(
        clinics.map(async (clinic) => {
          const clinicId = clinic.clinicId ?? clinic.id;

          if (!clinicId) return [];

          try {
            return getList(await getRoomsByClinic(clinicId));
          } catch (error) {
            console.error(
              `Không tải được phòng của phòng khám ${clinicId}`,
              error
            );
            return [];
          }
        })
      );

      const rooms = roomsByClinic.flat();

      // Lấy danh sách chuyên khoa của từng bác sĩ.
      const doctorSpecialtyLists = await Promise.all(
        doctors.map(async (doctor) => {
          const doctorId = doctor.doctorId ?? doctor.id;

          if (!doctorId) return [];

          try {
            const response =
              await getDoctorSpecialtiesFromGateway(doctorId);

            return getList(response)
              .map((item) =>
                typeof item === "string"
                  ? item
                  : item.specialtyId
              )
              .filter(Boolean);
          } catch (error) {
            console.error(
              `Không tải được chuyên khoa của bác sĩ ${doctorId}`,
              error
            );
            return [];
          }
        })
      );

      const doctorsBySpecialty = {};

      doctorSpecialtyLists.forEach((specialtyIds) => {
        [...new Set(specialtyIds)].forEach((specialtyId) => {
          doctorsBySpecialty[specialtyId] =
            (doctorsBySpecialty[specialtyId] || 0) + 1;
        });
      });

      const statsBySpecialty = Object.fromEntries(
        stats.map((item) => [
          item.specialtyId,
          Number(item.patientsThisMonth ?? 0),
        ])
      );

      const mapped = specialtyList.map((specialty) => {
        const specialtyId =
          specialty.specialtyId ?? specialty.id;

        const specialtyRooms = rooms.filter(
          (room) => room.specialtyId === specialtyId
        );

        return {
          ...specialty,
          id: specialtyId,
          name: specialty.name ?? "",
          description: specialty.description ?? "",
          defaultSlotDuration:
            specialty.defaultSlotDuration ?? 30,

          room: specialtyRooms.length
            ? specialtyRooms
              .map((room) => room.name || room.code)
              .filter(Boolean)
              .join(", ")
            : "Chưa có phòng",

          doctorsCount:
            doctorsBySpecialty[specialtyId] || 0,

          patientsThisMonth:
            statsBySpecialty[specialtyId] || 0,

          // Icon và màu chỉ dùng cho giao diện.
          icon: specialty.icon || "Stethoscope",
          color: specialty.color || "cyan",
        };
      });

      setSpecialties(mapped);
    } catch (error) {
      console.error("Lỗi tải dữ liệu chuyên khoa:", error);
      showToast(
        error.response?.data?.message ||
        "Không thể tải dữ liệu chuyên khoa",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpecialties();
  }, [loadSpecialties]);

  // =========================
  // SEARCH
  // =========================

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return specialties.filter(
      (specialty) =>
        (specialty.name || "").toLowerCase().includes(q) ||
        (specialty.room || "").toLowerCase().includes(q) ||
        (specialty.description || "").toLowerCase().includes(q)
    );
  }, [specialties, search]);

  // =========================
  // MODAL
  // =========================

  const openAdd = () => {
    setSelected(null);
    setForm({ ...EMPTY_FORM });
    setModal("add");
  };

  const openEdit = (specialty) => {
    setSelected(specialty);

    setForm({
      name: specialty.name || "",
      description: specialty.description || "",
      defaultSlotDuration: specialty.defaultSlotDuration ?? 30,
      icon: specialty.icon || "Stethoscope",
      color: specialty.color || "cyan",
      room: specialty.room || "Chưa có phòng",
      doctorsCount: specialty.doctorsCount || 0,
      patientsThisMonth: specialty.patientsThisMonth || 0,
    });

    setModal("edit");
  };

  const openDelete = (specialty) => {
    setSelected(specialty);
    setModal("delete");
  };

  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setSelected(null);
  };

  // =========================
  // CREATE SPECIALTY
  // =========================

  const handleAdd = async () => {
    if (!form.name.trim()) {
      showToast("Vui lòng nhập tên chuyên khoa", "error");
      return;
    }

    const duration = Number(form.defaultSlotDuration);

    if (!Number.isInteger(duration) || duration <= 0) {
      showToast("Thời lượng khung giờ phải là số nguyên dương", "error");
      return;
    }

    setSaving(true);

    try {
      await createSpecialty({
        name: form.name.trim(),
        description: form.description.trim(),
        defaultSlotDuration: duration,
      });

      await loadSpecialties();
      setModal(null);
      setSelected(null);

      showToast(`Đã thêm chuyên khoa "${form.name}"`);
    } catch (error) {
      console.error("Lỗi thêm chuyên khoa:", error);
      showToast(
        error.response?.data?.message ||
        "Không thể thêm chuyên khoa",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // UPDATE SPECIALTY
  // =========================

  const handleEdit = async () => {
    if (!selected?.id || !form.name.trim()) {
      showToast("Thông tin chuyên khoa không hợp lệ", "error");
      return;
    }

    const duration = Number(form.defaultSlotDuration);

    if (!Number.isInteger(duration) || duration <= 0) {
      showToast("Thời lượng khung giờ phải là số nguyên dương", "error");
      return;
    }

    setSaving(true);

    try {
      await updateSpecialty(selected.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        defaultSlotDuration: duration,
      });

      await loadSpecialties();
      setModal(null);
      setSelected(null);

      showToast(`Đã cập nhật chuyên khoa "${form.name}"`);
    } catch (error) {
      console.error("Lỗi cập nhật chuyên khoa:", error);
      showToast(
        error.response?.data?.message ||
        "Không thể cập nhật chuyên khoa",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // Chưa xóa dữ liệu thật khi chưa xác nhận API DELETE.
  const handleDelete = () => {
    showToast(
      "Chức năng xóa chưa được kết nối với API backend",
      "error"
    );
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className="space-y-5">
      {/* Toast */}
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản Lý Chuyên Khoa
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tổng cộng{" "}
            <span className="font-bold text-slate-700">
              {specialties.length}
            </span>{" "}
            chuyên khoa
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm Chuyên Khoa
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên, vị trí, mô tả..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
        />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">
            {specialties.length}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Chuyên Khoa
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-cyan-700">
            {specialties.reduce(
              (total, item) =>
                total + (item.doctorsCount || 0),
              0
            )}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Tổng Bác Sĩ
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">
            {specialties.reduce(
              (total, item) =>
                total + (item.patientsThisMonth || 0),
              0
            )}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            BN Tháng Này
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
          Đang tải dữ liệu chuyên khoa...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
          Không tìm thấy kết quả
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((specialty) => {
            const cc =
              COLOR_CONFIG[specialty.color] ||
              COLOR_CONFIG.cyan;

            const IconComp =
              ICON_MAP[specialty.icon] || Stethoscope;

            return (
              <div
                key={specialty.id}
                className={`bg-white rounded-2xl border ${cc.border} shadow-sm p-5 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-11 h-11 ${cc.bg} rounded-xl flex items-center justify-center`}
                  >
                    <IconComp
                      className={`w-5 h-5 ${cc.icon}`}
                    />
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEdit(specialty)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-cyan-600 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => openDelete(specialty)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {specialty.name}
                </h3>

                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  {specialty.description || "Chưa có mô tả"}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <MapPin className="w-3 h-3" />
                  {specialty.room}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <Activity className="w-3 h-3" />
                  {specialty.defaultSlotDuration} phút/khung giờ
                </div>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${cc.badge}`}
                  >
                    <Users className="w-3 h-3" />
                    {specialty.doctorsCount} BS
                  </span>

                  <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <FileText className="w-3 h-3" />
                    {specialty.patientsThisMonth || 0} BN/tháng
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {modal === "add" && "Thêm Chuyên Khoa Mới"}
                {modal === "edit" &&
                  `Chỉnh Sửa: ${selected?.name}`}
                {modal === "delete" && "Xác Nhận Xóa"}
              </h2>

              <button
                onClick={closeModal}
                disabled={saving}
                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              {modal === "delete" ? (
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6 text-red-500" />
                  </div>

                  <p className="text-sm text-slate-700">
                    Bạn có chắc muốn xóa chuyên khoa{" "}
                    <span className="font-bold">
                      "{selected?.name}"
                    </span>
                    ?
                  </p>

                  <p className="text-xs text-amber-700">
                    API xóa chưa được xác nhận.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={closeModal}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Đóng
                    </button>

                    <button
                      onClick={handleDelete}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      Tên chuyên khoa{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                      placeholder="VD: Tim mạch"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      Mô tả
                    </label>

                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      rows={2}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 resize-none"
                      placeholder="Mô tả ngắn về chuyên khoa..."
                    />
                  </div>

                  {/* DEFAULT SLOT DURATION */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      Thời lượng mỗi khung giờ (phút){" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="number"
                      min={1}
                      step={1}
                      required
                      value={form.defaultSlotDuration}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          defaultSlotDuration:
                            e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                      placeholder="VD: 30"
                    />

                    <p className="text-xs text-slate-400 mt-1">
                      Số phút mặc định cho mỗi khung giờ khám.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      Vị trí phòng
                    </label>

                    <input
                      value={form.room}
                      readOnly
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                        Số bác sĩ
                      </label>

                      <input
                        type="number"
                        value={form.doctorsCount}
                        readOnly
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                        BN/tháng
                      </label>

                      <input
                        type="number"
                        value={form.patientsThisMonth}
                        readOnly
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                        Biểu tượng
                      </label>

                      <select
                        value={form.icon}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            icon: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                      >
                        {ICON_OPTIONS.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                        Màu sắc
                      </label>

                      <select
                        value={form.color}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            color: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                      >
                        {COLOR_OPTIONS.map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={closeModal}
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Hủy
                    </button>

                    <button
                      onClick={
                        modal === "add"
                          ? handleAdd
                          : handleEdit
                      }
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      {saving
                        ? "Đang lưu..."
                        : modal === "add"
                          ? "Thêm Mới"
                          : "Lưu Thay Đổi"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSpecialties;
