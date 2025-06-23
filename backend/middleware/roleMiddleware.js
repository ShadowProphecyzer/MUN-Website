// middleware/roleMiddleware.js

// Middleware to restrict access by user role(s)
exports.roleCheck = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // req.user.roles is an array of user roles across conferences? 
    // We should get user role for current conference from req params or user context.
    // For simplicity, assume req.user.currentRole is set (you will have to set this in your auth flow)

    // For this project, role is per conference, so in controllers/routes check that userRole matches conference.

    // For middleware here, if req.user.currentRole is set to role for current conference:
    const userRole = req.user.currentRole; // e.g. 'owner', 'editor', 'chair', 'delegate', 'moderator'

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied: insufficient role' });
    }

    next();
  };
};
