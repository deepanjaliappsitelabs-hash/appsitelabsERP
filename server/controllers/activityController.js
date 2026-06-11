const ActivityLog = require("../models/ActivityLog");

const getMyActivity = async (req, res) => {
  try {
    const userId = req.query.userId || req.user.id;
    const [loginHistory, activities] = await Promise.all([
      ActivityLog.getLoginHistory(userId),
      ActivityLog.getActivities(userId),
    ]);
    res.json({ success: true, data: { loginHistory, activities } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyActivity };
