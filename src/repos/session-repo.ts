import { Context } from 'hono';
import { SessResp, User, Vars, Env, Sess } from '../types';
import { repoUserGetBySessionId, repoUserGetByUsername } from './user-repo';
import { repoLogCreateError } from './log-repo';
import { KVPrfx } from '../constants';
import { getReqIP } from '../lib/util';

export async function repoSessionCreate(
  ctx: Context<{ Bindings: Env; Variables: Vars }>,
  user: User,
  expSeconds: number
): Promise<string> {
  const sess = {
    handle: user.handle,
    email: user.email,
    avatar: user.avatar,
    roles: user.roles ?? ['webuser'],
  };
  const sessId = crypto.randomUUID();
  await ctx.env.SESSION.put(
    `${KVPrfx.Session}:${sessId}`,
    JSON.stringify(sess),
    {
      expiration: expSeconds,
    }
  );
  return sessId;
}

export async function repoSessionGetById(
  ctx: Context<{ Bindings: Env; Variables: Vars }>,
  sessId: string
): Promise<Sess | undefined> {
  const sessStr = await ctx.env.SESSION.get(`${KVPrfx.Session}:${sessId}`);
  console.log('repoSessionGetById sessStr: ', sessStr);
  if (sessStr != null && sessStr != 'undefined') {
    return JSON.parse(sessStr) as Sess;
  }
  return undefined;
}

export async function repoSessionCreateCsrf(
  ctx: Context<{ Bindings: Env; Variables: Vars }>
): Promise<string> {
  const ip = getReqIP(ctx, 'Create');
  const tkn = crypto.randomUUID();
  console.log('repoSessionCreateCsrf ip: ', ip);
  await ctx.env.SESSION.put(`${KVPrfx.Csrf}:${ip}`, tkn);
  return tkn;
}

export async function repoSessionGetCsrf(
  ctx: Context<{ Bindings: Env; Variables: Vars }>
): Promise<{ ip: string | undefined, tkn: string | null } | undefined> {
  const ip = getReqIP(ctx, 'Get');
  console.log('repoSessionGetCsrf ip: ', ip);
  const tkn = await ctx.env.SESSION.get(`${KVPrfx.Csrf}:${ip}`);
  return tkn != null ? { ip, tkn } : undefined;
}
