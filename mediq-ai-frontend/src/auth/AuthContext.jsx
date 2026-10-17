import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  login as loginApi,
  register as registerApi,
  getCurrentUser,
  verifyRegister as verifyRegisterApi,
  forgotPassword as forgotPasswordApi,
  verifyForgotPassword as verifyForgotPasswordApi,
  resetPassword as resetPasswordApi,
  resendRegisterOtp as resendRegisterOtpApi,
  changePassword as changePasswordApi,
  updateProfile as updateProfileApi,
} from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==============================
  // KHÔI PHỤC SESSION
  // ==============================

  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (!savedToken) {
      setLoading(false);
      return;
    }

    setToken(savedToken);

    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ==============================
  // LOGIN
  // ==============================

  const login = async (email, password) => {
    setLoading(true);

    try {
      const authData = await loginApi({
        email,
        password,
      });

      console.log("LOGIN RESPONSE:", authData);

      // Backend trả về accessToken, không phải token
      const accessToken = authData.accessToken;

      if (!accessToken) {
        throw new Error(
          "Đăng nhập thành công nhưng không nhận được JWT."
        );
      }

      // Lưu JWT
      localStorage.setItem("token", accessToken);

      // Lưu token vào state
      setToken(accessToken);

      // LoginResponse trả thông tin user trực tiếp
      const loggedUser = {
        id: authData.id,
        fullName: authData.fullName,
        email: authData.email,
        phone: authData.phone,
        role: authData.role,
        status: authData.status,
        avatarUrl: authData.avatarUrl,
      };

      setUser(loggedUser);

      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // REGISTER
  // ==============================

  const register = async (data) => {
    setLoading(true);

    try {
      return await registerApi(data);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // VERIFY REGISTER OTP
  // ==============================

  const verifyRegister = async (data) => {
    setLoading(true);

    try {
      return await verifyRegisterApi(data);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // RESEND REGISTER OTP
  // ==============================

  const resendRegisterOtp = async (data) => {
    setLoading(true);

    try {
      return await resendRegisterOtpApi(data);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // FORGOT PASSWORD
  // ==============================

  const forgotPassword = async (data) => {
    setLoading(true);

    try {
      return await forgotPasswordApi(data);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // VERIFY FORGOT PASSWORD
  // ==============================

  const verifyForgotPassword = async (data) => {
    setLoading(true);

    try {
      return await verifyForgotPasswordApi(data);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // RESET PASSWORD
  // ==============================

  const resetPassword = async (data) => {
    setLoading(true);

    try {
      return await resetPasswordApi(data);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // CHANGE PASSWORD
  // ==============================

  const changePassword = async ({
    currentPassword,
    newPassword,
  }) => {
    try {
      const response = await changePasswordApi({
        currentPassword,
        newPassword,
      });

      return response;
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  };

  // ==============================
  // UPDATE PROFILE
  // ==============================

  const updateProfile = async ({
    fullName,
    phone,
    avatar,
  }) => {
    try {
      const updatedUser = await updateProfileApi({
        fullName,
        phone,
        avatar,
      });

      setUser(updatedUser);

      return updatedUser;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  };

  // ==============================
  // REFRESH USER
  // ==============================

  // Chỉ dùng khi cần lấy lại thông tin user
  // Ví dụ: Profile page
  const refreshUser = async () => {
    const currentUser = await getCurrentUser();

    setUser(currentUser);

    return currentUser;
  };

  // ==============================
  // LOGOUT
  // ==============================

  const logout = () => {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,

        login,
        logout,

        register,
        verifyRegister,
        resendRegisterOtp,

        forgotPassword,
        verifyForgotPassword,
        resetPassword,

        changePassword,
        updateProfile,

        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth phải được sử dụng trong AuthProvider"
    );
  }

  return context;
};