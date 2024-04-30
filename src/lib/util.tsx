import { Context } from 'hono';
import { TurnstileOutcome } from '../types';
import { MessagePage } from '../pages/message-page';
import { StatusCode } from 'hono/utils/http-status';

export function showToastInfo(ctx: Context, message: string) {
	return ctx.html(`
		<div class="alert alert-info" 
			hx-trigger="load[clearToast(1)]" 
		><span>Hmmm... ${message}</span></div>
	`);
}

export function showToastError(ctx: Context, message: string) {
	return ctx.html(`
		<div class="alert alert-error" 
			hx-trigger="load[clearToast(1)]" 
		><span>Oh no!... ${message}</span></div>
	`);
}

export function showToastSuccess(ctx: Context, message: string) {
	return ctx.html(`
		<div class="alert alert-success" 						
			hx-trigger="load[clearToast()]" 
		><span>Huzzah! ${message}</span></div>
	`);
}

///TODO: This might be deprecated, check then delete
export async function showMessagePageResponse(ctx: Context, message: string, code: StatusCode): Promise<Response> {
	///TODO: Add logging here
	return await ctx.html(<MessagePage ctx={ctx} message={message} />, code);
}

export function getSiteUrlByEnv(ctx: Context) {
	const url = ctx.req.url.toLowerCase();
	if (url.indexOf('lateknight.games')) {
		return ctx.env.SITE_URL_PROD;
	}
	if (url.indexOf('.pages.dev')) {
		return ctx.env.SITE_URL_PREV;
	}
	return ctx.env.SITE_URL_DEV;
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
