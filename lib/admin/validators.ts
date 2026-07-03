export type JsonObject = Record<string, unknown>;

export class AdminValidationError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = "AdminValidationError";
  }
}

export async function readJsonBody(request: { json: () => Promise<unknown> }): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AdminValidationError("Request body must be valid JSON.");
  }
}

export function assertJsonObject(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AdminValidationError("Request body must be a JSON object.");
  }

  return value as JsonObject;
}

export function hasField(body: JsonObject, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, field);
}

export function requiredString(body: JsonObject, field: string): string {
  const value = body[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AdminValidationError(`${field} is required.`, field);
  }

  return value.trim();
}

export function optionalString(body: JsonObject, field: string): string | null | undefined {
  if (!hasField(body, field)) {
    return undefined;
  }

  const value = body[field];

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AdminValidationError(`${field} must be a string.`, field);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function optionalRequiredString(body: JsonObject, field: string): string | undefined {
  if (!hasField(body, field)) {
    return undefined;
  }

  return requiredString(body, field);
}

export function optionalBoolean(body: JsonObject, field: string): boolean | undefined {
  if (!hasField(body, field)) {
    return undefined;
  }

  const value = body[field];

  if (typeof value !== "boolean") {
    throw new AdminValidationError(`${field} must be a boolean.`, field);
  }

  return value;
}

export function optionalInteger(body: JsonObject, field: string): number | null | undefined {
  if (!hasField(body, field)) {
    return undefined;
  }

  const value = body[field];

  if (value === null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new AdminValidationError(`${field} must be an integer.`, field);
  }

  return value;
}

export function optionalAliasedString(
  body: JsonObject,
  fields: [string, string],
): string | null | undefined {
  const field = firstProvidedField(body, fields);
  return field ? optionalString(body, field) : undefined;
}

export function optionalAliasedBoolean(body: JsonObject, fields: [string, string]): boolean | undefined {
  const field = firstProvidedField(body, fields);
  return field ? optionalBoolean(body, field) : undefined;
}

export function optionalAliasedInteger(body: JsonObject, fields: [string, string]): number | null | undefined {
  const field = firstProvidedField(body, fields);
  return field ? optionalInteger(body, field) : undefined;
}

export function assertAtLeastOneField(updates: JsonObject, message: string): void {
  if (Object.keys(updates).length === 0) {
    throw new AdminValidationError(message);
  }
}

export function validateUuid(value: string, field: string): string {
  const normalizedValue = value.trim();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalizedValue)) {
    throw new AdminValidationError(`${field} must be a valid UUID.`, field);
  }

  return normalizedValue;
}

export function validateDayOfWeek(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 6) {
    throw new AdminValidationError(`${field} must be an integer from 0 to 6.`, field);
  }

  return value;
}

export function validateTime(value: unknown, field: string): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AdminValidationError(`${field} must be a HH:MM string or null.`, field);
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    throw new AdminValidationError(`${field} must use HH:MM 24-hour format.`, field);
  }

  return trimmed;
}

function firstProvidedField(body: JsonObject, fields: [string, string]): string | null {
  if (hasField(body, fields[0])) {
    return fields[0];
  }

  if (hasField(body, fields[1])) {
    return fields[1];
  }

  return null;
}
