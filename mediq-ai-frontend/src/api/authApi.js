import axiosClient from "./axiosClient";

// ==============================
// REGISTER
// ==============================

export const register = async ({
    fullName,
    email,
    phone,
    password,
}) => {
    const response = await axiosClient.post(
        "/api/auth/register",
        {
            fullName,
            email,
            phone,
            password,
        }
    );

    return response.data;
};

// ==============================
// LOGIN
// ==============================

export const login = async ({
    email,
    password,
}) => {
    const response = await axiosClient.post(
        "/api/auth/login",
        {
            email,
            password,
        }
    );

    return response.data;
};

// ==============================
// GET CURRENT USER
// ==============================

export const getCurrentUser = async () => {
    const response = await axiosClient.get(
        "/api/auth/me"
    );

    return response.data;
};

// ==============================
// VERIFY REGISTER OTP
// ==============================

export const verifyRegister = async ({
    email,
    otp,
}) => {
    const response = await axiosClient.post(
        "/api/auth/verify-register",
        {
            email,
            otp,
        }
    );

    return response.data;
};

// ==============================
// RESEND REGISTER OTP
// ==============================

export const resendRegisterOtp = async ({
    email,
}) => {
    const response = await axiosClient.post(
        "/api/auth/resend-register-otp",
        {
            email,
        }
    );

    return response.data;
};

// ==============================
// FORGOT PASSWORD
// ==============================

export const forgotPassword = async ({
    email,
}) => {
    const response = await axiosClient.post(
        "/api/auth/forgot-password",
        {
            email,
        }
    );

    return response.data;
};

// ==============================
// VERIFY FORGOT PASSWORD OTP
// ==============================

export const verifyForgotPassword = async ({
    email,
    otp,
}) => {
    const response = await axiosClient.post(
        "/api/auth/verify-forgot-password",
        {
            email,
            otp,
        }
    );

    return response.data;
};

// ==============================
// RESET PASSWORD
// ==============================

export const resetPassword = async ({
    email,
    newPassword,
}) => {
    const response = await axiosClient.post(
        "/api/auth/reset-password",
        {
            email,
            newPassword,
        }
    );

    return response.data;
};

// UPDATE PROFILE
export const updateProfile = async ({
    fullName,
    phone,
    avatar,
}) => {
    const formData = new FormData();

    formData.append("fullName", fullName);
    formData.append("phone", phone);

    if (avatar) {
        formData.append("avatar", avatar);
    }

    const response = await axiosClient.put(
        "/api/auth/me",
        formData
    );

    return response.data;
};

// CHANGE PASSWORD
export const changePassword = async ({
    currentPassword,
    newPassword,
}) => {
    const response = await axiosClient.post(
        "/api/auth/change-password",
        {
            currentPassword,
            newPassword,
        }
    );

    return response.data;
};