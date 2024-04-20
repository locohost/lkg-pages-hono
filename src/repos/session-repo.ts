import { Context } from 'hono';
import { getHashedPasswordAndSalt } from '../lib/auth';
import { Sess, User, UserUpdate } from '../types';
import { repoUserGetBySessionId } from './user-repo';

export async function repoSessionCreate(
  c: Context,
  username: string,
  expSeconds: number
): Promise<string> {
  // Save new User to KV
  const sessId = crypto.randomUUID();
  await c.env.SESSION.put(`SESS:${sessId}`, username, {
    expiration: expSeconds,
  });
  return sessId;
}

export async function repoSessionGetById(
  c: Context,
  sessId: string
): Promise<Sess | null> {
  const user = await repoUserGetBySessionId(c, sessId);
  if (!user) return null;
  return { id: sessId, username: user.handle, email: user.email } as Sess;
}
