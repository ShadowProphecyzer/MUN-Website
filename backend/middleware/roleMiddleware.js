// middleware/roleMiddleware.js

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }

    next();
  };
};

// Role hierarchy: Owner > Admin > Moderator > Chair > Delegate

// Specific role checkers with clear hierarchy
const isOwner = authorize('owner');                                    // Owner only
const isAdmin = authorize('owner', 'admin');                          // Owner + Admin
const isModerator = authorize('owner', 'admin', 'moderator');         // Owner + Admin + Moderator
const isChair = authorize('owner', 'admin', 'moderator', 'chair');    // Owner + Admin + Moderator + Chair
const isDelegate = authorize('owner', 'admin', 'moderator', 'chair', 'delegate'); // All roles

// Additional specific checkers for clarity
const isOwnerOrAdmin = authorize('owner', 'admin');
const isOwnerOrModerator = authorize('owner', 'moderator');
const isOwnerOrChair = authorize('owner', 'chair');
const isAdminOrModerator = authorize('admin', 'moderator');
const isModeratorOrChair = authorize('moderator', 'chair');
const isChairOrDelegate = authorize('chair', 'delegate');

// Special checkers for specific permissions
const canModerateMessages = authorize('owner', 'admin', 'moderator');  // Only these can approve/reject messages
const canManageUsers = authorize('owner', 'admin');                    // Only owner and admin can manage users
const canMakeAdmin = authorize('owner');                               // Only owner can make others admin

module.exports = {
  authorize,
  isOwner,
  isAdmin,
  isModerator,
  isChair,
  isDelegate,
  isOwnerOrAdmin,
  isOwnerOrModerator,
  isOwnerOrChair,
  isAdminOrModerator,
  isModeratorOrChair,
  isChairOrDelegate,
  canModerateMessages,
  canManageUsers,
  canMakeAdmin
};
