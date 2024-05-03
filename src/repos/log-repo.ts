import { Context } from 'hono';
import { Env, Log } from '../types';
import { KVPrfx } from '../constants';

export async function repoLogCreateError(
  ctx: Context,
  message: string,
  username?: string
) {
  return repoLogCreate(ctx, 'ERR', message);
}

export async function repoLogCreateWarn(
  c: Context,
  message: string,
  username?: string
) {
  return repoLogCreate(c, 'WARN', message);
}

export async function repoLogCreateInfo(
  ctx: Context,
  message: string,
  username?: string
) {
  return repoLogCreate(ctx, 'INFO', message);
}

export async function repoLogCreateCrit(
  ctx: Context,
  message: string,
  username?: string,
  ip?: string
) {
  return repoLogCreate(ctx, 'CRIT', message, username, ip);
}

async function repoLogCreate(
  ctx: Context<{ Bindings: Env }>,
  logType: string,
  message: string,
  username?: string,
  ip?: string
) {
  const log: Log = {
    type: logType,
    message,
    username: username ?? '',
    requestIp: ip ?? '',
    created: new Date(),
    del: false,
  };
  console.log('repoLogCreate log: ', log);
  const key = username ? `${logType}:${username}` : `${logType}`;
  await ctx.env.SESSION.put(`${KVPrfx.Log}:${key}`, JSON.stringify(log));
  ///TODO: If type is CRIT, send email to admins
}
