export function parseBuffer<T>(buffer: Buffer): T | undefined {
  try {
    return JSON.parse(buffer.toString());
  } catch (ex) {
    return undefined;
  }
}