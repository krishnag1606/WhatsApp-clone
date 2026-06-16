// Mirror of server/constants/permissions.js. The bitfield values MUST stay in
// sync with the backend — this is for UI gating only; the server is the
// authoritative gate (never rely on these checks for security).

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
} as const;

export type PermissionName = keyof typeof Permissions;

// All flags OR'd together — the Owner role's bitfield.
export const ALL_PERMISSIONS = Object.values(Permissions).reduce(
  (acc, bit) => acc | bit,
  0
);

// Friendly labels for the role editor checkboxes, in display order.
export const PERMISSION_LABELS: { flag: number; name: PermissionName; label: string }[] = [
  { flag: Permissions.VIEW_CHANNELS, name: "VIEW_CHANNELS", label: "View channels" },
  { flag: Permissions.SEND_MESSAGES, name: "SEND_MESSAGES", label: "Send messages" },
  { flag: Permissions.CREATE_POLLS, name: "CREATE_POLLS", label: "Create polls" },
  { flag: Permissions.POST_ANNOUNCEMENTS, name: "POST_ANNOUNCEMENTS", label: "Post announcements" },
  { flag: Permissions.MANAGE_MESSAGES, name: "MANAGE_MESSAGES", label: "Manage messages" },
  { flag: Permissions.KICK, name: "KICK", label: "Kick members" },
  { flag: Permissions.BAN, name: "BAN", label: "Ban members" },
  { flag: Permissions.MUTE, name: "MUTE", label: "Mute members" },
  { flag: Permissions.MANAGE_CHANNELS, name: "MANAGE_CHANNELS", label: "Manage channels" },
  { flag: Permissions.MANAGE_ROLES, name: "MANAGE_ROLES", label: "Manage roles" },
  { flag: Permissions.MANAGE_COMMUNITY, name: "MANAGE_COMMUNITY", label: "Manage community" },
];

// Does a permission bitfield include a flag? (matches the server helper)
export const hasPermission = (bitfield: number, flag: number): boolean =>
  (bitfield & flag) === flag;
