import { isRecord } from './typeGuards';

export async function readErrorCode(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    return isRecord(body) && typeof body.code === 'string' ? body.code : null;
  } catch {
    return null;
  }
}
