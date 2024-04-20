import { Context } from 'hono';
import { getHashedPasswordAndSalt } from '../lib/auth';
import { User, UserUpdate } from '../types';

export async function repoUserCreate(
  c: Context,
  handle: string,
  email: string,
  plainPass: string
) {
  // Save new User to KV
  const { pass, salt } = await getHashedPasswordAndSalt(plainPass);
  const user: User = {
    handle,
    email,
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
}

export async function repoUserUpdate(
  c: Context,
  username: string,
  updateAttribs: UserUpdate
): Promise<User | undefined> {
  // Update new User to KV
  const existingUser = await repoUserGetByUsername(c, username);
  if (!existingUser) return undefined;
  updateAttribs.updated = new Date();
  const updatedUser = { ...existingUser, ...updateAttribs };
  console.log('repoUserUpdate updatedUser: ', updatedUser);
  await c.env.SESSION.put(`USER:${username}`, JSON.stringify(updatedUser));
  return updatedUser;
}

export async function repoUserGetByUsername(
  c: Context,
  username: string
): Promise<User | undefined> {
  const userStr = await c.env.SESSION.get(`USER:${username}`);
  if (!userStr) return undefined;
  const user = JSON.parse(userStr) as User;
  return user.del == false ? user : undefined;
}

export async function repoUserGetBySessionId(
  c: Context,
  sessId: string
): Promise<User | undefined> {
  const username = await c.env.SESSION.get(`SESS:${sessId}`);
  if (!username) return undefined;
  return await repoUserGetByUsername(c, username);
}
