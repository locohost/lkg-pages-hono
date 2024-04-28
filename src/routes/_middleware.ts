import { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { repoSessionGetById } from "../repos/session-repo";

export async function getSessionAuth(ctx: Context, next: Next) {
  const sessId = getCookie(ctx, 'session');
  console.log('auth.getSessionAuth sessId: ', sessId);
  if (!sessId) {
    return await next();
  }
  const sess = await repoSessionGetById(ctx, sessId);
  ctx.set('sess', sess.sess);
  return await next();
}

export async function forceLogin(ctx: Context, next: Next) {
  const sess = ctx.get('sess');
  if (!sess) return ctx.redirect('/login', 302);
  return await next();
}
