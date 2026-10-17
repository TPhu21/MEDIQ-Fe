import React, { useEffect, useMemo, useState } from "react";

import {
  getAllUsers,
  createUser,
  updateUserRole,
  updateUserStatus,
} from "../../api/adminApi";

import {
  Search,
  Plus,
  Eye,
  X,
  Check,
  Shield,
  Stethoscope,
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Unlock,
  UserCog,
} from "lucide-react";

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

const ROLE_CONFIG = {
  ADMIN: {
    label: "Admin",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Shield,
  },

  DOCTOR: {
    label: "Bác sĩ",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    icon: Stethoscope,
  },

  PATIENT: {
    label: "Bệnh nhân",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: User,
  },
};

const STATUS_COLOR = {
  "Hoạt động":
    "bg-emerald-100 text-emerald-800 border-emerald-200",

  "Bị khóa":
    "bg-red-100 text-red-800 border-red-200",
};

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "PATIENT",
};

// ─────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────

const mapUserFromApi = (user) => {
  return {
    id: user.id,
    name: user.fullName || "",
    email: user.email || "",
    phone: user.phone || "—",
    role: user.role || "PATIENT",

    status:
      user.status === "LOCKED"
        ? "Bị khóa"
        : "Hoạt động",

    joinDate: user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("vi-VN")
      : "—",

    avatar: user.avatarUrl || null,
  };
};

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Có lỗi xảy ra. Vui lòng thử lại."
  );
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export const AdminUsers = () => {

  // ─────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("ALL");

  const [statusFilter, setStatusFilter] = useState("ALL");

  /*
      null
      "add"
      "view"
      "role"
  */
  const [modal, setModal] = useState(null);

  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [roleForm, setRoleForm] = useState("PATIENT");

  const [toast, setToast] = useState(null);

  const [saving, setSaving] = useState(false);

  // ─────────────────────────────────────────
  // TOAST
  // ─────────────────────────────────────────

  const showToast = (msg, type = "success") => {
    setToast({
      msg,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // ─────────────────────────────────────────
  // GET ALL USERS
  // ─────────────────────────────────────────

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const data = await getAllUsers();

      const mappedUsers = Array.isArray(data)
        ? data.map(mapUserFromApi)
        : [];

      setUsers(mappedUsers);

    } catch (error) {

      console.error(
        "GET ADMIN USERS ERROR:",
        error
      );

      showToast(
        getErrorMessage(error),
        "error"
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ─────────────────────────────────────────
  // FILTER
  // ─────────────────────────────────────────

  const filtered = useMemo(() => {

    return users.filter((u) => {

      const q = search
        .trim()
        .toLowerCase();

      const matchQ =
        !q ||
        u.name
          .toLowerCase()
          .includes(q) ||
        u.email
          .toLowerCase()
          .includes(q) ||
        u.phone
          ?.toLowerCase()
          .includes(q);

      const matchRole =
        roleFilter === "ALL" ||
        u.role === roleFilter;

      const matchStatus =
        statusFilter === "ALL" ||
        u.status === statusFilter;

      return (
        matchQ &&
        matchRole &&
        matchStatus
      );
    });

  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  // ─────────────────────────────────────────
  // COUNTS
  // ─────────────────────────────────────────

  const counts = {
    ALL: users.length,

    ADMIN: users.filter(
      (u) => u.role === "ADMIN"
    ).length,

    DOCTOR: users.filter(
      (u) => u.role === "DOCTOR"
    ).length,

    PATIENT: users.filter(
      (u) => u.role === "PATIENT"
    ).length,
  };

  // ─────────────────────────────────────────
  // OPEN ADD
  // ─────────────────────────────────────────

  const openAdd = () => {

    setSelected(null);

    setForm({
      ...EMPTY_FORM,
    });

    setModal("add");
  };

  // ─────────────────────────────────────────
  // OPEN VIEW
  // ─────────────────────────────────────────

  const openView = (user) => {

    setSelected(user);

    setModal("view");
  };

  // ─────────────────────────────────────────
  // OPEN ROLE
  // ─────────────────────────────────────────

  const openRole = (user) => {

    setSelected(user);

    setRoleForm(user.role);

    setModal("role");
  };

  // ─────────────────────────────────────────
  // CLOSE MODAL
  // ─────────────────────────────────────────

  const closeModal = () => {

    if (saving) {
      return;
    }

    setModal(null);

    setSelected(null);

    setForm({
      ...EMPTY_FORM,
    });

    setRoleForm("PATIENT");
  };

  // ─────────────────────────────────────────
  // FORM CHANGE
  // ─────────────────────────────────────────

  const handleFormChange = (field, value) => {

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ─────────────────────────────────────────
  // ADD USER
  // ─────────────────────────────────────────

  const handleAdd = async () => {

    if (!form.name.trim()) {

      showToast(
        "Vui lòng nhập họ và tên.",
        "error"
      );

      return;
    }

    if (!form.email.trim()) {

      showToast(
        "Vui lòng nhập email.",
        "error"
      );

      return;
    }

    if (!form.phone.trim()) {

      showToast(
        "Vui lòng nhập số điện thoại.",
        "error"
      );

      return;
    }

    if (!form.password.trim()) {

      showToast(
        "Vui lòng nhập mật khẩu.",
        "error"
      );

      return;
    }

    if (form.password.length < 6) {

      showToast(
        "Mật khẩu phải có ít nhất 6 ký tự.",
        "error"
      );

      return;
    }

    try {

      setSaving(true);

      await createUser({

        fullName: form.name.trim(),

        email: form.email.trim(),

        phone: form.phone.trim(),

        password: form.password,

        role: form.role,
      });

      await fetchUsers();

      closeModal();

      showToast(
        `Đã thêm người dùng "${form.name}" thành công`
      );

    } catch (error) {

      console.error(
        "CREATE USER ERROR:",
        error
      );

      showToast(
        getErrorMessage(error),
        "error"
      );

    } finally {

      setSaving(false);
    }
  };

  // ─────────────────────────────────────────
  // CHANGE ROLE
  // ─────────────────────────────────────────

  const handleChangeRole = async () => {

    if (!selected) {
      return;
    }

    if (selected.role === roleForm) {

      closeModal();

      return;
    }

    try {

      setSaving(true);

      await updateUserRole(
        selected.id,
        roleForm
      );

      await fetchUsers();

      const roleLabel =
        ROLE_CONFIG[roleForm]?.label ||
        roleForm;

      closeModal();

      showToast(
        `Đã đổi vai trò "${selected.name}" thành ${roleLabel}`
      );

    } catch (error) {

      console.error(
        "UPDATE USER ROLE ERROR:",
        error
      );

      showToast(
        getErrorMessage(error),
        "error"
      );

    } finally {

      setSaving(false);
    }
  };

  // ─────────────────────────────────────────
  // LOCK / UNLOCK
  // ─────────────────────────────────────────

  const handleToggleStatus = async (user) => {

    try {

      setSaving(true);

      const newStatus =
        user.status === "Bị khóa"
          ? "ACTIVE"
          : "LOCKED";

      await updateUserStatus(
        user.id,
        newStatus
      );

      await fetchUsers();

      showToast(
        newStatus === "LOCKED"
          ? `Đã khóa tài khoản "${user.name}"`
          : `Đã mở khóa tài khoản "${user.name}"`
      );

    } catch (error) {

      console.error(
        "TOGGLE USER STATUS ERROR:",
        error
      );

      showToast(
        getErrorMessage(error),
        "error"
      );

    } finally {

      setSaving(false);
    }
  };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────

  return (

    <div className="space-y-5">

      {/* TOAST */}

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

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold text-slate-900">
            Quản Lý Người Dùng
          </h1>

          <p className="text-sm text-slate-500 mt-0.5">

            Tổng cộng{" "}

            <span className="font-bold text-slate-700">
              {users.length}
            </span>{" "}

            tài khoản trong hệ thống

          </p>

        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >

          <Plus className="w-4 h-4" />

          Thêm User

        </button>

      </div>

      {/* ROLE FILTER */}

      <div className="flex gap-2 flex-wrap">

        {[
          ["ALL", "Tất cả"],
          ["ADMIN", "Admin"],
          ["DOCTOR", "Bác sĩ"],
          ["PATIENT", "Bệnh nhân"],
        ].map(([val, lbl]) => (

          <button
            key={val}
            onClick={() =>
              setRoleFilter(val)
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${roleFilter === val
                ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
          >

            {lbl}

            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${roleFilter === val
                  ? "bg-white/20"
                  : "bg-slate-100"
                }`}
            >
              {counts[val]}
            </span>

          </button>
        ))}

      </div>

      {/* SEARCH + STATUS FILTER */}

      <div className="flex gap-3 flex-wrap">

        <div className="relative flex-1 min-w-[200px]">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Tìm theo tên, email, SĐT..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />

        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-cyan-400"
        >

          <option value="ALL">
            Tất cả trạng thái
          </option>

          <option value="Hoạt động">
            Hoạt động
          </option>

          <option value="Bị khóa">
            Bị khóa
          </option>

        </select>

      </div>

      {/* TABLE */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-slate-50 border-b border-slate-200">

              <tr>

                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Người Dùng
                </th>

                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Liên Hệ
                </th>

                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Vai Trò
                </th>

                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Trạng Thái
                </th>

                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Tham Gia
                </th>

                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wide text-center">
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
                    Đang tải danh sách người dùng...
                  </td>

                </tr>

              ) : filtered.length === 0 ? (

                <tr>

                  <td
                    colSpan={6}
                    className="text-center py-12 text-slate-400 text-sm"
                  >
                    Không tìm thấy kết quả nào
                  </td>

                </tr>

              ) : (

                filtered.map((u) => {

                  const rc =
                    ROLE_CONFIG[u.role];

                  const RoleIcon =
                    rc?.icon || User;

                  return (

                    <tr
                      key={u.id}
                      className="hover:bg-slate-50 transition-colors"
                    >

                      {/* USER */}

                      <td className="p-4">

                        <div className="flex items-center gap-3">

                          {u.avatar ? (

                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />

                          ) : (

                            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">

                              {u.name
                                ?.split(" ")
                                .pop()
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "U"}

                            </div>
                          )}

                          <div>

                            <p className="font-bold text-slate-900 text-sm">
                              {u.name}
                            </p>

                            <p className="text-xs text-slate-400 font-mono">
                              #{u.id}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* CONTACT */}

                      <td className="p-4">

                        <p className="text-xs text-slate-600 flex items-center gap-1">

                          <Mail className="w-3 h-3 text-slate-400" />

                          {u.email}

                        </p>

                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">

                          <Phone className="w-3 h-3" />

                          {u.phone}

                        </p>

                      </td>

                      {/* ROLE */}

                      <td className="p-4">

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${rc?.color ||
                            "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                        >

                          <RoleIcon className="w-3 h-3" />

                          {rc?.label || u.role}

                        </span>

                      </td>

                      {/* STATUS */}

                      <td className="p-4">

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLOR[u.status] ||
                            STATUS_COLOR["Hoạt động"]
                            }`}
                        >
                          {u.status}
                        </span>

                      </td>

                      {/* JOIN DATE */}

                      <td className="p-4 text-xs text-slate-500">

                        <div className="flex items-center gap-1">

                          <Calendar className="w-3 h-3" />

                          {u.joinDate}

                        </div>

                      </td>

                      {/* ACTIONS */}

                      <td className="p-4">

                        <div className="flex items-center justify-center gap-2">

                          {/* VIEW */}

                          <button
                            onClick={() =>
                              openView(u)
                            }
                            className="p-1.5 rounded-lg hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 transition-colors"
                            title="Xem thông tin"
                          >

                            <Eye className="w-3.5 h-3.5" />

                          </button>

                          {/* CHANGE ROLE */}

                          <button
                            onClick={() =>
                              openRole(u)
                            }
                            disabled={saving}
                            className="p-1.5 rounded-lg hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition-colors disabled:opacity-50"
                            title="Đổi vai trò"
                          >

                            <UserCog className="w-3.5 h-3.5" />

                          </button>

                          {/* LOCK / UNLOCK */}

                          <button
                            onClick={() =>
                              handleToggleStatus(u)
                            }
                            disabled={saving}
                            className={`p-1.5 rounded-lg transition-colors ${u.status === "Bị khóa"
                                ? "hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
                                : "hover:bg-red-50 text-slate-400 hover:text-red-600"
                              }`}
                            title={
                              u.status === "Bị khóa"
                                ? "Mở khóa"
                                : "Khóa tài khoản"
                            }
                          >

                            {u.status === "Bị khóa" ? (
                              <Unlock className="w-3.5 h-3.5" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}

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

        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium">

          Hiển thị {filtered.length} /{" "}
          {users.length} người dùng

        </div>

      </div>

      {/* MODAL */}

      {modal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">

              <h2 className="text-base font-bold text-slate-900">

                {modal === "add" &&
                  "Thêm Người Dùng Mới"}

                {modal === "view" &&
                  `Thông Tin: ${selected?.name}`}

                {modal === "role" &&
                  `Đổi Vai Trò: ${selected?.name}`}

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

              {/* ─────────────────────────
                                VIEW USER
                            ───────────────────────── */}

              {modal === "view" && selected && (

                <div className="space-y-4">

                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100">

                    {selected.avatar ? (

                      <img
                        src={selected.avatar}
                        alt={selected.name}
                        className="w-16 h-16 rounded-full object-cover border border-slate-200"
                      />

                    ) : (

                      <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-600">

                        {selected.name
                          ?.split(" ")
                          .pop()
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "U"}

                      </div>
                    )}

                    <div>

                      <p className="text-lg font-bold text-slate-900">
                        {selected.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        ID: #{selected.id}
                      </p>

                    </div>

                  </div>

                  <div className="space-y-3">

                    <div className="flex items-center gap-3">

                      <Mail className="w-4 h-4 text-slate-400" />

                      <div>
                        <p className="text-xs text-slate-400">
                          Email
                        </p>
                        <p className="text-sm font-medium text-slate-800">
                          {selected.email || "—"}
                        </p>
                      </div>

                    </div>

                    <div className="flex items-center gap-3">

                      <Phone className="w-4 h-4 text-slate-400" />

                      <div>
                        <p className="text-xs text-slate-400">
                          Số điện thoại
                        </p>
                        <p className="text-sm font-medium text-slate-800">
                          {selected.phone || "—"}
                        </p>
                      </div>

                    </div>

                    <div className="flex items-center gap-3">

                      <UserCog className="w-4 h-4 text-slate-400" />

                      <div>
                        <p className="text-xs text-slate-400">
                          Vai trò
                        </p>

                        <span
                          className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full text-xs font-bold border ${ROLE_CONFIG[selected.role]?.color ||
                            "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                        >
                          {ROLE_CONFIG[selected.role]?.label ||
                            selected.role}
                        </span>
                      </div>

                    </div>

                    <div className="flex items-center gap-3">

                      {selected.status === "Bị khóa" ? (
                        <Lock className="w-4 h-4 text-red-500" />
                      ) : (
                        <Unlock className="w-4 h-4 text-emerald-500" />
                      )}

                      <div>

                        <p className="text-xs text-slate-400">
                          Trạng thái
                        </p>

                        <span
                          className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLOR[selected.status]
                            }`}
                        >
                          {selected.status}
                        </span>

                      </div>

                    </div>

                    <div className="flex items-center gap-3">

                      <Calendar className="w-4 h-4 text-slate-400" />

                      <div>

                        <p className="text-xs text-slate-400">
                          Ngày tham gia
                        </p>

                        <p className="text-sm font-medium text-slate-800">
                          {selected.joinDate}
                        </p>

                      </div>

                    </div>

                  </div>

                  <button
                    onClick={closeModal}
                    className="w-full mt-4 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors"
                  >
                    Đóng
                  </button>

                </div>
              )}

              {/* ─────────────────────────
                                CHANGE ROLE
                            ───────────────────────── */}

              {modal === "role" && selected && (

                <div className="space-y-5">

                  <div className="text-center">

                    <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">

                      <UserCog className="w-6 h-6 text-purple-600" />

                    </div>

                    <p className="text-sm text-slate-600">

                      Chọn vai trò mới cho{" "}

                      <span className="font-bold text-slate-900">
                        {selected.name}
                      </span>

                    </p>

                  </div>

                  <div>

                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      Vai trò
                    </label>

                    <select
                      value={roleForm}
                      onChange={(e) =>
                        setRoleForm(
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    >

                      <option value="PATIENT">
                        Bệnh nhân
                      </option>

                      <option value="DOCTOR">
                        Bác sĩ
                      </option>

                      <option value="ADMIN">
                        Admin
                      </option>

                    </select>

                  </div>

                  <div className="flex gap-3">

                    <button
                      onClick={closeModal}
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      Hủy
                    </button>

                    <button
                      onClick={handleChangeRole}
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                      {saving
                        ? "Đang cập nhật..."
                        : "Đổi vai trò"}
                    </button>

                  </div>

                </div>
              )}

              {/* ─────────────────────────
                                ADD USER
                            ───────────────────────── */}

              {modal === "add" && (

                <div className="space-y-4">

                  {/* NAME */}

                  <div>

                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      Họ và tên{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      value={form.name}
                      onChange={(e) =>
                        handleFormChange(
                          "name",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                      placeholder="Nguyễn Văn A"
                    />

                  </div>

                  {/* EMAIL */}

                  <div>

                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      Email{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      value={form.email}
                      onChange={(e) =>
                        handleFormChange(
                          "email",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                      placeholder="example@mediq.ai"
                      type="email"
                    />

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
                      value={form.phone}
                      onChange={(e) =>
                        handleFormChange(
                          "phone",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                      placeholder="09xx xxx xxx"
                    />

                  </div>

                  {/* PASSWORD */}

                  <div>

                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      Mật khẩu{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      value={form.password}
                      onChange={(e) =>
                        handleFormChange(
                          "password",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                      placeholder="Ít nhất 6 ký tự"
                      type="password"
                    />

                  </div>

                  {/* ROLE */}

                  <div>

                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      Vai trò
                    </label>

                    <select
                      value={form.role}
                      onChange={(e) =>
                        handleFormChange(
                          "role",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400"
                    >

                      <option value="PATIENT">
                        Bệnh nhân
                      </option>

                      <option value="DOCTOR">
                        Bác sĩ
                      </option>

                      <option value="ADMIN">
                        Admin
                      </option>

                    </select>

                  </div>

                  {/* BUTTONS */}

                  <div className="flex gap-3 mt-2">

                    <button
                      onClick={closeModal}
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      Hủy
                    </button>

                    <button
                      onClick={handleAdd}
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-300 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                      {saving
                        ? "Đang thêm..."
                        : "Thêm User"}
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