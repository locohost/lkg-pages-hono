import { Context } from 'hono';
import { getHashedPasswordAndSalt } from '../lib/auth';
import { User, UserInsert, UserResp, UserUpdate } from '../types';
import { Err } from '../constants';

export async function repoUserCreate(
  c: Context,
  newUser: UserInsert,
  plainPass: string
): Promise<UserResp> {
  // Save new User to KV
  const { pass, salt } = await getHashedPasswordAndSalt(plainPass);
  const user = {
    handle: newUser.handle,
    email: newUser.email,
    avatar: newUser.avatar,
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
  } as User;
  console.log('repoUserCreate user: ', user);
  await c.env.SESSION.put(`USER:${user.handle}`, JSON.stringify(user));
  await c.env.SESSION.put(`USER:${user.email}`, user.handle);
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
  const updated = { ...existing.user, ...changedAttribs } as User;
  console.log('repoUserUpdate updatedUser: ', updated);
  await c.env.SESSION.put(`USER:${username}`, JSON.stringify(updated));
  return { user: updated };
}

export async function repoUserGetByUsername(
  ctx: Context,
  username: string
): Promise<UserResp> {
  const userStr = await ctx.env.SESSION.get(`USER:${username}`);
  console.log('repoUserGetByUsername userStr: ', userStr);
  if (userStr == null || userStr == undefined) return { error: Err.BadHandle };
  const user = JSON.parse(userStr) as User;
  return user.del == true
    ? { error: `getUserByHandle: ${Err.BadHandle}` }
    : { user };
}

export async function repoUserGetByEmail(
  ctx: Context,
  email: string
): Promise<UserResp> {
  const handleStr = await ctx.env.SESSION.get(`USER:${email}`);
  console.log('repoUserGetByEmail userStr: ', handleStr);
  if (!handleStr) return { error: Err.BadEmail };
  const userResp = await repoUserGetByUsername(ctx, handleStr);
  if (userResp.error) return { error: `getUserByEmail: ${userResp.error}` };
  return userResp.user!.del == false
    ? { user: userResp.user }
    : { error: Err.BadEmail };
}

export async function repoUserGetBySessionId(
  c: Context,
  sessId: string
): Promise<UserResp> {
  const username = await c.env.SESSION.get(`SESS:${sessId}`);
  if (!username) return { error: 'Invalid session id' };
  return await repoUserGetByUsername(c, username);
}
