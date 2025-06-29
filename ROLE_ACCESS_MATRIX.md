# 🎯 MUN Website Role Access Matrix

## 📊 **Conference-Based Role System with Global God**

**Important**: This system uses **conference-based ownership** with a **global God role**. Anyone who signs up can create a conference and automatically becomes the **owner** of that conference. A user can be an owner in one conference but just a regular participant in another conference.

**God Role**: One email account (stored in `.env` file) automatically becomes **God** in ALL conferences with full owner rights. God cannot be removed from any conference.

## 🔐 **Role Hierarchy (Per Conference)**
```
God > Owner > Admin > Moderator > Chair > Delegate
```

## 🔐 **Role Definitions**

| Role | Description | Key Permissions | Key Limitations |
|------|-------------|-----------------|-----------------|
| **God** | Global administrator | Full control over ALL conferences | Cannot be removed from any conference |
| **Owner** | Conference creator | Full control over their conference | Cannot transfer ownership |
| **Admin** | Conference administrator | Everything except making others admin | Cannot make other users admin |
| **Moderator** | Message moderator | Message approval/rejection | Cannot manage users or control voting |
| **Chair** | Conference chair | Voting control, amendment review | Cannot moderate messages or view all message history |
| **Delegate** | Conference participant | Basic participation, voting, messaging | Cannot access administrative functions |

---

## 📋 **Detailed Access Matrix**

### 🏠 **Dashboard**
| Feature | God | Owner | Admin | Moderator | Chair | Delegate |
|---------|-----|-------|-------|-----------|-------|----------|
| View dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View conference stats | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View user info | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Access settings page | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| See all conferences | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Conference selector | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 👥 **People Management**
| Feature | God | Owner | Admin | Moderator | Chair | Delegate |
|---------|-----|-------|-------|-----------|-------|----------|
| View participants | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change user roles | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Remove users | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Make users admin | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cannot change God's role | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 💬 **Notes & Messaging**
| Feature | God | Owner | Admin | Moderator | Chair | Delegate |
|---------|-----|-------|-------|-----------|-------|----------|
| Send messages | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View personal chat history | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View pending messages | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve/reject messages | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View all message history (audit) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### 🗳️ **Voting System**
| Feature | God | Owner | Admin | Moderator | Chair | Delegate |
|---------|-----|-------|-------|-----------|-------|----------|
| Open voting | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Close voting | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Cast vote | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| View vote results | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

### 📄 **Amendment Management**
| Feature | God | Owner | Admin | Moderator | Chair | Delegate |
|---------|-----|-------|-------|-----------|-------|----------|
| View amendments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit amendments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Review/approve amendments | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

### 📊 **Contribution Tracking**
| Feature | God | Owner | Admin | Moderator | Chair | Delegate |
|---------|-----|-------|-------|-----------|-------|----------|
| View contributions | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Update contribution counts | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Set award winners | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

### 🗂️ **Database & Export**
| Feature | God | Owner | Admin | Moderator | Chair | Delegate |
|---------|-----|-------|-------|-----------|-------|----------|
| View conference data | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Download PDF reports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### ⚙️ **Conference Management**
| Feature | God | Owner | Admin | Moderator | Chair | Delegate |
|---------|-----|-------|-------|-----------|-------|----------|
| Create conference | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Join conference | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete conference | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update conference settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Access all conferences | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🔧 **Conference Creation & Management**

### **Creating Conferences**
- **Anyone with an account** can create a conference
- **Conference creator automatically becomes owner**
- **God is automatically added to all conferences**
- **Unique 6-character code generated for each conference**
- **Owner can invite others via conference code**

### **Joining Conferences**
- **Users join by entering conference code**
- **Default role is 'delegate'**
- **Owner can change roles after joining**
- **Users can be in multiple conferences with different roles**

### **Settings Access**
- **Only owners and God can access conference settings page**
- **Settings include: description, public join, approval requirements, max participants**
- **Owner and God can manage all participants and their roles**

### **God Special Privileges**
- **Automatically added to ALL conferences**
- **Cannot be removed from any conference**
- **Can see and access all conferences via dropdown/search**
- **Has owner rights in every conference**
- **Cannot have role changed by anyone**

---

## 🔧 **Technical Implementation**

### **Role Middleware Functions**
```javascript
// Role hierarchy: God > Owner > Admin > Moderator > Chair > Delegate

// Conference-based role checkers
const isGod = authorize('god');                                    // God only
const isOwner = authorize('god', 'owner');                        // God + Owner
const isAdmin = authorize('god', 'owner', 'admin');               // God + Owner + Admin
const isModerator = authorize('god', 'owner', 'admin', 'moderator'); // God + Owner + Admin + Moderator
const isChair = authorize('god', 'owner', 'admin', 'moderator', 'chair'); // God + Owner + Admin + Moderator + Chair
const isDelegate = authorize('god', 'owner', 'admin', 'moderator', 'chair', 'delegate'); // All roles

// Special permission checkers
const canModerateMessages = authorize('god', 'owner', 'admin', 'moderator');  // Only these can approve/reject messages
const canManageUsers = authorize('god', 'owner', 'admin');                    // Only God, owner and admin can manage users
const canMakeAdmin = authorize('god', 'owner');                               // Only God and owner can make others admin
const canManageSettings = authorize('god', 'owner');                          // Only God and owner can manage settings
const canAccessAllConferences = authorize('god');                             // Only God can see all conferences
```

### **Route Protection Examples**
```javascript
// Only God and owners can manage settings
router.get('/:conferenceId/settings', protect, canManageSettings, getConferenceSettings);

// Only God and owners can make others admin
router.patch('/:conferenceId/role', protect, canMakeAdmin, setUserRole);

// Only God can see all conferences
router.get('/all', protect, canAccessAllConferences, getAllConferences);

// Only God, owners and admins can manage users
router.post('/', protect, canManageUsers, addOrUpdateUserRole);

// Only moderators, admins, owners and God can approve/reject messages
router.patch('/:noteId/review', protect, canModerateMessages, reviewMessage);

// All roles can submit amendments
router.post('/', protect, submitAmendment);

// Only God, owners and chairs can review amendments
router.patch('/:amendmentId/review', protect, isGodOrOwnerOrChair, reviewAmendment);
```

---

## 🎯 **Role-Specific Responsibilities**

### **God (Global Administrator)**
- **Full control over ALL conferences** - Can do everything in every conference
- **Automatically added to all conferences** - No need to join manually
- **Cannot be removed** - Protected from removal in all conferences
- **Conference selector** - Can see and select from all conferences
- **Admin management** - Can make other users admin in any conference
- **All owner, moderator, chair, and delegate functions**

### **Owner (Conference Creator)**
- **Full conference control** - Can do everything in their conference
- **Admin management** - Can make other users admin
- **Conference settings** - Can update conference settings
- **User role management** - Can change any user's role (except God)
- **Amendment submission** - Can submit amendments like delegates
- **All moderator, chair, and delegate functions**

### **Admin (Conference Administrator)**
- **Full conference access** - Can do everything except make others admin
- **User management** - Can add/remove users and change roles (except God)
- **Amendment submission** - Can submit amendments like delegates
- **All moderator, chair, and delegate functions**
- **Cannot make other users admin**
- **Cannot manage conference settings**

### **Moderator (Message Moderator)**
- **Message moderation** - Approve/reject chat messages with reasons
- **View pending messages** - See all messages awaiting approval
- **Message audit** - View full message history
- **Amendment submission** - Can submit amendments
- **Cannot manage users, control voting, or review amendments**

### **Chair (Conference Chair)**
- **Voting session control** - Open/close voting sessions
- **Amendment review** - Approve/decline amendments
- **Contribution tracking** - Track delegate participation and awards
- **Amendment submission** - Can submit amendments
- **Cannot moderate messages, manage users, or view message history**

### **Delegate (Conference Participant)**
- **Submit amendments** - Create new amendments
- **Cast votes** - Participate in voting sessions
- **Send messages** - Communicate (subject to moderation)
- **View basic conference information**
- **Cannot access any administrative functions**

---

## 🔒 **Security Features**

1. **Conference-based Role Protection** - All routes are protected by appropriate middleware per conference
2. **Hierarchical Access** - Higher roles inherit permissions from lower roles
3. **Specific Permission Checks** - Special middleware for specific functions
4. **Audit Trail** - All actions are logged and traceable per conference
5. **Message Moderation** - All chat messages require approval from moderators
6. **Voting Integrity** - Only delegates can vote, only chairs can control voting
7. **Admin Protection** - Only God and owners can create new admins
8. **Settings Protection** - Only God and owners can access conference settings
9. **God Protection** - God cannot be removed from any conference
10. **Global Access Control** - Only God can see all conferences

---

## 📱 **Frontend UI Adaptation**

The frontend automatically adapts based on user role in the current conference:
- **Delegate UI**: Shows voting, messaging, amendment submission
- **Chair UI**: Adds voting control, amendment review, contribution tracking
- **Moderator UI**: Adds message moderation interface
- **Admin UI**: Adds user management, full conference access
- **Owner UI**: Adds settings page, admin creation, full access to all features
- **God UI**: Adds conference selector, global access, special God indicators

This ensures users only see and can access features appropriate to their role level in each conference.

---

## 🔄 **Key Differences**

### **God vs Owner**
- **God**: Can access ALL conferences, cannot be removed, global administrator
- **Owner**: Can only access their own conferences, can be removed by God

### **Owner vs Admin**
- **Owner**: Can make other users admin, manage conference settings
- **Admin**: Cannot make other users admin, cannot manage settings

### **Admin vs Moderator**
- **Admin**: Can manage users, access all data, control everything
- **Moderator**: Can only moderate messages, cannot manage users or control other functions

### **Moderator vs Chair**
- **Moderator**: Only handles message approval/rejection and can view all message history
- **Chair**: Only handles voting control and amendment review, cannot access message history

### **Chair vs Delegate**
- **Chair**: Can control voting, review amendments, track contributions
- **Delegate**: Can only participate in voting, submit amendments, send messages

---

## 🌐 **Multi-Conference Support**

- **Users can be in multiple conferences simultaneously**
- **Role is independent per conference**
- **Dashboard shows all user's conferences**
- **Settings access only for conferences where user is owner or God**
- **Conference switching via dashboard**
- **God can see and access ALL conferences via dropdown/search**

---

## 👑 **God Mode Features**

### **Dashboard Features**
- **God indicator badge** - Shows "👑 GOD MODE" with pulsing animation
- **Conference selector** - Dropdown with search to select any conference
- **All conferences visible** - Can see all conferences, not just joined ones

### **Special Protections**
- **Cannot be removed** - Automatically re-added if removed
- **Cannot have role changed** - Protected from role modifications
- **Global access** - Can access any conference settings
- **Special UI indicators** - Golden styling and crown emojis

### **Environment Configuration**
```env
# God Role Email (Global administrator)
GOD_EMAIL=admin@example.com
``` 