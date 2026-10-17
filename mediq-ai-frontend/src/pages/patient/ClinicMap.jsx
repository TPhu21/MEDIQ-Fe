import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  Building2,
  Compass,
  Clock,
  AlertTriangle,
  RefreshCw,
  User,
  Layers,
} from "lucide-react";

import { getClinicRooms } from "../../services/clinicMapService";

const normalizeRoom = (room) => ({
  ...room,
  id: room.roomId ?? room.id,
  name:
    room.name ??
    room.roomName ??
    room.code ??
    "Chưa có tên phòng",
  code: room.code ?? "",
  floor: room.floor == null ? "" : String(room.floor).trim(),
  area: room.area ?? "",
  department:
    room.specialtyName ??
    room.specialtyNames ??
    room.specialty?.name ??
    room.department ??
    "Chưa có chuyên khoa",
  doctor:
    room.doctorName ??
    room.doctorNames ??
    room.doctor?.fullName ??
    room.doctor ??
    "Chưa phân công bác sĩ",
  clinicName:
    room.clinicName ??
    room.clinicNames ??
    room.clinic?.name ??
    "",
  status: String(room.status ?? "UNKNOWN").toUpperCase(),
  directions: room.directions ?? room.description ?? "",
});

const STATUS_CONFIG = {
  ACTIVE: {
    label: "Đang hoạt động",
    color: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  AVAILABLE: {
    label: "Sẵn sàng",
    color: "bg-cyan-500",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  MAINTENANCE: {
    label: "Bảo trì",
    color: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  INACTIVE: {
    label: "Ngừng hoạt động",
    color: "bg-slate-400",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  UNKNOWN: {
    label: "Chưa xác định",
    color: "bg-slate-400",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] ?? {
    label: status || "Chưa xác định",
    color: "bg-slate-400",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  };
};

const ClinicMap = () => {
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("ALL");
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadRooms = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getClinicRooms();
        const normalizedRooms = data
          .map(normalizeRoom)
          .filter((room) => room.id != null);

        if (!cancelled) {
          setRooms(normalizedRooms);
          setSelectedRoom((current) => {
            if (!current) return null;

            return (
              normalizedRooms.find(
                (room) => String(room.id) === String(current.id)
              ) ?? null
            );
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Không thể tải danh sách phòng khám."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRooms();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Lấy các tầng thực tế từ trường floor trong database.
  const floors = useMemo(() => {
    const values = [
      ...new Set(
        rooms
          .map((room) => room.floor)
          .filter((floor) => floor !== "")
      ),
    ];

    return values.sort((a, b) => {
      const numberA = Number(a.match(/-?\d+(?:\.\d+)?/)?.[0]);
      const numberB = Number(b.match(/-?\d+(?:\.\d+)?/)?.[0]);

      const hasNumberA = Number.isFinite(numberA) && /-?\d/.test(a);
      const hasNumberB = Number.isFinite(numberB) && /-?\d/.test(b);

      if (hasNumberA && hasNumberB && numberA !== numberB) {
        return numberA - numberB;
      }

      return a.localeCompare(b, "vi");
    });
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return rooms
      .filter((room) => {
        const searchable = [
          room.name,
          room.code,
          room.department,
          room.doctor,
          room.floor,
          room.area,
          room.clinicName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = searchable.includes(keyword);

        const matchesFloor =
          selectedFloor === "ALL" ||
          room.floor === selectedFloor;

        return matchesSearch && matchesFloor;
      })
      .sort((a, b) => {
        const floorCompare = a.floor.localeCompare(b.floor, "vi", {
          numeric: true,
        });

        if (floorCompare !== 0) return floorCompare;

        return a.name.localeCompare(b.name, "vi", {
          numeric: true,
        });
      });
  }, [rooms, searchTerm, selectedFloor]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedFloor("ALL");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Compass className="h-6 w-6 text-cyan-600" />
            Sơ Đồ & Định Vị Phòng Khám
          </h1>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Tra cứu phòng khám, chuyên khoa, tầng và hướng dẫn di chuyển.
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Tổng số phòng:{" "}
            <span className="font-bold text-slate-800">
              {rooms.length}
            </span>
          </p>
        </div>

        <button
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Làm mới
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </p>

          <button
            onClick={() => setRefreshKey((key) => key + 1)}
            className="font-bold underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Search and floor filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên phòng, mã phòng, chuyên khoa..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-cyan-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {["ALL", ...floors].map((floor) => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${selectedFloor === floor
                ? "border-cyan-600 bg-cyan-600 text-white shadow-sm"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
            >
              {floor === "ALL" ? "Tất cả tầng" : ` ${floor}`}
            </button>
          ))}
        </div>

        {(searchTerm || selectedFloor !== "ALL") && (
          <button
            onClick={clearFilters}
            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Room grid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800">
              <Building2 className="h-4 w-4 text-cyan-600" />
              Danh Sách Phòng Khám
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Hoạt động
              </span>

              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                Sẵn sàng
              </span>

              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Bảo trì
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin" />
              Đang tải danh sách phòng...
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-14 text-center">
              <MapPin className="mx-auto mb-3 h-7 w-7 text-slate-300" />

              <p className="text-sm font-semibold text-slate-600">
                {error
                  ? "Không tải được danh sách phòng."
                  : "Không tìm thấy phòng phù hợp."}
              </p>

              {!error && (
                <p className="mt-1 text-xs text-slate-400">
                  Hãy thử từ khóa hoặc tầng khác.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
              {filteredRooms.map((room) => {
                const isSelected =
                  String(selectedRoom?.id) === String(room.id);

                const status = getStatusConfig(room.status);

                return (
                  <button
                    type="button"
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`flex h-36 flex-col justify-between rounded-xl border p-4 text-left transition ${isSelected
                      ? "border-cyan-500 bg-cyan-50 ring-2 ring-cyan-500/20 shadow-md"
                      : "border-slate-200 bg-white hover:border-cyan-300 hover:shadow-sm"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-bold text-cyan-700">
                          {room.code || room.name}
                        </span>

                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {room.name}
                        </p>

                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {room.department}
                        </p>
                      </div>

                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${status.color}`}
                        title={status.label}
                      />
                    </div>

                    <div className="flex items-end justify-between gap-2 border-t border-slate-100 pt-2">
                      <div className="min-w-0 text-[11px] text-slate-500">
                        <p className="flex items-center gap-1">
                          <Layers className="h-3 w-3 shrink-0 text-cyan-600" />
                          {room.floor
                            ? `${room.floor}`
                            : "Chưa xác định tầng"}
                        </p>

                        <p className="mt-1 flex items-center gap-1">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">{room.doctor}</span>
                        </p>
                      </div>

                      <MapPin className="h-4 w-4 shrink-0 text-cyan-600" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && (
            <div className="mt-3 text-xs text-slate-400">
              Hiển thị {filteredRooms.length} / {rooms.length} phòng
            </div>
          )}
        </div>

        {/* Room details */}
        <div className="space-y-4 lg:col-span-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
              <MapPin className="h-4 w-4 text-cyan-600" />
              Chi Tiết Vị Trí
            </h3>

            {selectedRoom ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <span className="text-xs font-bold uppercase text-slate-400">
                    Phòng khám
                  </span>

                  <p className="mt-1 text-base font-bold text-slate-900">
                    {selectedRoom.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Mã phòng:{" "}
                    <strong>{selectedRoom.code || "—"}</strong>
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Chuyên khoa:{" "}
                    <strong>{selectedRoom.department}</strong>
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Phòng khám:{" "}
                    <strong>{selectedRoom.clinicName || "—"}</strong>
                  </p>
                </div>

                <div className="space-y-2 rounded-xl border border-cyan-100 bg-cyan-50 p-3.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-cyan-800">
                    <Compass className="h-4 w-4 text-cyan-600" />
                    Hướng dẫn di chuyển
                  </span>

                  <p className="text-xs font-medium leading-relaxed text-slate-700">
                    {selectedRoom.directions ||
                      (selectedRoom.floor
                        ? `Tìm đến tầng ${selectedRoom.floor}${selectedRoom.area
                          ? `, khu vực ${selectedRoom.area}`
                          : ""
                        }, sau đó tìm phòng ${selectedRoom.code || selectedRoom.name
                        }.`
                        : "Chưa có hướng dẫn di chuyển cho phòng này.")}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs font-medium text-slate-500">
                    Trạng thái phòng
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusConfig(selectedRoom.status).badge
                      }`}
                  >
                    {getStatusConfig(selectedRoom.status).label}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-100 p-3">
                  <p className="text-xs text-slate-500">
                    Bác sĩ phụ trách
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedRoom.doctor}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-xs font-medium text-slate-400">
                <MapPin className="mx-auto mb-3 h-7 w-7 text-slate-300" />
                Vui lòng chọn một phòng để xem thông tin vị trí.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
              <Clock className="h-4 w-4 text-cyan-600" />
              Lưu ý
            </h3>

            <p className="text-xs leading-relaxed text-slate-500">
              Vị trí tầng và khu vực được lấy từ dữ liệu phòng khám.
              Nếu thông tin chưa được khai báo trong hệ thống, giao diện
              sẽ hiển thị trạng thái chưa xác định.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ClinicMapPage = ClinicMap;
export default ClinicMap;
