
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  sendAiMessage,
  getAiConversations,
  getAiMessages,
  deleteAiConversation,
} from "../../api/aiApi";

const SPECIALTY_LABELS = {
  CAP_CUU: "Cấp cứu",
  NOI_TONG_QUAT: "Nội tổng quát",
  TIM_MACH: "Tim mạch",
  HO_HAP: "Hô hấp",
  TIEU_HOA: "Tiêu hóa",
  THAN_KINH: "Thần kinh",
  TAI_MUI_HONG: "Tai mũi họng",
  MAT: "Mắt",
  DA_LIEU: "Da liễu",
  CO_XUONG_KHOP: "Cơ xương khớp",
  NOI_TIET: "Nội tiết",
  TIET_NIEU: "Tiết niệu",
  SAN_PHU_KHOA: "Sản phụ khoa",
  RANG_HAM_MAT: "Răng hàm mặt",
  KHAC: "Khác",
  CHUA_XAC_DINH: "Chưa xác định",
};

const TRIAGE_LABELS = {
  LOW: "Mức độ thấp",
  MEDIUM: "Mức độ trung bình",
  HIGH: "Mức độ cao",
  EMERGENCY: "Cấp cứu",
};

const INITIAL_MESSAGE = {
  sender: "AI",
  content:
    "Xin chào! Tôi là trợ lý AI của MEDIQ-AI. Bạn hãy mô tả triệu chứng hoặc vấn đề sức khỏe mà bạn đang gặp phải.",
  question: "",
};

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatConversationDate = (date) => {
  if (!date) return "";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AiChatAndTriage = () => {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([{ ...INITIAL_MESSAGE }]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);

  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");

  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState("");
  const [showOtherDate, setShowOtherDate] = useState(false);

  const today = getLocalDateString();

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = getLocalDateString(tomorrowDate);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoadingHistory(true);
      const data = await getAiConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Không thể tải lịch sử trò chuyện:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    const message = input.trim();

    if (!message || loading) return;

    setError("");
    setSelectedAppointmentDate("");
    setShowOtherDate(false);

    setMessages((prev) => [
      ...prev,
      { sender: "PATIENT", content: message, question: "" },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await sendAiMessage(message, conversationId);

      setConversationId(response.conversationId);

      const analysis = response.analysis || null;

      setMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          content:
            response.message ||
            analysis?.reply ||
            "Tôi chưa nhận được phản hồi. Bạn vui lòng thử lại.",
          question: analysis?.question || "",
        },
      ]);

      setTriageResult(analysis);
      await loadConversations();
    } catch (err) {
      console.error("AI Chat Error:", err);

      setMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          content:
            "Xin lỗi, hệ thống AI đang gặp sự cố. Bạn vui lòng thử lại sau.",
          question: "",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setTriageResult(null);
    setInput("");
    setError("");
    setSelectedAppointmentDate("");
    setShowOtherDate(false);
    setMessages([{ ...INITIAL_MESSAGE }]);
    setShowHistory(false);
  };

  const handleSelectConversation = async (id) => {
    try {
      setLoadingHistory(true);
      const data = await getAiMessages(id);

      const formatted = (Array.isArray(data) ? data : []).map((item) => ({
        sender: item.sender,
        content: item.content,
        question: "",
      }));

      setMessages(
        formatted.length > 0 ? formatted : [{ ...INITIAL_MESSAGE }]
      );

      setConversationId(id);
      setTriageResult(null);
      setSelectedAppointmentDate("");
      setShowOtherDate(false);
      setShowHistory(false);
      setError("");
    } catch (err) {
      console.error("Không thể tải cuộc trò chuyện:", err);
      setError("Không thể tải cuộc trò chuyện này.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteConversation = async (id, event) => {
    event.stopPropagation();

    try {
      await deleteAiConversation(id);

      setConversations((prev) => prev.filter((item) => item.id !== id));

      if (conversationId === id) {
        handleNewConversation();
      }
    } catch (err) {
      console.error("Không thể xóa cuộc trò chuyện:", err);
      setError("Không thể xóa cuộc trò chuyện.");
    }
  };

  const getTriageClass = (level) => {
    const classes = {
      LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
      MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
      HIGH: "bg-orange-50 text-orange-700 border-orange-200",
      EMERGENCY: "bg-red-50 text-red-700 border-red-200",
    };

    return classes[level] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusClass = (status) => {
    if (status === "READY") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === "EMERGENCY") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  const getStatusLabel = (status) => {
    const labels = {
      READY: "Đã đủ thông tin",
      EMERGENCY: "Cần xử lý khẩn cấp",
      NEED_MORE_INFO: "Cần thêm thông tin",
    };

    return labels[status] || "Đang phân tích";
  };

  const handleGoToBooking = () => {
    if (
      !triageResult ||
      triageResult.status !== "READY" ||
      !triageResult.specialty ||
      triageResult.specialty === "CHUA_XAC_DINH"
    ) {
      return;
    }

    if (!selectedAppointmentDate) {
      setError("Vui lòng chọn ngày khám trước khi tiếp tục.");
      return;
    }

    if (selectedAppointmentDate < today) {
      setError("Ngày khám không được nằm trong quá khứ.");
      return;
    }

    navigate("/patient/booking", {
      state: {
        specialtyCode: triageResult.specialty,
        specialtyName:
          SPECIALTY_LABELS[triageResult.specialty] ||
          triageResult.specialty,
        symptoms: Array.isArray(triageResult.symptoms)
          ? triageResult.symptoms
          : [],
        reason:
          triageResult.summary ||
          (Array.isArray(triageResult.symptoms)
            ? triageResult.symptoms.join(", ")
            : ""),
        appointmentDate: selectedAppointmentDate,
        conversationId,
      },
    });
  };

  const canBook =
    triageResult?.status === "READY" &&
    triageResult?.specialty &&
    triageResult.specialty !== "CHUA_XAC_DINH";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      {showHistory && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/30"
            onClick={() => setShowHistory(false)}
          />

          <aside className="fixed inset-y-0 left-0 z-50 flex w-[330px] max-w-[88vw] flex-col border-r border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="font-semibold text-slate-800">
                  Lịch sử trò chuyện
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Các cuộc trò chuyện với AI
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="rounded-lg px-3 py-1 text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="border-b p-4">
              <button
                type="button"
                onClick={handleNewConversation}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                ＋ Cuộc trò chuyện mới
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {loadingHistory && (
                <p className="p-4 text-sm text-slate-500">
                  Đang tải lịch sử...
                </p>
              )}

              {!loadingHistory && conversations.length === 0 && (
                <p className="p-4 text-sm text-slate-500">
                  Chưa có cuộc trò chuyện.
                </p>
              )}

              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`group flex cursor-pointer items-center gap-3 rounded-xl p-3 ${conversation.id === conversationId
                      ? "bg-blue-50"
                      : "hover:bg-slate-50"
                    }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {conversation.title || "Cuộc trò chuyện mới"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatConversationDate(conversation.updatedAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    title="Xóa cuộc trò chuyện"
                    onClick={(event) =>
                      handleDeleteConversation(conversation.id, event)
                    }
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </aside>
        </>
      )}

      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white">
            🩺
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              AI tư vấn sức khỏe
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Mô tả triệu chứng để AI thu thập thông tin và đánh giá sơ bộ.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <section className="flex min-h-[650px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-8">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowHistory(true)}
                  className="rounded-xl px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"
                  title="Lịch sử trò chuyện"
                >
                  ☰
                </button>

                <div>
                  <h2 className="font-semibold text-slate-800">
                    MEDIQ-AI
                  </h2>
                  <p className="text-xs text-emerald-600">
                    ● Trợ lý AI
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNewConversation}
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200"
              >
                Cuộc trò chuyện mới
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/60 p-5">
              {messages.map((message, index) => {
                const isPatient = message.sender === "PATIENT";

                return (
                  <div
                    key={`${conversationId || "new"}-${index}`}
                    className={`flex ${isPatient ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 ${isPatient
                          ? "rounded-br-md bg-blue-600 text-white"
                          : message.error
                            ? "border border-red-100 bg-red-50 text-red-700"
                            : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                        }`}
                    >
                      <p className="whitespace-pre-line text-sm leading-6">
                        {message.content}
                      </p>

                      {message.sender === "AI" && message.question && (
                        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                          <p className="mb-1 text-xs font-semibold text-blue-600">
                            CÂU HỎI TIẾP THEO
                          </p>
                          <p className="text-sm leading-6 text-blue-800">
                            {message.question}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="text-sm text-slate-500">
                  🤖 AI đang phân tích...
                </div>
              )}
            </div>

            <div className="border-t p-4">
              <div className="flex items-end gap-2 rounded-2xl border bg-slate-50 p-2 focus-within:border-blue-400">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Mô tả triệu chứng của bạn..."
                  rows={2}
                  disabled={loading}
                  className="min-h-[54px] flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? "Đang gửi..." : "Gửi ➤"}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Enter để gửi · Shift + Enter để xuống dòng
              </p>
            </div>
          </section>

          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-4">
            <div className="border-b p-5">
              <h2 className="font-semibold text-slate-800">
                Kết quả đánh giá
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Phân tích sơ bộ từ AI
              </p>
            </div>

            <div className="space-y-6 p-5">
              {!triageResult && (
                <p className="py-12 text-center text-sm leading-6 text-slate-400">
                  Hãy trao đổi với AI về triệu chứng của bạn. Kết quả sẽ
                  xuất hiện tại đây.
                </p>
              )}

              {triageResult && (
                <>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                      Trạng thái
                    </p>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                        triageResult.status
                      )}`}
                    >
                      {getStatusLabel(triageResult.status)}
                    </span>
                  </div>

                  {triageResult.status === "EMERGENCY" && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                      ⚠️ Các triệu chứng có thể cần xử lý khẩn cấp. Hãy gọi
                      cấp cứu hoặc đến cơ sở cấp cứu gần nhất nếu có dấu hiệu
                      nguy hiểm. Không chờ đặt lịch khám trực tuyến.
                    </div>
                  )}

                  {triageResult.triageLevel && (
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                        Mức độ đánh giá
                      </p>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${getTriageClass(
                          triageResult.triageLevel
                        )}`}
                      >
                        {TRIAGE_LABELS[triageResult.triageLevel] ||
                          triageResult.triageLevel}
                      </span>
                    </div>
                  )}

                  {triageResult.specialty &&
                    triageResult.specialty !== "CHUA_XAC_DINH" && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                          Chuyên khoa phù hợp
                        </p>
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 font-semibold text-blue-800">
                          🏥{" "}
                          {SPECIALTY_LABELS[triageResult.specialty] ||
                            triageResult.specialty}
                        </div>
                      </div>
                    )}

                  {triageResult.symptoms?.length > 0 && (
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase text-slate-400">
                        Triệu chứng ghi nhận
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {triageResult.symptoms.map((symptom, index) => (
                          <span
                            key={`${symptom}-${index}`}
                            className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs text-blue-700"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {triageResult.status === "READY" &&
                    triageResult.possibleConditions?.length > 0 && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase text-slate-400">
                          Khả năng có thể liên quan
                        </p>
                        <ul className="space-y-2">
                          {triageResult.possibleConditions.map(
                            (condition, index) => (
                              <li
                                key={`${condition}-${index}`}
                                className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700"
                              >
                                {index + 1}. {condition}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {triageResult.summary && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                        Tóm tắt
                      </p>
                      <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                        {triageResult.summary}
                      </p>
                    </div>
                  )}

                  {canBook && (
                    <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <div>
                        <h3 className="font-semibold text-blue-900">
                          Bạn muốn khám vào ngày nào?
                        </h3>
                        <p className="mt-1 text-sm leading-5 text-blue-700">
                          Chọn ngày mong muốn. Hệ thống sẽ kiểm tra khung
                          giờ còn trống ở bước tiếp theo.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAppointmentDate(today);
                            setShowOtherDate(false);
                            setError("");
                          }}
                          className={`rounded-xl border px-3 py-3 text-sm font-semibold ${selectedAppointmentDate === today
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-blue-200 bg-white text-blue-800 hover:bg-blue-100"
                            }`}
                        >
                          Hôm nay
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAppointmentDate(tomorrow);
                            setShowOtherDate(false);
                            setError("");
                          }}
                          className={`rounded-xl border px-3 py-3 text-sm font-semibold ${selectedAppointmentDate === tomorrow
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-blue-200 bg-white text-blue-800 hover:bg-blue-100"
                            }`}
                        >
                          Ngày mai
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowOtherDate((prev) => !prev)}
                        className="text-sm font-medium text-blue-700 underline"
                      >
                        {showOtherDate ? "Ẩn lịch chọn ngày" : "Chọn ngày khác"}
                      </button>

                      {showOtherDate && (
                        <input
                          type="date"
                          min={today}
                          value={selectedAppointmentDate}
                          onChange={(event) => {
                            setSelectedAppointmentDate(event.target.value);
                            setError("");
                          }}
                          className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm"
                        />
                      )}

                      {selectedAppointmentDate && (
                        <p className="text-sm text-blue-800">
                          Ngày khám đã chọn:{" "}
                          <strong>
                            {new Date(
                              `${selectedAppointmentDate}T00:00:00`
                            ).toLocaleDateString("vi-VN")}
                          </strong>
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={handleGoToBooking}
                        disabled={!selectedAppointmentDate}
                        className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        Chọn bác sĩ và khung giờ
                      </button>
                    </div>
                  )}

                  {triageResult.status === "READY" && (
                    <p className="text-xs leading-5 text-slate-500">
                      Đây là đánh giá sơ bộ, không thay thế chẩn đoán của
                      bác sĩ. Nếu xuất hiện dấu hiệu nguy hiểm, hãy tìm
                      kiếm trợ giúp y tế ngay.
                    </p>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AiChatAndTriage;
