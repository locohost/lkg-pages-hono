import { Context } from 'hono';
import { Log } from '../types';
import { KVPrfx } from '../constants';

export async function repoLogCreateError(
  c: Context,
  message: string,
  username?: string
) {
  return repoLogCreate(c, 'ERR', message);
}

export async function repoLogCreateWarn(
  c: Context,
  message: string,
  username?: string
) {
  return repoLogCreate(c, 'WARN', message);
}

export async function repoLogCreateInfo(
  c: Context,
  message: string,
  username?: string
) {
  return repoLogCreate(c, 'INFO', message);
}

export async function repoLogCreateCrit(
  c: Context,
  message: string,
  username?: string
) {
  return repoLogCreate(c, 'CRIT', message, username);
}

async function repoLogCreate(
  c: Context,
  logType: string,
  message: string,
  username?: string
) {
  var ip = c.req.header('x-forwarded-for') || null;
  console.log('repoLogCreate ip:', ip);
  const log: Log = {
    type: logType,
    message,
    requestIp: ip,
    created: new Date(),
    del: false,
  };
  console.log('repoLogCreate log: ', log);
	const key = username ? `${logType}:${username}` : `${logType}`
  await c.env.SESSION.put(`${KVPrfx.Log}:${key}`, JSON.stringify(log));
}
