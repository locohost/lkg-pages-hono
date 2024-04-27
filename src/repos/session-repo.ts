import { Context } from 'hono';
import { getHashedPasswordAndSalt } from '../lib/auth';
import { Sess, SessResp, User, UserUpdate } from '../types';
import { repoUserGetBySessionId } from './user-repo';
import { repoLogCreateError } from './log-repo';

export async function repoSessionCreate(
  c: Context,
  user: User,
  expSeconds: number
): Promise<SessResp> {
  // Save new User to KV
  const sessId = crypto.randomUUID();
  await c.env.SESSION.put(`SESS:${sessId}`, user.handle, {
    expiration: expSeconds,
  });
  return {
    sess: {
      id: sessId,
      handle: user.handle,
      email: user.email,
      avatar: user.avatar,
    },
  };
}

export async function repoSessionGetById(
  c: Context,
  sessId: string
): Promise<SessResp> {
  const userResp = await repoUserGetBySessionId(c, sessId);
  if (userResp.error) {
    await repoLogCreateError(c, `repoSessionGetById: ${userResp.error}`);
    return { error: userResp.error };
  }
  return {
    sess: {
      id: sessId,
      handle: userResp.user!.handle,
      email: userResp.user!.email,
      avatar: userResp.user!.avatar ?? '',
    },
  };
}
