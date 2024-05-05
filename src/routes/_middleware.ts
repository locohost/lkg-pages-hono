import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { repoSessionGetById, repoSessionGetCsrf } from '../repos/session-repo';
import { repoLogCreateCrit } from '../repos/log-repo';
import { Vars } from '../types';
import { Err } from '../constants';

export async function runAntiCsrfChecks(ctx: Context, next: Next) {
  const body = await ctx.req.parseBody();
  const username: string | null = (body['username'] as string) ?? null;
  const csrfTkn = body['_csrf'] as string;
  const sessCsrf = await repoSessionGetCsrf(ctx);
  ctx.set('errMssg', null);
  if (csrfTkn != sessCsrf?.tkn) {
    const usrTxt = username ? `Username:${username}, ` : '';
    console.error(
      `BAD CSRF TOKEN! ${usrTxt}PageTkn:${csrfTkn}, SessTkn:${sessCsrf?.tkn}, IP:${sessCsrf?.ip}`
    );
    await repoLogCreateCrit(ctx, Err.InvalidCsrfTkn, username, sessCsrf?.ip);
    ctx.set(
      'errMssg',
      'Bad anti-csrf token! Error details have been logged and admins are notified!'
    );
  }
  return await next();
}

export async function getSessionAuth(ctx: Context, next: Next) {
  const sessId = getCookie(ctx, 'session');
  console.log('_middleware.getSessionAuth sessId: ', sessId);
  if (!sessId) return await next();
  const sess = await repoSessionGetById(ctx, sessId);
  if (sess != undefined) ctx.set('sess', sess);
  return await next();
}

export async function forceLogin(
  ctx: Context<{ Variables: Vars }>,
  next: Next
) {
  const sess = ctx.get('sess');
  console.log('_middleware.forceLogin sess: ', sess);
  if (!sess) return ctx.redirect('/login', 302);
  return await next();
}
