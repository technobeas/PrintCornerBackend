function requireAdmin(req, res, next) {
  if (req.user.userRole !== "admin") {
    return res.status(403).json({ msg: "Admin access required" });
  }
  next();
}

module.exports = requireAdmin;
