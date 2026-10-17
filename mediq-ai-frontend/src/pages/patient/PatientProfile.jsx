import React, { useState, useEffect } from "react";

import { useAuth } from "../../auth/AuthContext";

import {
  getMyPatient,
  updateMyPatient,
} from "../../api/patientApi";

import {
  replacePatientAvatar,
  updateMyAvatar,
} from "../../api/mediaApi";

import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Camera,
  UserRound,
} from "lucide-react";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150";

const PatientProfile = () => {

  const {
    user,
    changePassword,
    refreshUser,
  } = useAuth();

  const [patient, setPatient] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    address: "",
  });

  const [initialData, setInitialData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    address: "",
  });

  // ==============================
  // AVATAR
  // ==============================

  const [selectedAvatar, setSelectedAvatar] = useState(null);

  const [avatarPreview, setAvatarPreview] = useState("");

  const [isUploadingAvatar, setIsUploadingAvatar] =
    useState(false);

  const [showSuccessAlert, setShowSuccessAlert] =
    useState(false);

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
  // LOAD PATIENT PROFILE
  // ==============================

  useEffect(() => {

    const loadPatientProfile = async () => {

      if (!user) {
        setIsLoading(false);
        return;
      }

      try {

        setIsLoading(true);

        const patientData = await getMyPatient();

        console.log(
          "PATIENT PROFILE:",
          patientData
        );

        setPatient(patientData);

        const data = {
          fullName:
            patientData?.fullName ||
            user?.fullName ||
            "",

          email:
            user?.email ||
            "",

          phone:
            patientData?.phone ||
            user?.phone ||
            "",

          gender:
            patientData?.gender ||
            "",

          dob:
            patientData?.dateOfBirth ||
            "",

          address:
            patientData?.address ||
            "",
        };

        setFormData(data);

        setInitialData(data);

        // Ưu tiên avatar của Patient
        setAvatarPreview(
          patientData?.avatarUrl ||
          user?.avatarUrl ||
          ""
        );

      } catch (error) {

        console.error(
          "Load patient profile error:",
          error
        );

        setAlertMessage(
          error.response?.data?.message ||
          error.response?.data ||
          "Không thể tải thông tin hồ sơ bệnh nhân."
        );

        setShowSuccessAlert(true);

      } finally {

        setIsLoading(false);
      }
    };

    loadPatientProfile();

  }, [user]);

  // ==============================
  // FORM CHANGE
  // ==============================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

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
      patient?.avatarUrl ||
      user?.avatarUrl ||
      ""
    );

    setIsEditing(false);
  };

  // ==============================
  // AVATAR CHANGE
  // ==============================

  const handleAvatarChange = (e) => {

    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // ==============================
    // VALIDATE FILE TYPE
    // ==============================

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {

      setAlertMessage(
        "Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP."
      );

      setShowSuccessAlert(true);

      return;
    }

    // ==============================
    // VALIDATE FILE SIZE
    // ==============================

    if (file.size > 10 * 1024 * 1024) {

      setAlertMessage(
        "Kích thước ảnh không được vượt quá 10MB."
      );

      setShowSuccessAlert(true);

      return;
    }

    // ==============================
    // CREATE PREVIEW
    // ==============================

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

      // =================================================
      // 1. UPDATE PATIENT INFORMATION
      // =================================================

      const updatedPatient =
        await updateMyPatient({
          fullName:
            formData.fullName,

          phone:
            formData.phone,

          gender:
            formData.gender,

          dateOfBirth:
            formData.dob || null,

          address:
            formData.address,
        });

      console.log(
        "UPDATED PATIENT:",
        updatedPatient
      );

      setPatient((prev) => ({
        ...prev,
        ...updatedPatient,
      }));

      // =================================================
      // 2. UPLOAD AVATAR
      // Media Service -> Cloudinary
      // =================================================

      let finalPatient =
        updatedPatient;

      if (selectedAvatar) {

        if (!updatedPatient?.id) {

          throw new Error(
            "Không xác định được ID bệnh nhân."
          );
        }

        setIsUploadingAvatar(true);

        try {

          // -----------------------------------------
          // Upload ảnh lên Media Service
          // -----------------------------------------

          const mediaResponse =
            await replacePatientAvatar(
              selectedAvatar,
              updatedPatient.id
            );

          console.log(
            "MEDIA RESPONSE:",
            mediaResponse
          );

          const avatarUrl =
            mediaResponse?.url;

          if (!avatarUrl) {

            throw new Error(
              "Media Service không trả về URL ảnh."
            );
          }

          // -----------------------------------------
          // Lưu avatarUrl vào Patient Service
          // -----------------------------------------

          finalPatient =
            await updateMyAvatar(
              avatarUrl
            );

          console.log(
            "UPDATED PATIENT AVATAR:",
            finalPatient
          );

          // -----------------------------------------
          // Cập nhật Patient local
          // -----------------------------------------

          setPatient(finalPatient);

          setAvatarPreview(
            finalPatient?.avatarUrl ||
            avatarUrl
          );

        } finally {

          setIsUploadingAvatar(false);
        }
      }

      // =================================================
      // 3. UPDATE LOCAL FORM DATA
      // =================================================

      const updatedData = {

        fullName:
          finalPatient?.fullName ||
          formData.fullName,

        email:
          user?.email ||
          formData.email,

        phone:
          finalPatient?.phone ||
          formData.phone,

        gender:
          finalPatient?.gender ||
          formData.gender,

        dob:
          finalPatient?.dateOfBirth ||
          formData.dob,

        address:
          finalPatient?.address ||
          formData.address,
      };

      setFormData(updatedData);

      setInitialData(updatedData);

      // =================================================
      // 4. RESET AVATAR FILE
      // =================================================

      setSelectedAvatar(null);

      setIsEditing(false);

      // =================================================
      // 5. SUCCESS
      // =================================================

      setAlertMessage(
        "Cập nhật thông tin thành công!"
      );

      setShowSuccessAlert(true);

      // Đồng bộ AuthContext
      await refreshUser();

      setTimeout(() => {

        setShowSuccessAlert(false);

      }, 4000);

    } catch (err) {

      console.error(
        "Update patient profile error:",
        err
      );

      setAlertMessage(
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "Cập nhật thông tin thất bại."
      );

      setShowSuccessAlert(true);

    } finally {

      setIsUploadingAvatar(false);

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

      {/* =================================================
                ALERT
            ================================================= */}

      {showSuccessAlert && (

        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-sm ${alertMessage.includes("thất bại") ||
              alertMessage.includes("Không thể") ||
              alertMessage.includes("không")
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
        >

          <div className="flex items-center gap-3">

            <CheckCircle2
              className={`w-5 h-5 shrink-0 ${alertMessage.includes("thất bại") ||
                  alertMessage.includes("Không thể") ||
                  alertMessage.includes("không")
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

      {/* =================================================
                PROFILE
            ================================================= */}

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">

        <form onSubmit={handleProfileSubmit}>

          {/* =================================================
                        HEADER
                    ================================================= */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">

            <div className="flex items-center gap-4">

              {/* =================================================
                                AVATAR
                            ================================================= */}

              <div className="relative">

                <img
                  src={
                    avatarPreview ||
                    DEFAULT_AVATAR
                  }
                  alt={
                    formData.fullName ||
                    "Patient"
                  }
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-cyan-500/30 border border-slate-200"
                />

                {isEditing && (

                  <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md">

                    <Camera className="w-3.5 h-3.5" />

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handleAvatarChange
                      }
                      className="hidden"
                      disabled={
                        isSubmitting ||
                        isUploadingAvatar
                      }
                    />

                  </label>
                )}

              </div>

              {/* =================================================
                                NAME
                            ================================================= */}

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

                      Mã Bệnh Nhân:{" "}

                      {patient?.patientCode ||
                        (
                          patient?.id
                            ? `PAT-${String(
                              patient.id
                            ).padStart(
                              5,
                              "0"
                            )}`
                            : "Chưa cập nhật"
                        )}

                    </p>

                  </>
                )}

              </div>

            </div>

            {/* =================================================
                            ACTION BUTTON
                        ================================================= */}

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
                    disabled={
                      isSubmitting ||
                      isUploadingAvatar
                    }
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50"
                  >

                    <X className="w-4 h-4" />

                    <span>
                      Hủy
                    </span>

                  </button>

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      isUploadingAvatar
                    }
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-50"
                  >

                    {isSubmitting ||
                      isUploadingAvatar ? (

                      <>

                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />

                        <span>
                          Đang cập nhật...
                        </span>

                      </>

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

          {/* =================================================
                        BASIC INFORMATION
                    ================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">

            {/* EMAIL */}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">

              <span className="text-xs text-slate-500 block font-medium mb-1">

                <Mail className="w-3.5 h-3.5 inline mr-1.5" />

                Email tài khoản

              </span>

              <span className="text-slate-800 font-semibold">

                {formData.email ||
                  user?.email ||
                  "Chưa cập nhật"}

              </span>

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

            {/* GENDER */}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">

              <span className="text-xs text-slate-500 block font-medium mb-1">

                <UserRound className="w-3.5 h-3.5 inline mr-1.5" />

                Giới tính

              </span>

              {isEditing ? (

                <select
                  name="gender"
                  value={
                    formData.gender
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-sm focus:outline-none focus:border-cyan-500"
                >

                  <option value="">
                    Chọn giới tính
                  </option>

                  <option value="Nam">
                    Nam
                  </option>

                  <option value="Nữ">
                    Nữ
                  </option>

                  <option value="Khác">
                    Khác
                  </option>

                </select>

              ) : (

                <span className="text-slate-800 font-semibold">

                  {formData.gender ||
                    "Chưa cập nhật"}

                </span>
              )}

            </div>

            {/* DOB */}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">

              <span className="text-xs text-slate-500 block font-medium mb-1">

                <Calendar className="w-3.5 h-3.5 inline mr-1.5" />

                Ngày sinh

              </span>

              {isEditing ? (

                <input
                  type="date"
                  name="dob"
                  value={
                    formData.dob
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-sm focus:outline-none focus:border-cyan-500"
                />

              ) : (

                <span className="text-slate-800 font-semibold">

                  {formData.dob ||
                    "Chưa cập nhật"}

                </span>
              )}

            </div>

            {/* ADDRESS */}

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">

              <span className="text-xs text-slate-500 block font-medium mb-1">

                <MapPin className="w-3.5 h-3.5 inline mr-1.5" />

                Địa chỉ cư trú

              </span>

              {isEditing ? (

                <input
                  type="text"
                  name="address"
                  value={
                    formData.address
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Nhập địa chỉ cư trú"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-sm focus:outline-none focus:border-cyan-500"
                />

              ) : (

                <span className="text-slate-800 font-semibold">

                  {formData.address ||
                    "Chưa cập nhật"}

                </span>
              )}

            </div>

          </div>

        </form>

      </div>

      {/* =================================================
                SECURITY
            ================================================= */}

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

      {/* =================================================
                CHANGE PASSWORD MODAL
            ================================================= */}

      {showPasswordModal && (

        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-5">

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
                          e.target.value,
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
                          e.target.value,
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
                          e.target.value,
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

export default PatientProfile;