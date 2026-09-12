export function useAuth() {
  return {
    user: { id: "1", role: "admin", name: "Admin User" },
    isLoading: false,
    isAuthenticated: true,
    error: null,
    login: () => {},
    logout: () => {}
  };
}
