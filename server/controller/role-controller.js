import { z } from "zod";
import Role from "../model/Role.js";
import Membership from "../model/Membership.js";
import { ALL_PERMISSIONS, hasPermission } from "../constants/permissions.js";

const roleSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "color must be a #rrggbb hex")
    .optional(),
  permissions: z.number().int().min(0).max(ALL_PERMISSIONS).optional(),
  position: z.number().int().optional(),
});

const updateSchema = roleSchema.partial();

// Guards against privilege escalation: a member may only grant permission bits
// they themselves hold (req.permissions, set by requirePermission). The owner
// has ALL_PERMISSIONS so is unrestricted.
const grantsAllowed = (requested, granterPerms) =>
  (requested & ~granterPerms) === 0;

// GET /api/communities/:communityId/roles  (member)
// Lists the community's roles, highest authority first.
export const getRoles = async (request, response) => {
  try {
    const roles = await Role.find({ communityId: request.communityId }).sort({
      position: -1,
      createdAt: 1,
    });
    return response.status(200).json(roles);
  } catch (error) {
    return response.status(500).json({ error: "Failed to load roles" });
  }
};

// POST /api/communities/:communityId/roles  (MANAGE_ROLES)
export const createRole = async (request, response) => {
  try {
    const parsed = roleSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ error: "A role `name` is required" });
    }

    const permissions = parsed.data.permissions ?? 0;
    if (!grantsAllowed(permissions, request.permissions)) {
      return response
        .status(403)
        .json({ error: "You can't grant permissions you don't have" });
    }

    const role = await Role.create({
      communityId: request.communityId,
      name: parsed.data.name,
      color: parsed.data.color,
      permissions,
      position: parsed.data.position ?? 1,
    });

    return response.status(201).json(role);
  } catch (error) {
    return response.status(500).json({ error: "Failed to create role" });
  }
};

// PUT /api/communities/:communityId/roles/:roleId  (MANAGE_ROLES)
export const updateRole = async (request, response) => {
  try {
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ error: "Invalid role update" });
    }

    const role = await Role.findOne({
      _id: request.params.roleId,
      communityId: request.communityId,
    });
    if (!role) return response.status(404).json({ error: "Role not found" });

    if (parsed.data.permissions !== undefined) {
      // The escalation guard covers both the new bits AND any bits already on
      // the role (so a lower-privileged editor can't keep/strip elevated perms).
      const effective = parsed.data.permissions | role.permissions;
      if (!grantsAllowed(effective, request.permissions)) {
        return response
          .status(403)
          .json({ error: "You can't manage permissions you don't have" });
      }
      role.permissions = parsed.data.permissions;
    }
    if (parsed.data.name !== undefined) role.name = parsed.data.name;
    if (parsed.data.color !== undefined) role.color = parsed.data.color;
    if (parsed.data.position !== undefined) role.position = parsed.data.position;

    await role.save();
    return response.status(200).json(role);
  } catch (error) {
    return response.status(500).json({ error: "Failed to update role" });
  }
};

// DELETE /api/communities/:communityId/roles/:roleId  (MANAGE_ROLES)
// Removes the role and pulls it from every membership that held it.
export const deleteRole = async (request, response) => {
  try {
    const role = await Role.findOne({
      _id: request.params.roleId,
      communityId: request.communityId,
    });
    if (!role) return response.status(404).json({ error: "Role not found" });

    // Don't let anyone delete a role carrying permissions they lack.
    if (!grantsAllowed(role.permissions, request.permissions)) {
      return response
        .status(403)
        .json({ error: "You can't delete a role with permissions you don't have" });
    }

    // Keep the owner's safety net: the all-powerful owner role can't be removed.
    if (hasPermission(role.permissions, ALL_PERMISSIONS)) {
      return response
        .status(400)
        .json({ error: "The owner role can't be deleted" });
    }

    await Membership.updateMany(
      { communityId: request.communityId, roleIds: role._id },
      { $pull: { roleIds: role._id } }
    );
    await role.deleteOne();

    return response.status(200).json({ ok: true });
  } catch (error) {
    return response.status(500).json({ error: "Failed to delete role" });
  }
};
