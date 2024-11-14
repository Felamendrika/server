const checkPermissions = (requiredPermission) => {
  return async (req, res, next) => {
    // reccuperer les permission de l'utilisateur depui sessions JWT
    const permissions = req.user.permissions;

    if (!permissions.includes(requiredPermission)) {
      return res.status(403).json({
        succes: false,
        message: "Accès refusé. Permission insuffisante.",
      });
    }

    next();
  };
};

module.exports = { checkPermissions };
