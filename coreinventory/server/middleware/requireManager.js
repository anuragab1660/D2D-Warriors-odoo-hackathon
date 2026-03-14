module.exports = function requireManager(req, res, next) {
  if (req.user?.role !== 'manager') {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
};
