import { z } from "zod";

export const assignableSpaceRoleValues = ["editor", "viewer"] as const;

export const assignableSpaceRoleSchema = z.enum(assignableSpaceRoleValues);

export type AssignableSpaceRole = (typeof assignableSpaceRoleValues)[number];
