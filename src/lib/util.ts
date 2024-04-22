import { Context } from 'hono';

export function getSiteUrlByEnv(ctx: Context) {
  const url = ctx.req.url;
  if (url.toLowerCase().indexOf('lateknight.games')) {
    return ctx.env.SITE_URL_PROD;
  } else {
    return ctx.env.SITE_URL_DEV;
  }
}

export function getSiteUrl(ctx:Context) {
	const parts = ctx.req.url.split('/');
	return `${parts[0]}//${parts[2]}`;
}
