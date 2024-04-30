import { Context } from 'hono';
import { getHashedPasswordAndSalt } from '../lib/auth';
import { Env, User, UserInsert, UserResp, UserUpdate, Vars } from '../types';
import { Err, KVPrfx } from '../constants';

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
  await c.env.SESSION.put(
    `${KVPrfx.UserData}:${user.handle}`,
    JSON.stringify(user)
  );
  await c.env.SESSION.put(`${KVPrfx.UserEmail}:${user.email}`, user.handle);
  return { user };
}

export async function repoUserCreateEmailVerify(
  ctx: Context,
  handle: string,
  tkn: string
) {
  console.log('repoUserCreateEmailVerify tkn: ', tkn);
  await ctx.env.SESSION.put(`${KVPrfx.EmailVerify}:${tkn}`, handle);
}

export async function repoUserUpdate(
  ctx: Context<{ Bindings: Env; Variables: Vars }>,
  handle: string,
  changedAttribs: UserUpdate
): Promise<UserResp> {
  // Update new User to KV
  const existing = await repoUserGetByUsername(ctx, handle);
  if (!existing) return { error: Err.BadHandle };
  changedAttribs.updated = new Date();
  const updated = { ...existing.user, ...changedAttribs } as User;
  console.log('repoUserUpdate updatedUser: ', updated);
  await ctx.env.SESSION.put(
    `${KVPrfx.UserData}:${handle}`,
    JSON.stringify(updated)
  );
  return { user: updated };
}

export async function repoUserGetByUsername(
  ctx: Context<{ Bindings: Env; Variables: Vars }>,
  username: string
): Promise<UserResp> {
  const userStr = await ctx.env.SESSION.get(
    `${KVPrfx.UserData}:${username}`
  );
  console.log('repoUserGetByUsername userStr: ', userStr);
  if (userStr == null || userStr == undefined) return { error: Err.BadHandle };
  const user = JSON.parse(userStr) as User;
  return user.del == true
    ? { error: `getUserByHandle: ${Err.BadHandle}` }
    : { user };
}

export async function repoUserGetByEmail(
  ctx: Context<{ Bindings: Env; Variables: Vars }>,
  email: string
): Promise<UserResp> {
  const handleStr = await ctx.env.SESSION.get(
    `${KVPrfx.UserEmail}:${email}`
  );
  console.log('repoUserGetByEmail userStr: ', handleStr);
  if (!handleStr) return { error: Err.BadEmail };
  const userResp = await repoUserGetByUsername(ctx, handleStr);
  if (userResp.error) return { error: `getUserByEmail: ${userResp.error}` };
  return userResp.user!.del == false
    ? { user: userResp.user }
    : { error: Err.BadEmail };
}

export async function repoUserGetBySessionId(
  ctx: Context<{ Bindings: Env; Variables: Vars }>,
  sessId: string
): Promise<UserResp> {
  const username = await ctx.env.SESSION.get(`${KVPrfx.Session}:${sessId}`);
  if (!username) return { error: 'Invalid session id' };
  return await repoUserGetByUsername(ctx, username);
}
/*
{
  "keys": [
    {
      "name": "foo",
      "expiration": 1234,
      "metadata": { "someMetadataKey": "someMetadataValue" }
    }
  ],
  "list_complete": false,
  "cursor": "6Ck1la0VxJ0djhidm1MdX2FyD"
}
*/
export async function repoUserGetAll(
  ctx: Context<{ Bindings: Env; Variables: Vars }>
): Promise<User[]> {
  const kvKeysList = await ctx.env.SESSION.list({
    prefix: `${KVPrfx.UserData}:`,
  });
  console.log('reposUserGetAll kvKeysList: ', kvKeysList);
  const users: User[] = [];
  kvKeysList.keys.forEach(async (key) => {
    const userJson = await ctx.env.SESSION.get(key.name);
    if (userJson) users.push(JSON.parse(userJson));
  });
  return users;
}
