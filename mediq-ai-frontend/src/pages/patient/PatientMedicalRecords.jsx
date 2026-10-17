import React, { useEffect, useState } from "react";

import {
  Activity,
  Calendar,
  ClipboardList,
  FileText,
  Loader2,
  Stethoscope,
  AlertCircle,
} from "lucide-react";

import {
  getMyPatient,
  getMyMedicalRecords,
} from "../../api/patientApi";

export const PatientMedicalRecords = () => {

  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMedicalRecords();
  }, []);

  const loadMedicalRecords = async () => {

    try {

      setLoading(true);
      setError("");

      // =========================
      // 1. LẤY THÔNG TIN BỆNH NHÂN
      // =========================

      const patientData = await getMyPatient();

      setPatient(patientData);

      // =========================
      // 2. LẤY HỒ SƠ BỆNH ÁN
      // =========================

      const recordsData =
        await getMyMedicalRecords(patientData.id);

      // Mới nhất lên đầu
      const sortedRecords = [...(recordsData || [])]
        .sort((a, b) => {

          if (!a.recordDate) return 1;
          if (!b.recordDate) return -1;

          return (
            new Date(b.recordDate) -
            new Date(a.recordDate)
          );
        });

      setRecords(sortedRecords);

    } catch (err) {

      console.error(
        "Lỗi tải hồ sơ bệnh án:",
        err
      );

      setError(
        err?.response?.data?.message ||
        "Không thể tải hồ sơ bệnh án."
      );

    } finally {

      setLoading(false);

    }
  };

  const formatDate = (date) => {

    if (!date) {
      return "Chưa cập nhật";
    }

    try {

      return new Date(date).toLocaleDateString(
        "vi-VN",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );

    } catch {

      return date;

    }
  };

  const getStatusStyle = (status) => {

    switch (status) {

      case "Hoàn thành":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "Đang khám":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "Chờ khám":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "Chờ kết quả":
        return "bg-purple-50 text-purple-700 border-purple-200";

      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {

    return (
      <div className="space-y-6">

        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Hồ Sơ Bệnh Án Điện Tử (EMR)
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Xem lịch sử khám và điều trị của bạn
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center">

          <Loader2
            size={32}
            className="animate-spin text-cyan-600 mb-3"
          />

          <p className="text-sm text-slate-500">
            Đang tải hồ sơ bệnh án...
          </p>

        </div>

      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {

    return (
      <div className="space-y-6">

        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Hồ Sơ Bệnh Án Điện Tử (EMR)
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Xem lịch sử khám và điều trị của bạn
          </p>
        </div>

        <div className="bg-white border border-red-200 rounded-2xl p-8">

          <div className="flex items-center gap-3 text-red-600">

            <AlertCircle size={22} />

            <div>
              <p className="font-semibold">
                Không thể tải dữ liệu
              </p>

              <p className="text-sm text-red-500 mt-1">
                {error}
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={loadMedicalRecords}
            className="mt-5 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 transition"
          >
            Thử lại
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* =========================
                TITLE
            ========================= */}

      <div>

        <h1 className="text-xl font-bold text-slate-900">
          Hồ Sơ Bệnh Án Điện Tử (EMR)
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Xem lịch sử khám và điều trị của bạn
        </p>

      </div>


      {/* =========================
                PATIENT INFO
            ========================= */}

      {patient && (

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">

              <ClipboardList size={23} />

            </div>

            <div className="flex-1">

              <p className="text-xs text-slate-500 font-semibold">
                BỆNH NHÂN
              </p>

              <h2 className="text-base font-bold text-slate-900">
                {patient.fullName || "Chưa cập nhật"}
              </h2>

            </div>

            <div className="text-right">

              <p className="text-xs text-slate-400">
                Mã bệnh nhân
              </p>

              <p className="text-sm font-mono font-bold text-cyan-700">
                {patient.patientCode || "—"}
              </p>

            </div>

          </div>

        </div>

      )}


      {/* =========================
                TITLE RECORD
            ========================= */}

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2">

          <FileText
            size={18}
            className="text-cyan-600"
          />

          <h2 className="text-sm font-bold text-slate-800">
            Lịch sử khám bệnh
          </h2>

        </div>

        <span className="text-xs font-semibold text-slate-500">
          {records.length} hồ sơ
        </span>

      </div>


      {/* =========================
                EMPTY
            ========================= */}

      {records.length === 0 ? (

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-12 text-center">

          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">

            <FileText
              size={26}
              className="text-slate-400"
            />

          </div>

          <h3 className="text-sm font-bold text-slate-800">
            Chưa có hồ sơ bệnh án
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Lịch sử khám bệnh của bạn sẽ hiển thị tại đây.
          </p>

        </div>

      ) : (

        <div className="space-y-4">

          {records.map((rec) => (

            <div
              key={rec.id}
              className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5"
            >

              {/* HEADER */}

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-100">

                <div className="flex items-start gap-3">

                  <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">

                    <Stethoscope size={20} />

                  </div>

                  <div>

                    <span className="text-xs font-mono font-bold text-cyan-700">
                      EMR-{rec.id}
                    </span>

                    <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                      {rec.diagnosis ||
                        "Chưa có chẩn đoán"}
                    </h3>

                  </div>

                </div>


                <div className="flex items-center gap-3">

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">

                    <Calendar size={14} />

                    <span>
                      {formatDate(
                        rec.recordDate
                      )}
                    </span>

                  </div>

                  {rec.status && (

                    <span
                      className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusStyle(
                        rec.status
                      )}`}
                    >
                      {rec.status}
                    </span>

                  )}

                </div>

              </div>


              {/* CONTENT */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">

                {/* TRIỆU CHỨNG */}

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">

                  <div className="flex items-center gap-2 mb-2">

                    <Activity
                      size={15}
                      className="text-cyan-600"
                    />

                    <span className="text-xs text-slate-500 font-semibold">
                      Triệu chứng
                    </span>

                  </div>

                  <p className="text-sm text-slate-700 font-medium leading-relaxed">
                    {rec.symptoms ||
                      "Chưa cập nhật"}
                  </p>

                </div>


                {/* CHẨN ĐOÁN */}

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">

                  <div className="flex items-center gap-2 mb-2">

                    <FileText
                      size={15}
                      className="text-cyan-600"
                    />

                    <span className="text-xs text-slate-500 font-semibold">
                      Chẩn đoán
                    </span>

                  </div>

                  <p className="text-sm text-slate-700 font-medium leading-relaxed">
                    {rec.diagnosis ||
                      "Chưa cập nhật"}
                  </p>

                </div>


                {/* ĐIỀU TRỊ */}

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">

                  <div className="flex items-center gap-2 mb-2">

                    <Stethoscope
                      size={15}
                      className="text-cyan-600"
                    />

                    <span className="text-xs text-slate-500 font-semibold">
                      Điều trị
                    </span>

                  </div>

                  <p className="text-sm text-slate-700 font-medium leading-relaxed">
                    {rec.treatment ||
                      "Chưa cập nhật"}
                  </p>

                </div>

              </div>


              {/* FOOTER */}

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">

                <div className="text-xs text-slate-400">
                  Mã hồ sơ:{" "}
                  <span className="font-mono font-semibold text-slate-600">
                    EMR-{rec.id}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">

                  <Activity size={13} />

                  Hồ sơ điện tử

                </div>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
};

export default PatientMedicalRecords;