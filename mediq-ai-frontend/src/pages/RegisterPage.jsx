import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    Activity,
    Lock,
    Mail,
    User,
    Phone,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle,
    ArrowRight,
    KeyRound,
    RefreshCw,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";

export const RegisterPage = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const [otp, setOtp] = useState([
        "",
        "",
        "",
        "",
        "",
        "",
    ]);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const navigate = useNavigate();

    const {
        register,
        verifyRegister,
        resendRegisterOtp,
    } = useAuth();

    // ==============================
    // COUNTDOWN OTP
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
    // INPUT CHANGE
    // ==============================

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

        setError("");
    };

    // ==============================
    // REGISTER
    // ==============================

    const handleSendOtp = async (e) => {
        e.preventDefault();

        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError(
                "Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!"
            );
            return;
        }

        if (formData.password.length < 6) {
            setError(
                "Mật khẩu phải có ít nhất 6 ký tự!"
            );
            return;
        }

        setIsSubmitting(true);

        try {
            await register({
                fullName: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                password: formData.password,
            });

            // Backend đã gửi OTP
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
            console.error("Register error:", err);

            const status = err.response?.status;
            const message =
                err.response?.data?.message ||
                err.response?.data;

            if (status === 400) {
                setError(
                    message ||
                    "Thông tin đăng ký không hợp lệ."
                );
            } else if (status === 409) {
                setError(
                    message ||
                    "Email hoặc số điện thoại đã được sử dụng."
                );
            } else if (!err.response) {
                setError(
                    "Không thể kết nối đến hệ thống. Vui lòng thử lại."
                );
            } else {
                setError(
                    message ||
                    "Đăng ký thất bại. Vui lòng thử lại."
                );
            }
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
    // VERIFY REGISTER OTP
    // ==============================

    const handleVerifyAndRegister = async (e) => {
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
            await verifyRegister({
                email: formData.email.trim(),
                otp: otpCode,
            });

            setSuccess(true);

            setTimeout(() => {
                navigate("/login");
            }, 2000);

        } catch (err) {
            console.error(
                "Verify register OTP error:",
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
    // RESEND REGISTER OTP
    // ==============================

    const handleResendOtp = async () => {
        if (countdown > 0 || isSubmitting) {
            return;
        }

        setError("");
        setIsSubmitting(true);

        try {
            await resendRegisterOtp({
                email: formData.email.trim(),
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
                "Resend register OTP error:",
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 text-slate-800 flex flex-col justify-center items-center p-4 relative overflow-hidden">

            <div className="w-full max-w-lg relative z-10 my-8">

                {/* HEADER */}

                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center p-3 bg-cyan-500 rounded-2xl shadow-lg shadow-cyan-500/30 mb-3 text-white">
                        <Activity className="w-9 h-9 animate-pulse" />
                    </div>

                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        MEDIQ AI
                    </h1>

                    <p className="text-xs text-cyan-600 font-semibold tracking-wide mt-1 uppercase">
                        Tạo tài khoản người dùng mới
                    </p>
                </div>

                <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-xl">

                    <h2 className="text-xl font-bold text-slate-900 mb-6">
                        {step === 1
                            ? "Đăng ký tài khoản"
                            : "Xác thực Gmail qua OTP"}
                    </h2>

                    {/* ERROR */}

                    {error && (
                        <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

                            <span>{error}</span>
                        </div>
                    )}

                    {/* SUCCESS */}

                    {success && (
                        <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 shrink-0" />

                            <span>
                                Đăng ký tài khoản thành công!
                                Đang chuyển hướng về trang
                                Đăng nhập...
                            </span>
                        </div>
                    )}

                    {/* ================= STEP 1 ================= */}

                    {step === 1 && (
                        <form
                            onSubmit={handleSendOtp}
                            className="space-y-4"
                        >

                            {/* NAME */}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                    Họ và tên
                                </label>

                                <div className="relative">
                                    <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Nguyễn Văn An"
                                        autoComplete="name"
                                        className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white text-sm"
                                    />
                                </div>
                            </div>

                            {/* EMAIL + PHONE */}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Email
                                    </label>

                                    <div className="relative">
                                        <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="an.nguyen@mediq.ai"
                                            autoComplete="email"
                                            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        Số điện thoại
                                    </label>

                                    <div className="relative">
                                        <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="0912345678"
                                            autoComplete="tel"
                                            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white text-sm"
                                        />
                                    </div>
                                </div>

                            </div>

                            {/* PASSWORD */}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                    Mật khẩu
                                </label>

                                <div className="relative">
                                    <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                                    <input
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
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

                            {/* CONFIRM PASSWORD */}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                    Xác nhận mật khẩu
                                </label>

                                <div className="relative">
                                    <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                                    <input
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="confirmPassword"
                                        required
                                        value={
                                            formData.confirmPassword
                                        }
                                        onChange={handleChange}
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

                            {/* SUBMIT */}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition shadow-md shadow-cyan-600/20 disabled:opacity-50 mt-6"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>
                                            Nhận mã OTP
                                        </span>

                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                        </form>
                    )}

                    {/* ================= STEP 2 ================= */}

                    {step === 2 && !success && (
                        <form
                            onSubmit={handleVerifyAndRegister}
                            className="space-y-6"
                        >

                            <div className="text-center">

                                <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <KeyRound className="w-6 h-6" />
                                </div>

                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Mã xác thực OTP gồm 6 chữ số
                                    đã được gửi đến{" "}
                                    <b className="text-slate-800">
                                        {formData.email}
                                    </b>
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep(1);
                                        setError("");
                                    }}
                                    className="text-[11px] text-cyan-600 font-bold hover:underline mt-1"
                                >
                                    Sửa lại thông tin
                                </button>

                            </div>

                            {/* OTP */}

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
                                        className="w-11 h-12 text-center text-lg font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-cyan-500 focus:bg-white text-sm"
                                    />
                                ))}

                            </div>

                            {/* VERIFY */}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-2 transition shadow-md shadow-cyan-600/20 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <span>
                                        Hoàn tất Đăng ký
                                    </span>
                                )}
                            </button>

                            {/* RESEND */}

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
                                        disabled={isSubmitting}
                                        className="text-xs text-cyan-600 hover:underline font-bold inline-flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        Gửi lại mã OTP
                                    </button>
                                )}

                            </div>

                        </form>
                    )}

                    {/* FOOTER */}

                    <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-500">
                            Đã có tài khoản?{" "}
                            <Link
                                to="/login"
                                className="text-cyan-600 hover:underline font-bold"
                            >
                                Đăng nhập ngay
                            </Link>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};