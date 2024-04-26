import { Context } from 'hono';
import { getHashedPasswordAndSalt } from '../lib/auth';
import { User, UserResp, UserUpdate } from '../types';
import { Err } from '../constants';

export async function repoUserCreate(
  c: Context,
  handle: string,
  email: string,
  plainPass: string
): Promise<UserResp> {
  // Save new User to KV
  const { pass, salt } = await getHashedPasswordAndSalt(plainPass);
  const user: User = {
    handle,
    email,
    emailVerified: false,
    verifyTkn: crypto.randomUUID(),
    pass,
    salt,
    loginFails: 0,
    lastLoginIp: null,
    lastLogin: new Date(),
    lockedReason: null,
    created: new Date(),
    updated: null,
    del: false,
  };
  console.log('repoUserCreate user: ', user);
  await c.env.SESSION.put(`USER:${handle}`, JSON.stringify(user));
  return { user };
}

export async function repoUserCreateEmailVerify(
  ctx: Context,
  handle: string,
  tkn: string
) {
  console.log('repoUserCreateEmailVerify tkn: ', tkn);
  await ctx.env.SESSION.put(`USER:EVTKN:${tkn}`, handle);
}

export async function repoUserUpdate(
  c: Context,
  username: string,
  changedAttribs: UserUpdate
): Promise<UserResp> {
  // Update new User to KV
  const existing = await repoUserGetByUsername(c, username);
  if (!existing) return { error: Err.BadHandle };
  changedAttribs.updated = new Date();
  const updated = { ...existing, ...changedAttribs } as User;
  console.log('repoUserUpdate updatedUser: ', updated);
  await c.env.SESSION.put(`USER:${username}`, JSON.stringify(updated));
  return { user: updated };
}

export async function repoUserGetByUsername(
  c: Context,
  username: string
): Promise<UserResp> {
  const userStr = await c.env.SESSION.get(`USER:${username}`);
  console.log('repoUserGetByUsername userStr: ', userStr);
  if (!userStr) return { error: Err.BadHandle };
  const user = JSON.parse(userStr) as User;
  return user.del == false ? { user } : { error: Err.BadHandle };
}

export async function repoUserGetBySessionId(
  c: Context,
  sessId: string
): Promise<UserResp> {
  const username = await c.env.SESSION.get(`SESS:${sessId}`);
  if (!username) return { error: 'Invalid session id' };
  return await repoUserGetByUsername(c, username);
}
