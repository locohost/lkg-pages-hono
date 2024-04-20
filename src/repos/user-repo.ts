import { Context } from 'hono';
import { getHashedPasswordAndSalt } from '../lib/auth';
import { User } from '../types';

export async function repoUserCreate(
  c: Context,
  username: string,
  email: string,
  plainPass: string
) {
  // Save new User to KV
  const { pass, salt } = await getHashedPasswordAndSalt(plainPass);
  const user: User = {
    handle: username,
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
  await c.env.SESSION.put(`USER:${username}`, JSON.stringify(user));
}

export async function repoUserGetByUsername(
  c: Context,
  username: string
): Promise<User | null> {
  const userStr = await c.env.SESSION.get(`USER:${username}`);
  if (userStr == null) return null;
  const user = JSON.parse(userStr) as User;
  return user.del == false ? user : null;
}

export async function repoUserGetBySessionId(
  c: Context,
  sessId: string
): Promise<User | null> {
  const username = await c.env.SESSION.get(`SESS:${sessId}`);
  if (username == null) return null;
  return await repoUserGetByUsername(c, username);
}
