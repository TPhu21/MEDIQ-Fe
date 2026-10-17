import React, { useEffect, useState } from "react";

import { useAuth } from "../../auth/AuthContext";

import {
  Mail,
  Phone,
  Edit3,
  Save,
  X,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Camera,
  Stethoscope,
  UserRound,
  Shield,
} from "lucide-react";

const DoctorProfile = () => {
  const {
    user,
    updateProfile,
    changePassword,
    refreshUser,
  } = useAuth();

  // ==============================
  // STATE
  // ==============================

  const [isLoading, setIsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [initialData, setInitialData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [selectedAvatar, setSelectedAvatar] = useState(null);

  const [avatarPreview, setAvatarPreview] = useState("");

  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const [alertMessage, setAlertMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [modalError, setModalError] = useState("");

  // ==============================
  // LOAD DOCTOR PROFILE
  // ==============================

  useEffect(() => {
    const loadDoctorProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const data = {
          fullName: user?.fullName || "",
          email: user?.email || "",
          phone: user?.phone || "",
        };

        setFormData(data);
        setInitialData(data);

        setAvatarPreview(
          user?.avatarUrl || ""
        );
      } catch (error) {
        console.error(
          "Load doctor profile error:",
          error
        );

        setAlertMessage(
          error.response?.data?.message ||
          error.response?.data ||
          "Không thể tải thông tin hồ sơ bác sĩ."
        );

        setShowSuccessAlert(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctorProfile();
  }, [user]);

  // ==============================
  // FORM CHANGE
  // ==============================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==============================
  // START EDIT
  // ==============================

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // ==============================
  // CANCEL EDIT
  // ==============================

  const handleCancelEdit = () => {
    setFormData(initialData);

    setSelectedAvatar(null);

    setAvatarPreview(
      user?.avatarUrl || ""
    );

    setIsEditing(false);
  };

  // ==============================
  // AVATAR
  // ==============================

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedAvatar(file);

    const previewUrl =
      URL.createObjectURL(file);

    setAvatarPreview(previewUrl);
  };

  // ==============================
  // UPDATE PROFILE
  // ==============================

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      let updatedUser = user;

      // ==================================
      // UPDATE AUTH PROFILE
      // ==================================

      updatedUser = await updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        avatar: selectedAvatar,
      });

      // ==================================
      // UPDATE LOCAL DATA
      // ==================================

      const updatedData = {
        fullName:
          updatedUser?.fullName ||
          formData.fullName,

        email:
          updatedUser?.email ||
          formData.email,

        phone:
          updatedUser?.phone ||
          formData.phone,
      };

      setFormData(updatedData);

      setInitialData(updatedData);

      if (updatedUser?.avatarUrl) {
        setAvatarPreview(
          updatedUser.avatarUrl
        );
      }

      setSelectedAvatar(null);

      setIsEditing(false);

      setAlertMessage(
        "Cập nhật thông tin thành công!"
      );

      setShowSuccessAlert(true);

      // ==================================
      // REFRESH AUTH CONTEXT
      // ==================================

      await refreshUser();

      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 4000);
    } catch (err) {
      console.error(
        "Update doctor profile error:",
        err
      );

      setAlertMessage(
        err.response?.data?.message ||
        err.response?.data ||
        "Cập nhật thông tin thất bại."
      );

      setShowSuccessAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================
  // OPEN CHANGE PASSWORD
  // ==============================

  const handleOpenPasswordModal = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setModalError("");

    setShowPasswordModal(true);
  };

  // ==============================
  // CLOSE CHANGE PASSWORD
  // ==============================

  const handleClosePasswordModal = () => {
    if (isSubmitting) {
      return;
    }

    setShowPasswordModal(false);

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setModalError("");
  };

  // ==============================
  // CHANGE PASSWORD
  // ==============================

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();

    setModalError("");

    if (!passwordData.currentPassword) {
      setModalError(
        "Vui lòng nhập mật khẩu hiện tại."
      );
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setModalError(
        "Mật khẩu mới phải có ít nhất 6 ký tự."
      );
      return;
    }

    if (
      passwordData.newPassword !==
      passwordData.confirmPassword
    ) {
      setModalError(
        "Mật khẩu xác nhận không khớp."
      );
      return;
    }

    if (
      passwordData.currentPassword ===
      passwordData.newPassword
    ) {
      setModalError(
        "Mật khẩu mới phải khác mật khẩu hiện tại."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await changePassword({
        currentPassword:
          passwordData.currentPassword,

        newPassword:
          passwordData.newPassword,
      });

      setShowPasswordModal(false);

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setAlertMessage(
        "Đổi mật khẩu thành công!"
      );

      setShowSuccessAlert(true);

      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 4000);
    } catch (err) {
      console.error(
        "Change password error:",
        err
      );

      setModalError(
        err.response?.data?.message ||
        err.response?.data ||
        "Mật khẩu hiện tại không đúng hoặc không thể đổi mật khẩu."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================
  // LOADING
  // ==============================

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-10 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin" />

          <p className="mt-4 text-sm text-slate-500 font-medium">
            Đang tải thông tin hồ sơ...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ==============================
                ALERT
            ============================== */}

      {showSuccessAlert && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-sm ${alertMessage.includes("thất bại") ||
              alertMessage.includes("Không thể")
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2
              className={`w-5 h-5 shrink-0 ${alertMessage.includes("thất bại") ||
                  alertMessage.includes("Không thể")
                  ? "text-red-600"
                  : "text-emerald-600"
                }`}
            />

            <span className="font-semibold">
              {alertMessage}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowSuccessAlert(false)
            }
            className="p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==============================
                PROFILE
            ============================== */}

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">

        <form onSubmit={handleProfileSubmit}>

          {/* HEADER */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">

            <div className="flex items-center gap-4">

              {/* AVATAR */}

              <div className="relative">

                <img
                  src={
                    avatarPreview ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
                  }
                  alt={
                    formData.fullName ||
                    "Bác sĩ"
                  }
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-cyan-500/30 border border-slate-200"
                />

                {isEditing && (
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md">

                    <Camera className="w-3.5 h-3.5" />

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleAvatarChange
                      }
                      className="hidden"
                    />

                  </label>
                )}

              </div>

              {/* NAME */}

              <div>

                {isEditing ? (
                  <div>

                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Họ và tên
                    </label>

                    <input
                      type="text"
                      name="fullName"
                      required
                      value={
                        formData.fullName
                      }
                      onChange={
                        handleChange
                      }
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-lg focus:outline-none focus:border-cyan-500"
                    />

                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-slate-900">
                      {formData.fullName ||
                        "Chưa cập nhật"}
                    </h1>

                    <p className="text-xs text-cyan-700 font-mono font-bold mt-0.5">
                      Mã bác sĩ:{" "}
                      {user?.id
                        ? `DOC-${String(
                          user.id
                        ).padStart(
                          5,
                          "0"
                        )}`
                        : "Chưa cập nhật"}
                    </p>
                  </>
                )}

              </div>

            </div>

            {/* ACTION BUTTON */}

            <div className="flex items-center gap-2">

              {!isEditing ? (
                <button
                  type="button"
                  onClick={
                    handleStartEdit
                  }
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
                >
                  <Edit3 className="w-4 h-4" />

                  <span>
                    Chỉnh sửa
                  </span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={
                      handleCancelEdit
                    }
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />

                    <span>
                      Hủy
                    </span>
                  </button>

                  <button
                    type="submit"
                    disabled={
                      isSubmitting
                    }
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />

                        <span>
                          Cập nhật
                        </span>
                      </>
                    )}
                  </button>
                </>
              )}

            </div>

          </div>

          {/* ==============================
                        BASIC INFORMATION
                    ============================== */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">

            {/* EMAIL */}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">

              <span className="text-xs text-slate-500 block font-medium mb-1">

                <Mail className="w-3.5 h-3.5 inline mr-1.5" />

                Email tài khoản

              </span>

              <span className="text-slate-800 font-semibold break-all">
                {formData.email ||
                  "Chưa cập nhật"}
              </span>

              <p className="text-[11px] text-slate-400 mt-1">
                Email không thể thay đổi.
              </p>

            </div>

            {/* PHONE */}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">

              <span className="text-xs text-slate-500 block font-medium mb-1">

                <Phone className="w-3.5 h-3.5 inline mr-1.5" />

                Số điện thoại

              </span>

              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  required
                  value={
                    formData.phone
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-sm focus:outline-none focus:border-cyan-500"
                />
              ) : (
                <span className="text-slate-800 font-semibold">
                  {formData.phone ||
                    "Chưa cập nhật"}
                </span>
              )}

            </div>

            {/* ROLE */}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">

              <span className="text-xs text-slate-500 block font-medium mb-1">

                <Stethoscope className="w-3.5 h-3.5 inline mr-1.5" />

                Vai trò

              </span>

              <span className="text-slate-800 font-semibold">
                {user?.role ||
                  "DOCTOR"}
              </span>

              <p className="text-[11px] text-slate-400 mt-1">
                Vai trò được quản lý bởi hệ thống.
              </p>

            </div>

            {/* STATUS */}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">

              <span className="text-xs text-slate-500 block font-medium mb-1">

                <Shield className="w-3.5 h-3.5 inline mr-1.5" />

                Trạng thái tài khoản

              </span>

              <div className="flex items-center gap-2">

                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${user?.status ===
                      "ACTIVE"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                    }`}
                >
                  {user?.status ||
                    "ACTIVE"}
                </span>

              </div>

            </div>

          </div>

        </form>

      </div>

      {/* ==============================
                SECURITY
            ============================== */}

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div className="flex items-start gap-3.5">

            <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600 border border-cyan-100">

              <ShieldCheck className="w-6 h-6" />

            </div>

            <div>

              <h3 className="text-base font-bold text-slate-900">
                Mật khẩu & Bảo mật
              </h3>

              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Đổi mật khẩu định kỳ giúp tăng cường bảo mật cho tài khoản.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={
              handleOpenPasswordModal
            }
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2"
          >

            <Lock className="w-4 h-4 text-cyan-600" />

            <span>
              Đổi mật khẩu
            </span>

          </button>

        </div>

      </div>

      {/* ==============================
                CHANGE PASSWORD MODAL
            ============================== */}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-5">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">

              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">

                <ShieldCheck className="w-5 h-5 text-cyan-600" />

                Đổi mật khẩu

              </h3>

              <button
                type="button"
                onClick={
                  handleClosePasswordModal
                }
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            {/* ERROR */}

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                {modalError}
              </div>
            )}

            <form
              onSubmit={
                handleChangePasswordSubmit
              }
              className="space-y-4"
            >

              {/* CURRENT PASSWORD */}

              <div>

                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Mật khẩu hiện tại
                </label>

                <input
                  type="password"
                  required
                  value={
                    passwordData.currentPassword
                  }
                  onChange={(e) =>
                    setPasswordData(
                      (prev) => ({
                        ...prev,
                        currentPassword:
                          e.target
                            .value,
                      })
                    )
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-cyan-500"
                />

              </div>

              {/* NEW PASSWORD */}

              <div>

                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Mật khẩu mới
                </label>

                <input
                  type="password"
                  required
                  value={
                    passwordData.newPassword
                  }
                  onChange={(e) =>
                    setPasswordData(
                      (prev) => ({
                        ...prev,
                        newPassword:
                          e.target
                            .value,
                      })
                    )
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-cyan-500"
                />

              </div>

              {/* CONFIRM PASSWORD */}

              <div>

                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Xác nhận mật khẩu mới
                </label>

                <input
                  type="password"
                  required
                  value={
                    passwordData.confirmPassword
                  }
                  onChange={(e) =>
                    setPasswordData(
                      (prev) => ({
                        ...prev,
                        confirmPassword:
                          e.target
                            .value,
                      })
                    )
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-cyan-500"
                />

              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >

                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Xác nhận đổi mật khẩu"
                )}

              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default DoctorProfile;