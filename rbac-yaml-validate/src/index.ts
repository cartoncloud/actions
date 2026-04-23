import * as core from '@actions/core';
import { parse } from 'yaml';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type PermissionRecord = {
  id?: unknown;
  code?: unknown;
};

type RoleRecord = {
  id?: unknown;
  code?: unknown;
  permissions?: unknown;
};

function asNonEmptyString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

function assertMap(value: unknown, message: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(message);
  }
}

function validatePermissions(permissions: unknown[]): Set<string> {
  const permissionIds = new Set<string>();
  const permissionCodes = new Set<string>();

  permissions.forEach((permission, index) => {
    assertMap(permission, `Permission #${index} must be a map`);

    const candidate = permission as PermissionRecord;
    const permissionId = asNonEmptyString(candidate.id);
    if (!permissionId) {
      throw new Error(`Permission #${index} missing id`);
    }
    if (permissionIds.has(permissionId)) {
      throw new Error(`Duplicate permission id: ${permissionId}`);
    }
    permissionIds.add(permissionId);

    const permissionCode = asNonEmptyString(candidate.code);
    if (!permissionCode) {
      throw new Error(`Permission ${permissionId} missing code`);
    }
    if (permissionCodes.has(permissionCode)) {
      throw new Error(`Duplicate permission code: ${permissionCode}`);
    }
    permissionCodes.add(permissionCode);
  });

  return permissionCodes;
}

function validateRoles(roles: unknown[], permissionCodes: Set<string>): void {
  const roleIds = new Set<string>();
  const roleCodes = new Set<string>();

  roles.forEach((role, index) => {
    assertMap(role, `Role #${index} must be a map`);

    const candidate = role as RoleRecord;
    const roleId = asNonEmptyString(candidate.id);
    if (!roleId) {
      throw new Error(`Role #${index} missing id`);
    }
    if (roleIds.has(roleId)) {
      throw new Error(`Duplicate role id: ${roleId}`);
    }
    roleIds.add(roleId);

    const roleCode = asNonEmptyString(candidate.code);
    if (!roleCode) {
      throw new Error(`Role ${roleId} missing code`);
    }
    if (roleCodes.has(roleCode)) {
      throw new Error(`Duplicate role code: ${roleCode}`);
    }
    roleCodes.add(roleCode);

    if (candidate.permissions === undefined || candidate.permissions === null) {
      return;
    }
    if (!Array.isArray(candidate.permissions)) {
      throw new Error(`Role ${roleCode} permissions must be an array`);
    }

    candidate.permissions.forEach((entry) => {
      const resolved = asNonEmptyString(entry);
      if (!resolved) {
        throw new Error(`Role ${roleCode} has empty permission entry`);
      }
      if (!permissionCodes.has(resolved)) {
        throw new Error(`Role ${roleCode} references undefined permission: ${resolved}`);
      }
    });
  });
}

function run(): void {
  try {
    const inputPath = core.getInput('file_path', { required: true });
    const filePath = resolve(inputPath);
    const contents = readFileSync(filePath, 'utf8');
    const payload = parse(contents, { maxAliasCount: 0 });

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('RBAC YAML root must be a map');
    }

    const root = payload as Record<string, unknown>;
    const roles = root.roles;
    const permissions = root.permissions;

    if (!Array.isArray(roles)) {
      throw new Error('Missing top-level "roles" array');
    }
    if (roles.length === 0) {
      throw new Error('At least one role is required');
    }
    if (!Array.isArray(permissions)) {
      throw new Error('Missing top-level "permissions" array');
    }
    if (permissions.length === 0) {
      throw new Error('At least one permission is required');
    }

    const permissionCodes = validatePermissions(permissions);
    validateRoles(roles, permissionCodes);

    core.info(`Validated ${roles.length} roles and ${permissions.length} permissions in ${filePath}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      core.setFailed(error.message);
      return;
    }
    core.setFailed(String(error));
  }
}

run();
