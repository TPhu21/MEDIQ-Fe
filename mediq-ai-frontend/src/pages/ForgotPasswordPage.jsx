import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  Mail,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Send,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";

export const ForgotPasswordPage = () => {
  // 1 = Email
  // 2 = OTP
  // 3 = Password mới
  // 4 = Thành công
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  const {
    forgotPassword,
    verifyForgotPassword,
    resetPassword,
  } = useAuth();

  // ==============================
  // COUNTDOWN
  // ==============================

  useEffect(() => {
    let timer;

    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [step, countdown]);

  // ==============================
  // SEND OTP
  // ==============================

  const handleSendOtp = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError(
        "Vui lòng nhập địa chỉ email của bạn!"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await forgotPassword({
        email: email.trim(),
      });

      setStep(2);

      // OTP backend có hiệu lực 2 phút
      setCountdown(120);

      setOtp([
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

    } catch (err) {
      console.error(
        "Forgot password error:",
        err
      );

      const message =
        err.response?.data?.message ||
        err.response?.data;

      setError(
        message ||
        "Không thể gửi mã OTP. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================
  // OTP CHANGE
  // ==============================

  const handleOtpChange = (element, index) => {
    const value = element.value;

    if (!/^\d?$/.test(value)) {
      return;
    }

    const newOtp = [...otp];

    newOtp[index] = value;

    setOtp(newOtp);
    setError("");

    if (
      value !== "" &&
      element.nextElementSibling
    ) {
      element.nextElementSibling.focus();
    }
  };

  // ==============================
  // OTP BACKSPACE
  // ==============================

  const handleOtpKeyDown = (e, index) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      e.currentTarget.previousElementSibling
    ) {
      e.currentTarget.previousElementSibling.focus();
    }
  };

  // ==============================
  // VERIFY OTP
  // ==============================

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError("");

    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError(
        "Vui lòng nhập đủ 6 chữ số mã OTP!"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await verifyForgotPassword({
        email: email.trim(),
        otp: otpCode,
      });

      setStep(3);

    } catch (err) {
      console.error(
        "Verify forgot password OTP error:",
        err
      );

      const message =
        err.response?.data?.message ||
        err.response?.data;

      setError(
        message ||
        "OTP không chính xác hoặc đã hết hạn."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================
  // RESEND OTP
  // ==============================

  const handleResendOtp = async () => {
    if (countdown > 0 || isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await forgotPassword({
        email: email.trim(),
      });

      setOtp([
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      setCountdown(120);

    } catch (err) {
      console.error(
        "Resend forgot password OTP error:",
        err
      );

      const message =
        err.response?.data?.message ||
        err.response?.data;

      setError(
        message ||
        "Không thể gửi lại OTP. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================
  // RESET PASSWORD
  // ==============================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");

    if (newPassword.length < 6) {
      setError(
        "Mật khẩu mới phải có ít nhất 6 ký tự!"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({
        email: email.trim(),
        newPassword,
      });

      setStep(4);

      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (err) {
      console.error(
        "Reset password error:",
        err
      );

      const message =
        err.response?.data?.message ||
        err.response?.data;

      setError(
        message ||
        "Không thể đặt lại mật khẩu. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 text-slate-800 flex flex-col justify-center items-center p-4 relative overflow-hidden">

      {/* BACKGROUND */}

      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">

        {/* HEADER */}

        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center p-3 bg-cyan-500 rounded-2xl shadow-lg shadow-cyan-500/30 mb-4 text-white">
            <Activity className="w-10 h-10 animate-pulse" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            MEDIQ AI
          </h1>

          <p className="text-sm text-cyan-600 font-semibold tracking-wide mt-1 uppercase">
            Khôi phục truy cập hệ thống
          </p>

        </div>

        {/* CARD */}

        <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-xl">

          {/* ERROR */}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-3">

              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

              <span>{error}</span>

            </div>
          )}

          {/* ================= STEP 1 ================= */}

          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Quên mật khẩu?
              </h2>

              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Nhập địa chỉ email đã đăng ký.
                MEDIQ AI sẽ gửi mã xác thực
                OTP gồm 6 chữ số đến hòm thư
                của bạn.
              </p>

              <form
                onSubmit={handleSendOtp}
                className="space-y-5"
              >

                <div>

                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Email đã đăng ký
                  </label>

                  <div className="relative">

                    <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(
                          e.target.value
                        );
                        setError("");
                      }}
                      placeholder="name@mediq.ai"
                      autoComplete="email"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white text-sm"
                    />

                  </div>

                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition shadow-md shadow-cyan-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>
                        Gửi mã xác nhận OTP
                      </span>

                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>
            </>
          )}

          {/* ================= STEP 2 ================= */}

          {step === 2 && (
            <>
              <div className="text-center mb-6">

                <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>

                <h2 className="text-xl font-bold text-slate-900">
                  Xác nhận mã OTP
                </h2>

                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Mã OTP gồm 6 chữ số đã được
                  gửi đến{" "}
                  <b className="text-slate-800">
                    {email}
                  </b>
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError("");
                  }}
                  className="text-[11px] text-cyan-600 font-bold hover:underline mt-1 inline-block"
                >
                  Đổi email khác
                </button>

              </div>

              <form
                onSubmit={handleVerifyOtp}
                className="space-y-6"
              >

                <div className="flex justify-between gap-2">

                  {otp.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={data}
                      onChange={(e) =>
                        handleOtpChange(
                          e.target,
                          index
                        )
                      }
                      onKeyDown={(e) =>
                        handleOtpKeyDown(
                          e,
                          index
                        )
                      }
                      onFocus={(e) =>
                        e.target.select()
                      }
                      className="w-11 h-12 text-center text-lg font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  ))}

                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition shadow-md shadow-cyan-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>
                      Xác nhận OTP
                    </span>
                  )}
                </button>

                <div className="text-center pt-2">

                  {countdown > 0 ? (
                    <p className="text-xs text-slate-400 font-medium">
                      Gửi lại mã sau{" "}
                      <b className="text-cyan-600 font-mono">
                        {countdown}s
                      </b>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={
                        handleResendOtp
                      }
                      disabled={
                        isSubmitting
                      }
                      className="text-xs text-cyan-600 hover:underline font-bold inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Gửi lại mã OTP mới
                    </button>
                  )}

                </div>

              </form>
            </>
          )}

          {/* ================= STEP 3 ================= */}

          {step === 3 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Đặt lại mật khẩu mới
              </h2>

              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Tạo mật khẩu mới cho tài khoản{" "}
                <b className="text-slate-800">
                  {email}
                </b>.
              </p>

              <form
                onSubmit={handleResetPassword}
                className="space-y-4"
              >

                {/* PASSWORD */}

                <div>

                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Mật khẩu mới
                  </label>

                  <div className="relative">

                    <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(
                          e.target.value
                        );
                        setError("");
                      }}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full pl-11 pr-11 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white text-sm"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>

                  </div>

                </div>

                {/* CONFIRM */}

                <div>

                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Xác nhận mật khẩu mới
                  </label>

                  <div className="relative">

                    <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      required
                      value={
                        confirmPassword
                      }
                      onChange={(e) => {
                        setConfirmPassword(
                          e.target.value
                        );
                        setError("");
                      }}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full pl-11 pr-11 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white text-sm"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>

                  </div>

                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition shadow-md shadow-cyan-600/20 disabled:opacity-50 mt-6"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>
                      Cập nhật mật khẩu
                    </span>
                  )}
                </button>

              </form>
            </>
          )}

          {/* ================= STEP 4 ================= */}

          {step === 4 && (
            <div className="text-center space-y-4 py-2">

              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Đổi mật khẩu thành công!
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">
                Mật khẩu tài khoản của bạn đã
                được cập nhật an toàn. Hệ thống
                sẽ tự động chuyển về trang Đăng
                nhập sau giây lát...
              </p>

              <Link
                to="/login"
                className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition shadow-md shadow-cyan-600/20 text-xs inline-block"
              >
                Đăng nhập ngay
              </Link>

            </div>
          )}

          {/* FOOTER */}

          {step !== 4 && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">

              <Link
                to="/login"
                className="text-xs text-cyan-600 hover:underline font-bold inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại trang Đăng nhập
              </Link>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};