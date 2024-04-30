import { Context } from 'hono';
import { SessResp, User, Vars, Env, Sess } from '../types';
import { repoUserGetBySessionId, repoUserGetByUsername } from './user-repo';
import { repoLogCreateError } from './log-repo';
import { KVPrfx } from '../constants';

export async function repoSessionCreate(
  ctx: Context<{ Bindings: Env; Variables: Vars }>,
  user: User,
  expSeconds: number
): Promise<Sess> {
  const sessId = crypto.randomUUID();
  const sess = {
    id: sessId,
    handle: user.handle,
    email: user.email,
    avatar: user.avatar,
    roles: user.roles,
  };
  await ctx.env.SESSION.put(
    `${KVPrfx.Session}:${sessId}`,
    JSON.stringify(sess),
    {
      expiration: expSeconds,
    }
  );
  return sess;
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
) {
  const ip = getReqIP(ctx, 'Get');
  console.log('repoSessionGetCsrf ip: ', ip);
  const csrf = await ctx.env.SESSION.get(`${KVPrfx.Csrf}:${ip}`);
  return csrf ?? undefined;
}

function getReqIP(
  ctx: Context<{ Bindings: Env; Variables: Vars }>,
  method: string
): string | undefined {
  console.log('headers: ', JSON.stringify(ctx.req.header));
  if (ctx.req.url.toLocaleLowerCase().indexOf('localhost')) {
    return 'dev-run-ip';
  }
  let ip = ctx.req.header('CF-Connecting-IP');
  if (!ip) ip = ctx.req.header('True-Client-IP');
  if (!ip)
    throw new Error(`repoSession${method}Csrf: Cannot get User IP from header`);
  return ip;
}
