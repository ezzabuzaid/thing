import { parse as uuidParse, version as uuidVersion } from 'uuid';

 
export function isNullOrUndefined(value: any): value is undefined | null {
  return value === undefined || value === null;
}

export function notNullOrUndefined<T>(
  value: T,
): value is Exclude<T, null | undefined> {
  return !isNullOrUndefined(value);
}

export function removeTrailingSlashes(path: string, keepLastOne = false) {
  while (path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return path + (keepLastOne ? '/' : '');
}

/**
 * Extracts the Unix epoch milliseconds and Date from a UUIDv7 string.
 * Throws if the input is not a valid v7 UUID.
 */
export function dateFromUuidV7(uuid: string): Date {
  if (uuidVersion(uuid) !== 7) {
    throw new TypeError('Provided UUID is not version 7');
  }

  const bytes = uuidParse(uuid);
  const msecs =
    (Number(bytes[0]) << 40) +
    (Number(bytes[1]) << 32) +
    (Number(bytes[2]) << 24) +
    (Number(bytes[3]) << 16) +
    (Number(bytes[4]) << 8) +
    Number(bytes[5]);

  return new Date(msecs);
}
