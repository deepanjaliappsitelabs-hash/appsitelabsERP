function getStoredUser() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export default getStoredUser;
