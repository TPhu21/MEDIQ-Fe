import { MOCK_ACCOUNTS } from "../mocks/mockAccounts";

// TODO: Replace mock authentication with Spring Boot Auth Service + JWT when backend is available.
export const mockAuthService = {
  login: async (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const found = MOCK_ACCOUNTS.find(
          (acc) => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
        );

        if (found) {
          const { password: _, ...userWithoutPassword } = found;
          const token = `mock-jwt-token-${userWithoutPassword.id}-${Date.now()}`;
          const authData = { user: userWithoutPassword, token };
          
          localStorage.setItem("mediq_user", JSON.stringify(authData));
          resolve(authData);
        } else {
          reject(new Error("Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!"));
        }
      }, 700);
    });
  },

  logout: () => {
    localStorage.removeItem("mediq_user");
  },

  getCurrentSession: () => {
    const data = localStorage.getItem("mediq_user");
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      localStorage.removeItem("mediq_user");
      return null;
    }
  }
};