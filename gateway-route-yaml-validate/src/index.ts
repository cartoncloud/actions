import * as core from '@actions/core';
import { parse } from 'yaml';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type RouteRecord = {
  id?: unknown;
  uri?: unknown;
  predicates?: unknown;
};

function asNonEmptyString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function extractRoutes(payload: unknown): unknown {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const root = payload as Record<string, unknown>;
    const spring = root.spring as Record<string, unknown> | undefined;
    const cloud = spring?.cloud as Record<string, unknown> | undefined;
    const gateway = cloud?.gateway as Record<string, unknown> | undefined;
    return gateway?.routes ?? root.routes;
  }

  return undefined;
}

function run(): void {
  try {
    const inputPath = core.getInput('file_path', { required: true });
    const filePath = resolve(inputPath);
    const contents = readFileSync(filePath, 'utf8');
    const payload = parse(contents);
    const routes = extractRoutes(payload);

    if (!Array.isArray(routes)) {
      throw new Error('Expected routes array in YAML at spring.cloud.gateway.routes or routes');
    }

    if (routes.length === 0) {
      throw new Error('At least one route is required');
    }

    const ids = new Set<string>();
    routes.forEach((route, index) => {
      if (!route || typeof route !== 'object' || Array.isArray(route)) {
        throw new Error(`Route #${index} must be a map`);
      }

      const candidate = route as RouteRecord;
      const routeId = asNonEmptyString(candidate.id);
      if (!routeId) {
        throw new Error(`Route #${index} missing id`);
      }
      if (ids.has(routeId)) {
        throw new Error(`Duplicate route id: ${routeId}`);
      }
      ids.add(routeId);

      const uri = asNonEmptyString(candidate.uri);
      if (!uri) {
        throw new Error(`Route ${routeId} missing uri`);
      }

      if (!Array.isArray(candidate.predicates) || candidate.predicates.length === 0) {
        throw new Error(`Route ${routeId} requires at least one predicate`);
      }
    });

    core.info(`Validated ${routes.length} route entries in ${filePath}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      core.setFailed(error.message);
      return;
    }
    core.setFailed(String(error));
  }
}

run();
