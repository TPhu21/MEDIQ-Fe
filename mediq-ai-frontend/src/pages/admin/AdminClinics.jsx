import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  DoorOpen,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Edit2,
  Power,
  Layers,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const getToken = () =>
  localStorage.getItem("accessToken") || localStorage.getItem("token") || "";

async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Yêu cầu thất bại (${response.status})`);
  }

  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;

  return response.json();
}

export const AdminClinics = () => {
  const navigate = useNavigate();

  const [clinics, setClinics] = useState([]);
  const [roomsCounts, setRoomsCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // Modal thêm / sửa
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    address: "",
    phone: "",
  });

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadClinics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/clinics");
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.content)
        ? data.content
        : [];

      setClinics(list);

      // Tải số lượng phòng cho từng cơ sở
      const counts = {};
      await Promise.all(
        list.map(async (c) => {
          const cId = c.clinicId || c.id;
          if (!cId) return;
          try {
            const rData = await apiRequest(`/clinics/${encodeURIComponent(cId)}/rooms`);
            const rList = Array.isArray(rData) ? rData : [];
            counts[cId] = rList.length;
          } catch {
            counts[cId] = 0;
          }
        })
      );
      setRoomsCounts(counts);
    } catch (err) {
      setError(`Không thể tải danh sách cơ sở khám: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClinics();
  }, [loadClinics]);

  const filteredClinics = useMemo(() => {
    const kw = searchTerm.trim().toLowerCase();
    if (!kw) return clinics;

    return clinics.filter((c) => {
      const code = String(c.code || "").toLowerCase();
      const name = String(c.name || "").toLowerCase();
      const address = String(c.address || "").toLowerCase();
      const phone = String(c.phone || "").toLowerCase();

      return (
        code.includes(kw) ||
        name.includes(kw) ||
        address.includes(kw) ||
        phone.includes(kw)
      );
    });
  }, [clinics, searchTerm]);

  const handleOpenAdd = () => {
    setEditingClinic(null);
    setFormData({
      code: "",
      name: "",
      address: "",
      phone: "",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (clinic) => {
    setEditingClinic(clinic);
    setFormData({
      code: clinic.code || "",
      name: clinic.name || "",
      address: clinic.address || "",
      phone: clinic.phone || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast("Vui lòng nhập tên cơ sở khám", "error");
      return;
    }

    if (!editingClinic && !formData.code.trim()) {
      showToast("Vui lòng nhập mã cơ sở khám", "error");
      return;
    }

    setSaving(true);

    try {
      if (editingClinic) {
        // Cập nhật cơ sở
        const cId = editingClinic.clinicId || editingClinic.id;
        await apiRequest(`/clinics/${encodeURIComponent(cId)}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: formData.name.trim(),
            address: formData.address.trim() || null,
            phone: formData.phone.trim() || null,
          }),
        });

        showToast(`Cập nhật cơ sở "${formData.name}" thành công!`);
      } else {
        // Thêm cơ sở mới
        await apiRequest("/clinics", {
          method: "POST",
          body: JSON.stringify({
            code: formData.code.trim().toUpperCase(),
            name: formData.name.trim(),
            address: formData.address.trim() || null,
            phone: formData.phone.trim() || null,
          }),
        });

        showToast(`Thêm cơ sở khám "${formData.name}" thành công!`);
      }

      setModalOpen(false);
      loadClinics();
    } catch (err) {
      showToast(`Thao tác thất bại: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (clinic) => {
    const cId = clinic.clinicId || clinic.id;
    const isCurrentlyActive = clinic.status === "ACTIVE";
    const action = isCurrentlyActive ? "deactivate" : "activate";

    try {
      await apiRequest(`/clinics/${encodeURIComponent(cId)}/${action}`, {
        method: "POST",
      });

      showToast(
        `Đã ${isCurrentlyActive ? "tạm ngưng" : "kích hoạt"} cơ sở "${clinic.name}"`
      );
      loadClinics();
    } catch (err) {
      showToast(`Không thể đổi trạng thái: ${err.message}`, "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 animate-bounce ${
            toast.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-cyan-600" />
            Quản Lý Cơ Sở Khám (Khu)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý các chi nhánh, cơ sở bệnh viện và khu vực tiếp nhận khám bệnh.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadClinics}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition shadow-xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm Cơ Sở Khám
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Stats */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã, tên cơ sở, địa chỉ..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Tổng số: <b className="text-slate-800 font-bold">{clinics.length}</b> cơ sở
        </div>
      </div>

      {/* Clinic Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-600" />
          <p className="text-sm">Đang tải danh sách cơ sở khám...</p>
        </div>
      ) : filteredClinics.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">
          {clinics.length === 0
            ? "Chưa có cơ sở khám nào. Hãy bấm 'Thêm Cơ Sở Khám' để tạo mới."
            : "Không tìm thấy cơ sở khám phù hợp với tìm kiếm."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClinics.map((clinic) => {
            const cId = clinic.clinicId || clinic.id;
            const roomCount = roomsCounts[cId] ?? 0;
            const isActive = clinic.status === "ACTIVE";

            return (
              <div
                key={cId}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-cyan-400 hover:shadow-sm transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-cyan-100/70 text-cyan-700 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate">
                          {clinic.name}
                        </h3>
                        <span className="text-[11px] font-mono font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-md">
                          {clinic.code}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {isActive ? "Đang hoạt động" : "Tạm ngưng"}
                    </span>
                  </div>

                  <div className="space-y-2 mt-4 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {clinic.address || "Chưa cập nhật địa chỉ"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{clinic.phone || "Chưa cập nhật SĐT"}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <DoorOpen className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      <span className="font-semibold text-slate-700">
                        {roomCount} phòng khám thuộc cơ sở này
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/rooms?clinicId=${cId}`)}
                    className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1.5"
                  >
                    <span>Xem phòng khám</span>
                    <DoorOpen className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(clinic)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                      title="Chỉnh sửa thông tin cơ sở"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(clinic)}
                      className={`p-1.5 rounded-lg transition ${
                        isActive
                          ? "text-amber-600 hover:bg-amber-50"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                      title={isActive ? "Tạm ngưng cơ sở" : "Kích hoạt cơ sở"}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm / Chỉnh Sửa */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-600" />
                {editingClinic ? "Chỉnh Sửa Cơ Sở Khám" : "Thêm Cơ Sở Khám Mới"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Mã Cơ Sở (Code) {!editingClinic && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  required={!editingClinic}
                  disabled={!!editingClinic}
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="Ví dụ: CL-C, CS03, KHU-C"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Tên Cơ Sở Khám <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ví dụ: Cơ sở 3 - Cầu Giấy, Khu C - Nhi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Địa Chỉ Chi Tiết
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Ví dụ: Số 123 Cầu Giấy, Hà Nội"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Số Điện Thoại Liên Hệ
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Ví dụ: 024-3825-5003"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Đang lưu...
                    </>
                  ) : editingClinic ? (
                    "Cập Nhật"
                  ) : (
                    "Tạo Cơ Sở Khám"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClinics;
