import { Context } from 'hono';
import { TurnstileOutcome } from '../types';

export function getSiteUrlByEnv(ctx: Context) {
  const url = ctx.req.url;
  if (url.toLowerCase().indexOf('lateknight.games')) {
    return ctx.env.SITE_URL_PROD;
  } else {
    return ctx.env.SITE_URL_DEV;
  }
}

export function getSiteUrl(ctx: Context) {
  const parts = ctx.req.url.split('/');
  return `${parts[0]}//${parts[2]}`;
}

export async function turnstileVerify(ctx: Context) {
  const SECRET_KEY = ctx.env.TS_SECRET as string;
  const body = await ctx.req.formData();
  // Turnstile injects a token in "cf-turnstile-response".
  const token = body.get('cf-turnstile-response') as string;
  const ip = ctx.req.header('CF-Connecting-IP') as string;
  // Validate the token by calling the
  // "/siteverify" API endpoint.
  let formData = new FormData();
  formData.append('secret', SECRET_KEY);
  formData.append('response', token);
  formData.append('remoteip', ip);
  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  const result = await fetch(url, {
    body: formData,
    method: 'POST',
  });
  // What is outcome of TS siteverify?
  const outcome = (await result.json()) as TurnstileOutcome;
  if (outcome.success) {
    // ...
  }
}
