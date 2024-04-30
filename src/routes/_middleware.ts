import { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { repoSessionGetById } from "../repos/session-repo";

export async function getSessionAuth(ctx: Context, next: Next) {
  const sessId = getCookie(ctx, 'session');
  console.log('_middleware.getSessionAuth sessId: ', sessId);
  if (!sessId) return await next();
  const sess = await repoSessionGetById(ctx, sessId);
	if (sess != undefined) ctx.set('sess', sess);
  return await next();
}

export async function forceLogin(ctx: Context, next: Next) {
  const sess = ctx.get('sess');
  console.log('_middleware.forceLogin sess: ', sess);
  if (!sess) return ctx.redirect('/login', 302);
  return await next();
}
