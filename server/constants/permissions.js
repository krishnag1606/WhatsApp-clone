// Permission bitfield. A Role stores a single integer (`permissions`); each
// flag is one bit. Kept small on purpose (see CLAUDE.md). Authoritative
// enforcement happens in middleware in Phase 4 — Phase 1 only seeds roles.

export const Permissions = {
  VIEW_CHANNELS: 1 << 0,
  SEND_MESSAGES: 1 << 1,
  CREATE_POLLS: 1 << 2,
  POST_ANNOUNCEMENTS: 1 << 3,
  MANAGE_MESSAGES: 1 << 4,
  KICK: 1 << 5,
  BAN: 1 << 6,
  MUTE: 1 << 7,
  MANAGE_CHANNELS: 1 << 8,
  MANAGE_ROLES: 1 << 9,
  MANAGE_COMMUNITY: 1 << 10,
};

const P = Permissions;

// All flags OR'd together — the Owner role.
export const ALL_PERMISSIONS = Object.values(P).reduce((acc, bit) => acc | bit, 0);

export const MEMBER_PERMISSIONS =
  P.VIEW_CHANNELS | P.SEND_MESSAGES | P.CREATE_POLLS;

export const MODERATOR_PERMISSIONS =
  MEMBER_PERMISSIONS | P.MANAGE_MESSAGES | P.KICK | P.MUTE;

// Default roles seeded when a community is created. `position` orders them
// (higher = more authority). Owner is assigned to the creator's membership.
export const DEFAULT_ROLES = [
  { name: "Owner", color: "#ff006e", permissions: ALL_PERMISSIONS, position: 3 },
  { name: "Moderator", color: "#00f5ff", permissions: MODERATOR_PERMISSIONS, position: 2 },
  { name: "Member", color: "#39ff14", permissions: MEMBER_PERMISSIONS, position: 1 },
];

// Helper for Phase 4 middleware: does a permissions bitfield include a flag?
export const hasPermission = (bitfield, flag) => (bitfield & flag) === flag;
