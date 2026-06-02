const AppError = require("../utils/AppError");

/**
 * roleMiddleware — RBAC gate factory.
 * Use after authMiddleware.
 *
 * @param {...string} allowedRoles — roles permitted to access the route
 *
 * Usage:
 *   router.get('/admin', authMiddleware, roleMiddleware('company_admin', 'super_admin'), handler)
 */
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Unauthenticated. Please log in.", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This resource requires one of: [${allowedRoles.join(", ")}]`,
          403
        )
      );
    }

    next();
  };
};

/**
 * tenantGuard — ensures the requesting user belongs to
 * the same tenant as the resource being accessed.
 *
 * Reads tenantId from req.params.tenantId or req.body.tenantId.
 */
const tenantGuard = (req, res, next) => {
  const resourceTenantId =
    req.params.tenantId || req.body.tenantId || req.query.tenantId;

  // Super admins bypass tenant isolation
  if (req.user.role === "super_admin") return next();

  if (!resourceTenantId) return next(); // no tenant context to check

  if (req.user.tenantId !== resourceTenantId) {
    return next(new AppError("Cross-tenant access is forbidden.", 403));
  }

  next();
};

module.exports = { roleMiddleware, tenantGuard };