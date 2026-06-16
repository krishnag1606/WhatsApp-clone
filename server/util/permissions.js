import Role from "../model/Role.js";
import { ALL_PERMISSIONS, Permissions } from "../constants/permissions.js";

// Computes the effective permission bitfield for a membership: the bitwise OR of
// every role the member holds. The community owner implicitly has ALL
// permissions regardless of their roles, so ownership can never be locked out.
//
// `community` is required for the owner bypass; pass the loaded Community doc.
export const computePermissions = async (membership, community) => {
  if (!membership) return 0;
  if (community && community.ownerId === membership.userId) {
    return ALL_PERMISSIONS;
  }
  if (!membership.roleIds || membership.roleIds.length === 0) return 0;

  const roles = await Role.find({ _id: { $in: membership.roleIds } }).select(
    "permissions"
  );
  return roles.reduce((acc, role) => acc | role.permissions, 0);
};

// The permission flag required to post in a given channel: announcement channels
// require POST_ANNOUNCEMENTS, everything else requires SEND_MESSAGES. Shared by
// the REST message controller and the socket server so both gate identically.
export const sendPermissionFor = (channel) =>
  channel?.type === "announcement"
    ? Permissions.POST_ANNOUNCEMENTS
    : Permissions.SEND_MESSAGES;
