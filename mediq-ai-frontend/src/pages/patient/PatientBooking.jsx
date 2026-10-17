import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  LoaderCircle,
  Building2,
  MapPin,
  Phone,
  UserCheck,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const getToken = () =>
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token") ||
  "";

const getClinicId = (clinic) =>
  clinic?.clinicId || clinic?.id;

const getClinicName = (clinic) =>
  clinic?.name || clinic?.clinicName || "Phòng khám";

const getSpecialtyId = (specialty) =>
  specialty?.specialtyId || specialty?.id;

const getDoctorId = (doctor) =>
  doctor?.doctorId || doctor?.id;

const getSlotId = (slot) =>
  slot?.slotId || slot?.id;

const getDoctorName = (doctor) =>
  doctor?.fullName || doctor?.name || "Bác sĩ";

const getDoctorSpecialties = (doctor) =>
  Array.isArray(doctor?.specialties) ? doctor.specialties : [];

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .toLowerCase();

const formatDate = (date) => {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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

export const PatientBooking = () => {
  const location = useLocation();
  const aiRecommendation = location.state || {};

  const today = useMemo(() => getLocalDateString(), []);
  const requestedDate = aiRecommendation.appointmentDate;

  const initialAppointmentDate =
    typeof requestedDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) &&
      requestedDate >= today
      ? requestedDate
      : today;

  // Danh sách dữ liệu từ Backend
  const [clinics, setClinics] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);

  // Lựa chọn theo từng bước của bệnh nhân
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState(initialAppointmentDate);
  const [selectedSlotId, setSelectedSlotId] = useState("");

  const [reason, setReason] = useState(
    typeof aiRecommendation.reason === "string"
      ? aiRecommendation.reason.slice(0, 1000)
      : Array.isArray(aiRecommendation.symptoms)
        ? aiRecommendation.symptoms.join(", ").slice(0, 1000)
        : ""
  );

  const [loadingClinics, setLoadingClinics] = useState(true);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [booked, setBooked] = useState(null);

  // 1. Tải danh sách Cơ sở phòng khám (Clinics)
  useEffect(() => {
    let cancelled = false;

    const loadClinics = async () => {
      try {
        const data = await apiRequest("/clinics?status=ACTIVE");
        if (cancelled) return;

        const list = Array.isArray(data) ? data : [];
        setClinics(list);

        if (list.length > 0) {
          setSelectedClinicId(String(getClinicId(list[0]) || ""));
        }
      } catch (err) {
        if (!cancelled) {
          setError(`Không thể tải cơ sở phòng khám: ${err.message}`);
        }
      } finally {
        if (!cancelled) setLoadingClinics(false);
      }
    };

    loadClinics();
    return () => { cancelled = true; };
  }, []);

  // 2. Tải chuyên khoa thật từ backend và ưu tiên chuyên khoa AI đề xuất
  useEffect(() => {
    let cancelled = false;

    const loadSpecialties = async () => {
      try {
        const data = await apiRequest("/specialties?status=ACTIVE");
        if (cancelled) return;

        const list = Array.isArray(data) ? data : [];
        setSpecialties(list);

        if (list.length > 0) {
          const requestedName = normalizeText(aiRecommendation.specialtyName);
          const matched = requestedName
            ? list.find((item) => normalizeText(item.name) === requestedName)
            : null;

          const initialSpecialty = matched || list[0];
          setSelectedSpecialtyId(String(getSpecialtyId(initialSpecialty) || ""));

          if (requestedName && !matched) {
            setError(
              `AI đề xuất chuyên khoa "${aiRecommendation.specialtyName}", nhưng không tìm thấy chuyên khoa tương ứng đang hoạt động. Bạn có thể chọn chuyên khoa khác.`
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError((prev) => prev ? `${prev}\n${err.message}` : err.message);
        }
      } finally {
        if (!cancelled) setLoadingSpecialties(false);
      }
    };

    loadSpecialties();
    return () => { cancelled = true; };
  }, []);

  // 3. Tải danh sách bác sĩ
  useEffect(() => {
    let cancelled = false;

    const loadDoctors = async () => {
      try {
        const data = await apiRequest("/doctors?status=ACTIVE");
        if (!cancelled) {
          setDoctors(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError((prev) => prev ? `${prev}\nKhông thể tải bác sĩ: ${err.message}` : `Không thể tải bác sĩ: ${err.message}`);
        }
      } finally {
        if (!cancelled) setLoadingDoctors(false);
      }
    };

    loadDoctors();
    return () => { cancelled = true; };
  }, []);

  // Lọc bác sĩ theo UUID chuyên khoa
  const filteredDoctors = useMemo(() => {
    if (!selectedSpecialtyId) return [];

    return doctors.filter((doctor) =>
      getDoctorSpecialties(doctor).some((item) => {
        const specialtyId =
          item?.specialtyId ||
          item?.specialty?.specialtyId ||
          item?.specialty?.id;
        return String(specialtyId || "") === String(selectedSpecialtyId);
      })
    );
  }, [doctors, selectedSpecialtyId]);

  // Cập nhật bác sĩ khi đổi chuyên khoa
  useEffect(() => {
    const currentDoctorExists = filteredDoctors.some(
      (doctor) => String(getDoctorId(doctor)) === String(selectedDoctorId)
    );

    if (!currentDoctorExists) {
      setSelectedDoctorId(
        filteredDoctors.length > 0 ? String(getDoctorId(filteredDoctors[0]) || "") : ""
      );
    }

    setSelectedSlotId("");
    setSlots([]);
  }, [filteredDoctors, selectedDoctorId]);

  // 4. Tải khung giờ theo Cơ sở, Bác sĩ, Chuyên khoa và Ngày khám
  useEffect(() => {
    let cancelled = false;

    const loadSlots = async () => {
      if (!selectedDoctorId || !selectedSpecialtyId || !selectedDate) {
        setSlots([]);
        setSelectedSlotId("");
        setLoadingSlots(false);
        return;
      }

      setLoadingSlots(true);
      setSelectedSlotId("");

      try {
        const params = new URLSearchParams({
          doctorId: selectedDoctorId,
          specialtyId: selectedSpecialtyId,
          date: selectedDate,
          status: "AVAILABLE",
        });

        if (selectedClinicId) {
          params.append("clinicId", selectedClinicId);
        }

        const data = await apiRequest(`/slots?${params.toString()}`);
        if (cancelled) return;

        const availableSlots = (Array.isArray(data) ? data : [])
          .filter(
            (slot) =>
              slot.status === "AVAILABLE" &&
              String(slot.doctorId) === String(selectedDoctorId) &&
              String(slot.specialtyId) === String(selectedSpecialtyId) &&
              (!selectedClinicId || String(slot.clinicId) === String(selectedClinicId)) &&
              slot.date === selectedDate
          )
          .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));

        setSlots(availableSlots);
      } catch (err) {
        if (!cancelled) {
          setSlots([]);
          setError(`Không thể tải khung giờ: ${err.message}`);
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    };

    loadSlots();
    return () => { cancelled = true; };
  }, [selectedClinicId, selectedDoctorId, selectedSpecialtyId, selectedDate]);

  const selectedClinic = clinics.find(
    (item) => String(getClinicId(item)) === String(selectedClinicId)
  );

  const selectedSpecialty = specialties.find(
    (item) => String(getSpecialtyId(item)) === String(selectedSpecialtyId)
  );

  const selectedDoctor = doctors.find(
    (item) => String(getDoctorId(item)) === String(selectedDoctorId)
  );

  const selectedSlot = slots.find(
    (item) => String(getSlotId(item)) === String(selectedSlotId)
  );

  const handleBook = async (event) => {
    event.preventDefault();
    setError("");
    setBooked(null);

    if (!getToken()) {
      setError("Bạn cần đăng nhập để đặt lịch khám.");
      return;
    }

    if (!selectedClinicId) {
      setError("Vui lòng chọn cơ sở phòng khám.");
      return;
    }

    if (selectedDate < today) {
      setError("Ngày khám không được nằm trong quá khứ.");
      return;
    }

    if (!selectedSlot || selectedSlot.status !== "AVAILABLE") {
      setError("Vui lòng chọn một khung giờ còn trống.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await apiRequest("/appointments", {
        method: "POST",
        body: JSON.stringify({
          slotId: selectedSlotId,
          reason: reason.trim() || null,
        }),
      });

      setBooked({
        appointmentId: result?.appointmentId,
        clinicName: getClinicName(selectedClinic),
        doctorName: getDoctorName(selectedDoctor),
        appointmentDate: result?.appointmentDate || selectedDate,
        startTime: result?.startTime || selectedSlot.startTime,
        endTime: result?.endTime || selectedSlot.endTime,
        status: result?.status || "CONFIRMED",
      });

      setSlots((previous) =>
        previous.filter(
          (item) => String(getSlotId(item)) !== String(selectedSlotId)
        )
      );

      setSelectedSlotId("");
      setReason("");
    } catch (err) {
      setError(`Đặt lịch thất bại: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Đặt Lịch Khám Thông Minh Đa Cơ Sở
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Quy trình chuẩn: Chọn cơ sở phòng khám → Chuyên khoa → Ngày khám → Bác sĩ → Khung giờ.
            </p>
          </div>
          {selectedClinic && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 border border-cyan-200">
              <Building2 className="h-3.5 w-3.5" />
              <span>{getClinicName(selectedClinic)}</span>
            </div>
          )}
        </div>

        {aiRecommendation.specialtyName && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-800">
              Gợi ý từ Trợ lý AI MEDIQ: Chuyên khoa {aiRecommendation.specialtyName}
            </p>
            <p className="mt-1 text-xs leading-5 text-blue-700">
              Dựa trên triệu chứng bạn đã mô tả, AI đề xuất chuyên khoa này. Bạn có thể chọn cơ sở và chuyên khoa mong muốn bên dưới.
            </p>
            {aiRecommendation.appointmentDate && (
              <p className="mt-2 text-xs text-blue-700">
                Ngày khám dự kiến: <strong>{formatDate(selectedDate)}</strong>
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-5 flex items-start gap-2 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {booked ? (
          <div className="mt-8 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-600" />

            <h3 className="text-lg font-bold text-slate-900">
              Đặt Lịch Khám Thành Công!
            </h3>

            <p className="text-sm leading-6 text-slate-700">
              Cơ sở: <b>{booked.clinicName}</b> | Bác sĩ: <b>{booked.doctorName}</b>
            </p>

            <p className="text-sm text-slate-600">
              Thời gian: <b>{booked.startTime}</b> {booked.endTime ? `- ${booked.endTime}` : ""} ngày <b>{formatDate(booked.appointmentDate)}</b>
            </p>

            {booked.appointmentId && (
              <p className="break-all text-xs font-mono text-slate-600 bg-white/70 py-1.5 px-3 rounded-lg max-w-md mx-auto border border-emerald-200">
                Mã lịch hẹn: <b>{booked.appointmentId}</b>
              </p>
            )}

            <p className="text-xs text-emerald-700 font-semibold">
              Trạng thái: {booked.status} (Đã xác nhận vào hệ thống)
            </p>

            <button
              type="button"
              onClick={() => {
                setBooked(null);
                setError("");
              }}
              className="mt-3 rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-300 transition"
            >
              Đặt thêm lịch mới
            </button>
          </div>
        ) : (
          <form onSubmit={handleBook} className="mt-6 space-y-6">
            {/* 1. CHỌN CƠ SỞ PHÒNG KHÁM (BƯỚC QUAN TRỌNG ĐẦU TIÊN) */}
            <div>
              <label className="mb-3 flex items-center justify-between text-xs font-bold uppercase text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-cyan-600" />
                  1. Chọn Cơ Sở Phòng Khám (Bắt buộc)
                </span>
                <span className="text-[11px] font-normal text-slate-400">
                  {clinics.length} cơ sở đang hoạt động
                </span>
              </label>

              {loadingClinics ? (
                <p className="text-sm text-slate-500">Đang tải danh sách cơ sở phòng khám...</p>
              ) : clinics.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có cơ sở phòng khám nào.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {clinics.map((clinic) => {
                    const id = String(getClinicId(clinic) || "");
                    const active = selectedClinicId === id;

                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => {
                          setSelectedClinicId(id);
                          setSelectedSlotId("");
                          setBooked(null);
                          setError("");
                        }}
                        className={`rounded-xl border p-4 text-left transition ${
                          active
                            ? "border-cyan-500 bg-cyan-50/80 shadow-xs ring-1 ring-cyan-500/30"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-bold ${active ? "text-cyan-900" : "text-slate-800"}`}>
                            {getClinicName(clinic)}
                          </p>
                          <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            active ? "bg-cyan-600 text-white" : "bg-slate-200 text-slate-600"
                          }`}>
                            {clinic.code || "Cơ sở"}
                          </span>
                        </div>

                        {clinic.address && (
                          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="line-clamp-1">{clinic.address}</span>
                          </p>
                        )}

                        {clinic.phone && (
                          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>Hotline: {clinic.phone}</span>
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. CHỌN CHUYÊN KHOA */}
            <div>
              <label className="mb-3 block text-xs font-bold uppercase text-slate-600">
                2. Chọn Chuyên Khoa
              </label>

              {loadingSpecialties ? (
                <p className="text-sm text-slate-500">Đang tải chuyên khoa...</p>
              ) : specialties.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có chuyên khoa đang hoạt động.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {specialties.map((specialty) => {
                    const id = String(getSpecialtyId(specialty) || "");
                    const active = selectedSpecialtyId === id;

                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => {
                          setSelectedSpecialtyId(id);
                          setSelectedSlotId("");
                          setBooked(null);
                          setError("");
                        }}
                        className={`rounded-xl border p-3 text-left text-xs font-semibold transition ${
                          active
                            ? "border-cyan-500 bg-cyan-50 text-cyan-800 shadow-xs"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <div className="font-bold">{specialty.name}</div>
                        <div className="mt-1 text-[10px] font-normal text-slate-400 line-clamp-1">
                          {specialty.description || "Chuyên khoa"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. CHỌN NGÀY KHÁM */}
            <div>
              <label className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600">
                <CalendarIcon className="h-4 w-4 text-cyan-600" />
                3. Chọn Ngày Khám
              </label>

              <input
                type="date"
                required
                min={today}
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setSelectedSlotId("");
                  setBooked(null);
                  setError("");
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none sm:w-64"
              />
            </div>

            {/* 4. CHỌN BÁC SĨ PHỤ TRÁCH TẠI CƠ SỞ */}
            <div>
              <label className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600">
                <UserCheck className="h-4 w-4 text-cyan-600" />
                4. Chọn Bác Sĩ Chuyên Khoa
              </label>

              {loadingDoctors ? (
                <p className="text-sm text-slate-500">Đang tải danh sách bác sĩ...</p>
              ) : filteredDoctors.length === 0 ? (
                <p className="text-sm text-slate-500">Không có bác sĩ thuộc chuyên khoa này.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filteredDoctors.map((doctor) => {
                    const id = String(getDoctorId(doctor) || "");
                    const active = selectedDoctorId === id;

                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => {
                          setSelectedDoctorId(id);
                          setSelectedSlotId("");
                          setBooked(null);
                          setError("");
                        }}
                        className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                          active
                            ? "border-cyan-500 bg-cyan-50 shadow-xs"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700">
                          {getDoctorName(doctor).charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {getDoctorName(doctor)}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {doctor.licenseNumber
                              ? `Số chứng chỉ: ${doctor.licenseNumber}`
                              : "Bác sĩ chuyên khoa"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. CHỌN KHUNG GIỜ KHÁM CÒN TRỐNG */}
            <div>
              <label className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600">
                <Clock className="h-4 w-4 text-cyan-600" />
                5. Chọn Khung Giờ Khám (Còn trống)
              </label>

              {loadingSlots ? (
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <LoaderCircle className="h-4 w-4 animate-spin text-cyan-600" />
                  Đang tải khung giờ tại {selectedClinic?.name || "cơ sở"}...
                </p>
              ) : slots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-500">
                    Không có khung giờ trống trong ngày {formatDate(selectedDate)} tại cơ sở này.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Vui lòng chọn ngày khám khác hoặc đổi cơ sở/bác sĩ.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => {
                    const id = String(getSlotId(slot) || "");
                    const active = selectedSlotId === id;

                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => {
                          setSelectedSlotId(id);
                          setBooked(null);
                          setError("");
                        }}
                        className={`rounded-xl border px-3.5 py-2 text-xs font-mono font-semibold transition ${
                          active
                            ? "border-cyan-600 bg-cyan-600 text-white shadow-xs"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {slot.startTime} {slot.endTime ? `- ${slot.endTime}` : ""}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 6. LÝ DO KHÁM */}
            <div>
              <label className="mb-3 block text-xs font-bold uppercase text-slate-600">
                6. Lý Do Khám & Ghi Chú Lâm Sàng
              </label>

              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Mô tả triệu chứng hiện tại hoặc yêu cầu đặc biệt khi đến khám..."
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* NÚT XÁC NHẬN ĐẶT LỊCH */}
            <button
              type="submit"
              disabled={
                submitting ||
                loadingSlots ||
                !selectedClinicId ||
                !selectedDoctorId ||
                !selectedSpecialtyId ||
                !selectedSlotId
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3.5 font-bold text-white shadow-md shadow-cyan-600/20 transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Đang xử lý đặt lịch...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Xác Nhận Đặt Lịch
                  {selectedClinic ? ` tại ${selectedClinic.name || "Cơ sở"}` : ""}
                  {selectedSlot ? ` lúc ${selectedSlot.startTime}` : ""}
                </>
              )}
            </button>

            {selectedClinic && selectedSpecialty && (
              <p className="text-center text-xs text-slate-400">
                Đã chọn: <b>{selectedClinic.name}</b> • Chuyên khoa: <b>{selectedSpecialty.name}</b>
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default PatientBooking;
