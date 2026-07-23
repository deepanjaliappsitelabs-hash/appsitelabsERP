import api from "./api";

export const getMyActivity = async (userId) => {
  const res = await api.get("/activity/my", { params: { userId } });
  return res.data?.data ?? { loginHistory: [], activities: [] };
};
