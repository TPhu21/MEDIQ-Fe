
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  DoorOpen,
  MapPin,
  Stethoscope,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  UserRoundPlus,
  CalendarDays,
  Clock,
  Building2,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8080";

const ROOM_STATUS_LIST = ["Đang hoạt động", "Ngừng hoạt động", "Bảo trì"];

const STATUS_TO_API = {
  "Đang hoạt động": "ACTIVE",
  "Ngừng hoạt động": "INACTIVE",
  "Bảo trì": "MAINTENANCE",
};

const STATUS_FROM_API = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngừng hoạt động",
  MAINTENANCE: "Bảo trì",
};

const STATUS_CONFIG = {
  "Đang hoạt động": {
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  "Bảo trì": {
    color: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  "Ngừng hoạt động": {
    color: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
};

const EMPTY_FORM = {
  name: "",
  department: "",
  floor: "",
  area: "",
  status: "Đang hoạt động",
};

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const EMPTY_ASSIGNMENT = {
  doctorId: "",
  date: getLocalDate(),
  startTime: "08:00",
  endTime: "12:00",
};

const getToken = () =>
  localStorage.getItem("accessToken") || localStorage.getItem("token");

async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token
        ? {
          Authorization: token.startsWith("Bearer ")
            ? token
            : `Bearer ${token}`,
        }
        : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorJson = await response.json();
      errorDetail =
        errorJson.message ||
        errorJson.error ||
        errorJson.detail ||
        (typeof errorJson === "string" ? errorJson : JSON.stringify(errorJson));
    } catch {
      try {
        errorDetail = await response.text();
      } catch {
        errorDetail = "";
      }
    }

    if (!errorDetail || errorDetail === "{}") {
      errorDetail = `Yêu cầu thất bại (Mã lỗi: ${response.status})`;
    } else if (
      errorDetail.includes("DOCTOR_SCHEDULE_OVERLAP") ||
      errorDetail.toLowerCase().includes("overlapping work schedule")
    ) {
      errorDetail =
        "Bác sĩ đã có lịch làm việc trùng lặp trong khoảng thời gian này.";
    } else if (
      errorDetail.includes("ROOM_SCHEDULE_OVERLAP") ||
      errorDetail.toLowerCase().includes("overlapping room")
    ) {
      errorDetail =
        "Phòng khám đã có lịch làm việc khác trong khoảng thời gian này.";
    } else if (
      errorDetail.includes("PAST_SCHEDULE_NOT_ALLOWED") ||
      errorDetail.toLowerCase().includes("past dates")
    ) {
      errorDetail = "Không thể phân công lịch cho ngày trong quá khứ.";
    } else if (errorDetail.includes("Bác sĩ không thuộc chuyên khoa")) {
      errorDetail = "Bác sĩ được chọn không thuộc chuyên khoa của phòng này.";
    } else if (response.status === 403) {
      errorDetail =
        "Tài khoản không có quyền thực hiện thao tác này hoặc phiên đăng nhập đã hết hạn.";
    }

    throw new Error(errorDetail);
  }

  if (response.status === 204) return null;

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function makeRoomCode(name) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 20);

  return `${slug || "ROOM"}-${Date.now().toString().slice(-6)}`;
}

function getRoomStatus(status) {
  return STATUS_FROM_API[status] || "Đang hoạt động";
}

function getSpecialtyId(specialty) {
  return specialty?.specialtyId || specialty?.id || "";
}

function getSpecialtyName(specialty) {
  return specialty?.name || specialty?.specialtyName || "";
}

function getDoctorId(doctor) {
  return doctor?.doctorId || doctor?.id || "";
}

function getDoctorName(doctor) {
  return (
    doctor?.fullName ||
    doctor?.doctorName ||
    doctor?.name ||
    doctor?.email ||
    "Bác sĩ"
  );
}

function getScheduleDate(schedule) {
  return schedule?.date || schedule?.assignmentDate || "";
}

function getScheduleId(schedule) {
  return schedule?.scheduleId || schedule?.id || "";
}

function getScheduleRoomId(schedule) {
  return schedule?.roomId || "";
}

function getScheduleDoctorName(schedule) {
  return (
    schedule?.doctorName ||
    schedule?.fullName ||
    schedule?.doctor?.fullName ||
    schedule?.doctor?.name ||
    "Chưa phân công"
  );
}

function normalizeSchedules(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return data ? [data] : [];
}

function getBestSchedule(schedules, roomId, selectedDate) {
  return (
    schedules
      .filter((item) => {
        const scheduleRoomId = getScheduleRoomId(item);
        const scheduleDate = getScheduleDate(item);

        return (
          (!scheduleRoomId || String(scheduleRoomId) === String(roomId)) &&
          (!scheduleDate || scheduleDate.slice(0, 10) === selectedDate) &&
          item.status !== "CANCELLED"
        );
      })
      .sort((a, b) => {
        if (a.status === "APPROVED" && b.status !== "APPROVED") return -1;
        if (b.status === "APPROVED" && a.status !== "APPROVED") return 1;

        return (a.startTime || "").localeCompare(b.startTime || "");
      })[0] || null
  );
}

export const AdminRooms = ({ clinicId: initialClinicId }) => {
  const [clinics, setClinics] = useState([]);
  const [clinicId, setClinicId] = useState(initialClinicId || "");
  const [specialties, setSpecialties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Ngày được chọn để lọc lịch làm việc trên danh sách phòng.
  const [filterDate, setFilterDate] = useState(getLocalDate());

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState(null);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [assignment, setAssignment] = useState({
    ...EMPTY_ASSIGNMENT,
  });
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const selectedClinic = useMemo(() => {
    return clinics.find((c) => (c.clinicId || c.id) === clinicId) || null;
  }, [clinics, clinicId]);

  useEffect(() => {
    let cancelled = false;

    async function loadClinics() {
      setLoadingClinics(true);

      try {
        const data = await apiRequest("/api/admin/clinics?status=ACTIVE");
        if (cancelled) return;

        const list = Array.isArray(data) ? data : [];
        setClinics(list);

        if (initialClinicId) {
          setClinicId(initialClinicId);
        } else if (list.length > 0) {
          setClinicId((current) => current || list[0].clinicId);
        } else {
          setClinicId("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(`Không tải được danh sách phòng khám: ${err.message}`);
        }
      } finally {
        if (!cancelled) setLoadingClinics(false);
      }
    }

    loadClinics();

    return () => {
      cancelled = true;
    };
  }, [initialClinicId]);

  useEffect(() => {
    let cancelled = false;

    async function loadSpecialties() {
      try {
        const data = await apiRequest("/api/admin/specialties");
        if (!cancelled) {
          setSpecialties(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Không tải được chuyên khoa:", err);
        }
      }
    }

    loadSpecialties();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadRooms = useCallback(async () => {
    if (!clinicId) {
      setRooms([]);
      return;
    }

    if (!filterDate) {
      setRooms([]);
      return;
    }

    setLoadingRooms(true);
    setError("");

    try {
      const roomData = await apiRequest(
        `/api/admin/rooms?clinicId=${encodeURIComponent(clinicId)}`
      );

      const roomList = Array.isArray(roomData) ? roomData : [];

      const mappedRooms = await Promise.all(
        roomList.map(async (room) => {
          const specialty = specialties.find(
            (item) =>
              String(getSpecialtyId(item)) === String(room.specialtyId || "")
          );

          let schedule = null;

          try {
            const scheduleData = await apiRequest(
              `/api/admin/rooms/${room.roomId}/assignments?date=${encodeURIComponent(filterDate)}`
            );

            const scheduleList = normalizeSchedules(scheduleData);

            schedule = getBestSchedule(
              scheduleList,
              room.roomId,
              filterDate
            );
          } catch (scheduleError) {
            console.error(
              `Không tải được lịch phòng ${room.roomId} ngày ${filterDate}:`,
              scheduleError
            );
          }

          return {
            id: room.roomId,
            roomId: room.roomId,
            clinicId: room.clinicId,
            code: room.code,
            name: room.name || "",
            specialtyId: room.specialtyId || "",
            department: specialty
              ? getSpecialtyName(specialty)
              : "Chưa có chuyên khoa",
            doctor: schedule ? getScheduleDoctorName(schedule) : "Chưa phân công",
            doctorId: schedule?.doctorId || "",
            scheduleId: getScheduleId(schedule),
            date: getScheduleDate(schedule) || filterDate,
            startTime: schedule?.startTime?.slice(0, 5) || "",
            endTime: schedule?.endTime?.slice(0, 5) || "",
            assignmentStatus: schedule?.status || "",
            floor: room.floor || "",
            area: room.area || "",
            status: getRoomStatus(room.status),
          };
        })
      );

      setRooms(mappedRooms);
    } catch (err) {
      setRooms([]);
      setError(`Không tải được dữ liệu phòng: ${err.message}`);
    } finally {
      setLoadingRooms(false);
    }
  }, [clinicId, specialties, filterDate]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rooms.filter((room) => {
      const matchQ =
        room.name.toLowerCase().includes(q) ||
        room.department.toLowerCase().includes(q) ||
        room.doctor.toLowerCase().includes(q) ||
        (room.code || "").toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "ALL" || room.status === statusFilter;

      return matchQ && matchStatus;
    });
  }, [rooms, search, statusFilter]);

  const openAdd = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setModalError(null);
    setModal("add");
  };

  const openEdit = (room) => {
    setSelected(room);
    setForm({
      ...EMPTY_FORM,
      name: room.name,
      department: room.specialtyId || "",
      floor: room.floor || "",
      area: room.area || "",
      status: room.status,
    });
    setModalError(null);
    setModal("edit");
  };

  const openDelete = (room) => {
    setSelected(room);
    setModalError(null);
    setModal("delete");
  };

  const openAssignment = async (room) => {
    setSelected(room);
    setAssignment({
      ...EMPTY_ASSIGNMENT,
      date: filterDate || getLocalDate(),
    });
    setDoctors([]);
    setModalError(null);
    setModal("assign");

    setLoadingDoctors(true);

    try {
      const result = await apiRequest(
        `/api/admin/rooms/${room.roomId}/doctors`
      );
      setDoctors(Array.isArray(result) ? result : []);
    } catch (err) {
      showToast(`Không tải được danh sách bác sĩ: ${err.message}`, "error");
    } finally {
      setLoadingDoctors(false);
    }
  };

  const loadAssignmentForDate = useCallback(async (roomId, date) => {
    if (!roomId || !date) return null;

    setLoadingAssignment(true);

    try {
      const result = await apiRequest(
        `/api/admin/rooms/${roomId}/assignments?date=${encodeURIComponent(date)}`
      );

      const schedule = getBestSchedule(
        normalizeSchedules(result),
        roomId,
        date
      );

      if (!schedule) return null;

      return {
        doctorId: schedule.doctorId || "",
        date: getScheduleDate(schedule) || date,
        startTime: schedule.startTime?.slice(0, 5) || "08:00",
        endTime: schedule.endTime?.slice(0, 5) || "12:00",
        scheduleId: getScheduleId(schedule),
        status: schedule.status || "",
      };
    } finally {
      setLoadingAssignment(false);
    }
  }, []);

  useEffect(() => {
    if (modal !== "assign" || !selected?.roomId || !assignment.date) {
      return;
    }

    let cancelled = false;

    async function loadSelectedDateAssignment() {
      try {
        const item = await loadAssignmentForDate(
          selected.roomId,
          assignment.date
        );

        if (cancelled) return;

        if (item) {
          setAssignment((current) => ({
            ...current,
            ...item,
            date: assignment.date,
          }));
        } else {
          setAssignment((current) => ({
            ...current,
            doctorId: "",
            startTime: "08:00",
            endTime: "12:00",
            scheduleId: "",
            status: "",
          }));
        }
      } catch (err) {
        if (!cancelled) {
          console.info("Chưa tải được lịch phân công:", err.message);

          setAssignment((current) => ({
            ...current,
            scheduleId: "",
            status: "",
          }));
        }
      }
    }

    loadSelectedDateAssignment();

    return () => {
      cancelled = true;
    };
  }, [modal, selected, assignment.date, loadAssignmentForDate]);

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setModalError(null);
  };

  const handleAdd = async () => {
    if (!clinicId) {
      const msg = "Vui lòng chọn cơ sở khám.";
      setModalError(msg);
      showToast(msg, "error");
      return;
    }

    if (!form.name.trim()) {
      const msg = "Vui lòng nhập tên phòng.";
      setModalError(msg);
      showToast(msg, "error");
      return;
    }

    if (!form.department) {
      const msg = "Vui lòng chọn chuyên khoa.";
      setModalError(msg);
      showToast(msg, "error");
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      const code = makeRoomCode(form.name);

      await apiRequest(
        `/api/admin/rooms?clinicId=${encodeURIComponent(clinicId)}`,
        {
          method: "POST",
          body: JSON.stringify({
            code,
            name: form.name.trim(),
            specialtyId: form.department,
            floor: form.floor.trim(),
            area: form.area.trim(),
          }),
        }
      );

      closeModal();
      await loadRooms();
      showToast(`Đã thêm phòng "${form.name}"`);
    } catch (err) {
      setModalError(err.message);
      showToast(`Không thể thêm phòng: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selected) return;

    if (!form.name.trim()) {
      const msg = "Vui lòng nhập tên phòng.";
      setModalError(msg);
      showToast(msg, "error");
      return;
    }

    if (!form.department) {
      const msg = "Vui lòng chọn chuyên khoa.";
      setModalError(msg);
      showToast(msg, "error");
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      await apiRequest(`/api/admin/rooms/${selected.roomId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name.trim(),
          specialtyId: form.department,
          floor: form.floor.trim(),
          area: form.area.trim(),
          status: STATUS_TO_API[form.status] || "ACTIVE",
        }),
      });

      closeModal();
      await loadRooms();
      showToast(`Đã cập nhật phòng "${form.name}"`);
    } catch (err) {
      setModalError(err.message);
      showToast(`Không thể cập nhật phòng: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignmentSave = async () => {
    if (!selected) return;

    if (!assignment.doctorId) {
      const msg = "Vui lòng chọn bác sĩ để phân công.";
      setModalError(msg);
      showToast(msg, "error");
      return;
    }

    if (!assignment.date) {
      const msg = "Vui lòng chọn ngày làm việc.";
      setModalError(msg);
      showToast(msg, "error");
      return;
    }

    if (!assignment.startTime || !assignment.endTime) {
      const msg = "Vui lòng nhập đầy đủ giờ bắt đầu và kết thúc.";
      setModalError(msg);
      showToast(msg, "error");
      return;
    }

    if (assignment.endTime <= assignment.startTime) {
      const msg = "Giờ kết thúc phải sau giờ bắt đầu.";
      setModalError(msg);
      showToast(msg, "error");
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      await apiRequest(`/api/admin/rooms/${selected.roomId}/assignments`, {
        method: "POST",
        body: JSON.stringify({
          doctorId: assignment.doctorId,
          date: assignment.date,
          startTime: assignment.startTime,
          endTime: assignment.endTime,
        }),
      });

      closeModal();
      await loadRooms();
      showToast("Đã phân công bác sĩ thành công!");
    } catch (err) {
      setModalError(err.message);
      showToast(`Không thể phân công bác sĩ: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    showToast(
      "Backend chưa có API xóa phòng. Cần bổ sung endpoint trước.",
      "error"
    );
  };

  const handleStatusChange = async (room, newStatus) => {
    try {
      await apiRequest(`/api/admin/rooms/${room.roomId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: room.name,
          specialtyId: room.specialtyId,
          floor: room.floor || "",
          area: room.area || "",
          status: STATUS_TO_API[newStatus],
        }),
      });

      await loadRooms();
      showToast("Đã cập nhật trạng thái");
    } catch (err) {
      showToast(`Không thể đổi trạng thái: ${err.message}`, "error");
    }
  };

  const statusCounts = ROOM_STATUS_LIST.reduce((acc, status) => {
    acc[status] = rooms.filter((room) => room.status === status).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản Lý Phòng Khám
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tổng cộng{" "}
            <span className="font-bold text-slate-700">{rooms.length}</span>{" "}
            phòng thuộc cơ sở đã chọn
          </p>
        </div>
      </div>

      {/* Quy trình: Chọn cơ sở có sẵn -> Tạo phòng */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-lg space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              <Building2 className="w-4 h-4 text-cyan-600" />
              Chọn Cơ Sở Khám Có Sẵn
            </label>

            <select
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              disabled={loadingClinics || !!initialClinicId}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 disabled:opacity-70 focus:outline-none focus:border-cyan-500 focus:bg-white shadow-xs"
            >
              <option value="">
                {loadingClinics
                  ? "Đang tải danh sách cơ sở khám..."
                  : "-- Vui lòng chọn cơ sở khám có sẵn --"}
              </option>
              {clinics.map((clinic) => (
                <option key={clinic.clinicId} value={clinic.clinicId}>
                  {clinic.name} ({clinic.code})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:self-end">
            <button
              onClick={openAdd}
              disabled={!clinicId}
              title={
                !clinicId
                  ? "Vui lòng chọn cơ sở có sẵn trước khi tạo phòng"
                  : `Tạo phòng mới cho ${selectedClinic?.name}`
              }
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              <Plus className="w-4 h-4" />
              Tạo Phòng Mới
            </button>
          </div>
        </div>

        {selectedClinic ? (
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-5 gap-y-1 pt-3 border-t border-slate-100 font-medium">
            <span className="text-slate-700 font-semibold">
              Cơ sở đang chọn: <b className="text-cyan-700">{selectedClinic.name}</b>
            </span>
            {selectedClinic.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {selectedClinic.address}
              </span>
            )}
            {selectedClinic.phone && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                SĐT: {selectedClinic.phone}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
            Vui lòng chọn một cơ sở khám có sẵn ở trên để xem danh sách phòng và thực hiện tạo phòng mới.
          </p>
        )}
      </div>

      {/* Bộ lọc lịch làm việc theo ngày */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CalendarDays className="w-4 h-4 text-cyan-600" />
          Ngày làm việc:
        </div>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
          aria-label="Lọc lịch làm việc theo ngày"
        />

        <button
          type="button"
          onClick={() => setFilterDate(getLocalDate())}
          disabled={filterDate === getLocalDate()}
          className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Hôm nay
        </button>

        <span className="text-xs text-slate-400">
          Danh sách sẽ tự cập nhật theo ngày đã chọn.
        </span>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div>{error}</div>
          <button
            onClick={loadRooms}
            className="inline-flex items-center gap-1 font-semibold whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROOM_STATUS_LIST.map((status) => {
          const config = STATUS_CONFIG[status];

          return (
            <button
              key={status}
              onClick={() =>
                setStatusFilter(statusFilter === status ? "ALL" : status)
              }
              className={`bg-white rounded-xl border p-3 text-left transition-all hover:shadow-sm ${statusFilter === status
                  ? "border-cyan-400 ring-2 ring-cyan-100"
                  : "border-slate-200"
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                  {status}
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {statusCounts[status] || 0}
              </p>
              <p className="text-[11px] text-slate-400">phòng</p>
            </button>
          );
        })}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên phòng, chuyên khoa, bác sĩ..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1050px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">
                  Phòng khám
                </th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">
                  Vị trí
                </th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">
                  Chuyên khoa / Bác sĩ
                </th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">
                  Giờ bắt đầu
                </th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">
                  Giờ kết thúc
                </th>
                <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">
                  Trạng thái
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loadingRooms ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />
                    Đang tải lịch ngày {filterDate}...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    {!clinicId
                      ? "Vui lòng chọn phòng khám"
                      : "Không tìm thấy kết quả"}
                  </td>
                </tr>
              ) : (
                filtered.map((room) => {
                  const config =
                    STATUS_CONFIG[room.status] ||
                    STATUS_CONFIG["Đang hoạt động"];

                  return (
                    <tr key={room.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center justify-center">
                            <DoorOpen className="w-4 h-4 text-cyan-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {room.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Mã phòng: {room.code || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="text-xs text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {room.floor || "—"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {room.area || "—"}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="text-xs font-bold text-slate-800">
                          {room.department}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Stethoscope className="w-3 h-3" />
                          {room.doctor}
                        </p>
                      </td>

                      <td className="p-4 text-xs text-slate-700">
                        {room.startTime || "—"}
                      </td>

                      <td className="p-4 text-xs text-slate-700">
                        {room.endTime || "—"}
                      </td>

                      <td className="p-4">
                        <div className="relative inline-block group">
                          <button
                            type="button"
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.color}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                            />
                            {room.status}
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          </button>

                          <div className="absolute left-0 top-full pt-2 z-50 hidden group-hover:block min-w-[170px]">
                            <div className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                              {ROOM_STATUS_LIST.map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => handleStatusChange(room, status)}
                                  className={`w-full text-left px-3 py-2.5 text-xs font-semibold hover:bg-slate-50 flex items-center gap-2 ${status === room.status
                                      ? "text-cyan-600"
                                      : "text-slate-700"
                                    }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[status].dot}`}
                                  />
                                  {status}
                                  {status === room.status && (
                                    <Check className="w-3 h-3 ml-auto" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openAssignment(room)}
                            title="Phân công bác sĩ"
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 text-xs font-semibold whitespace-nowrap"
                          >
                            <UserRoundPlus className="w-3.5 h-3.5" />
                            Phân công BS
                          </button>

                          <button
                            onClick={() => openEdit(room)}
                            title="Chỉnh sửa phòng"
                            className="p-1.5 rounded-lg hover:bg-cyan-50 text-slate-400 hover:text-cyan-600"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openDelete(room)}
                            title="Xóa phòng"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
          Hiển thị {filtered.length} / {rooms.length} phòng · Ngày: {filterDate}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900">
                {modal === "add" && "Thêm phòng mới"}
                {modal === "edit" && `Chỉnh sửa: ${selected?.name}`}
                {modal === "delete" && "Xác nhận xóa"}
                {modal === "assign" && `Phân công bác sĩ - ${selected?.name}`}
              </h2>

              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              {modalError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3 shadow-xs animate-in fade-in">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-red-900 text-sm">Đã xảy ra lỗi:</p>
                    <p className="mt-1 text-xs text-red-800 leading-relaxed font-medium break-words">
                      {modalError}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalError(null)}
                    className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-100/50 transition shrink-0"
                    title="Đóng thông báo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {modal === "delete" ? (
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-sm text-slate-700">
                    Bạn muốn xóa phòng{" "}
                    <span className="font-bold">"{selected?.name}"</span>?
                    <br />
                    <span className="text-xs text-slate-500">
                      Backend hiện chưa cung cấp API xóa phòng.
                    </span>
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={closeModal}
                      className="flex-1 px-4 py-2.5 border rounded-xl text-sm font-semibold"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold"
                    >
                      Kiểm tra API
                    </button>
                  </div>
                </div>
              ) : modal === "assign" ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-cyan-50 border border-cyan-100 p-3">
                    <p className="text-xs text-cyan-800">
                      <span className="font-bold">Phòng:</span> {selected?.name}
                    </p>
                    <p className="text-xs text-cyan-800 mt-1">
                      <span className="font-bold">Chuyên khoa:</span>{" "}
                      {selected?.department}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      <CalendarDays className="inline w-3.5 h-3.5 mr-1" />
                      Ngày làm việc *
                    </label>
                    <input
                      type="date"
                      value={assignment.date}
                      onChange={(e) =>
                        setAssignment((current) => ({
                          ...current,
                          date: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      Bác sĩ *
                    </label>
                    <select
                      value={assignment.doctorId}
                      onChange={(e) =>
                        setAssignment((current) => ({
                          ...current,
                          doctorId: e.target.value,
                        }))
                      }
                      disabled={loadingDoctors}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white disabled:bg-slate-50"
                    >
                      <option value="">
                        {loadingDoctors
                          ? "Đang tải danh sách bác sĩ..."
                          : "-- Chọn bác sĩ --"}
                      </option>
                      {doctors.map((doctor) => {
                        const id = getDoctorId(doctor);
                        if (!id) return null;

                        return (
                          <option key={id} value={id}>
                            {getDoctorName(doctor)}
                          </option>
                        );
                      })}
                    </select>

                    {!loadingDoctors && doctors.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1.5">
                        Chưa tải được bác sĩ cho phòng này. Kiểm tra API bác sĩ theo phòng.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                        <Clock className="inline w-3.5 h-3.5 mr-1" />
                        Giờ bắt đầu *
                      </label>
                      <input
                        type="time"
                        value={assignment.startTime}
                        onChange={(e) =>
                          setAssignment((current) => ({
                            ...current,
                            startTime: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                        <Clock className="inline w-3.5 h-3.5 mr-1" />
                        Giờ kết thúc *
                      </label>
                      <input
                        type="time"
                        value={assignment.endTime}
                        onChange={(e) =>
                          setAssignment((current) => ({
                            ...current,
                            endTime: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {assignment.status && (
                    <p className="text-xs text-slate-500">
                      Trạng thái lịch hiện tại:{" "}
                      <span className="font-semibold">{assignment.status}</span>
                    </p>
                  )}

                  {loadingAssignment && (
                    <p className="text-xs text-slate-400">
                      Đang kiểm tra lịch của phòng trong ngày đã chọn...
                    </p>
                  )}

                  <p className="text-xs text-slate-400">
                    Lịch mới có thể ở trạng thái chờ duyệt theo quy trình của scheduling-service.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={closeModal}
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold disabled:opacity-60"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleAssignmentSave}
                      disabled={saving || loadingDoctors}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Lưu phân công
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedClinic && (
                    <div className="p-3 bg-cyan-50/80 border border-cyan-200 rounded-xl flex items-center gap-2.5 text-xs text-cyan-900">
                      <Building2 className="w-4 h-4 text-cyan-600 shrink-0" />
                      <div>
                        <span className="text-slate-500">Cơ sở khám trực thuộc:</span>{" "}
                        <b className="text-slate-800">{selectedClinic.name}</b>{" "}
                        <span className="font-mono text-cyan-700">({selectedClinic.code})</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                        Tên phòng *
                      </label>
                      <input
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
                        placeholder="VD: Phòng 201"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                        Chuyên khoa *
                      </label>
                      <select
                        value={form.department}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            department: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
                      >
                        <option value="">-- Chọn chuyên khoa --</option>
                        {specialties.map((specialty) => {
                          const id = getSpecialtyId(specialty);
                          if (!id) return null;

                          return (
                            <option key={id} value={id}>
                              {getSpecialtyName(specialty)}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                        Tầng
                      </label>
                      <input
                        value={form.floor}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, floor: e.target.value }))
                        }
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
                        placeholder="VD: Tầng 2"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                        Khu
                      </label>
                      <input
                        value={form.area}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, area: e.target.value }))
                        }
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
                        placeholder="VD: Khu A"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                      Trạng thái
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, status: e.target.value }))
                      }
                      disabled={modal === "add"}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white disabled:bg-slate-50"
                    >
                      {ROOM_STATUS_LIST.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="text-xs text-slate-400">
                    Tầng và khu vực được lưu trực tiếp vào thông tin phòng.
                  </p>

                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={closeModal}
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={modal === "add" ? handleAdd : handleEdit}
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold"
                    >
                      {saving
                        ? "Đang lưu..."
                        : modal === "add"
                          ? "Thêm mới"
                          : "Lưu thay đổi"}
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
