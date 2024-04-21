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

export async function repoUserUpdate(
  c: Context,
  username: string,
  updateAttribs: UserUpdate
): Promise<UserResp> {
  // Update new User to KV
  const existingUser = await repoUserGetByUsername(c, username);
  if (!existingUser) return { error: Err.BadHandle };
  updateAttribs.updated = new Date();
  const userUpdated = { ...existingUser, ...updateAttribs } as User;
  console.log('repoUserUpdate updatedUser: ', userUpdated);
  await c.env.SESSION.put(`USER:${username}`, JSON.stringify(userUpdated));
  return { user: userUpdated };
}

export async function repoUserGetByUsername(
  c: Context,
  username: string
): Promise<UserResp> {
  const userStr = await c.env.SESSION.get(`USER:${username}`);
  if (!userStr) return { error: Err.BadHandle };
  const user = JSON.parse(userStr) as User;
  return user.del == false ? { user } : {};
}

export async function repoUserGetBySessionId(
  c: Context,
  sessId: string
): Promise<UserResp> {
  const username = await c.env.SESSION.get(`SESS:${sessId}`);
  if (!username) return { error: Err.BadHandle } as UserResp;
  return await repoUserGetByUsername(c, username);
}
