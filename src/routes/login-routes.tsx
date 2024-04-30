import { Context, Hono } from 'hono';
import type { Env, Vars } from "../types";
import { getExpiration, verifyPasswordReturnUser } from '../lib/auth';
import { showToastError, showToastSuccess } from '../lib/util';
import { LoginPage } from '../pages/login-page';
import { repoUserUpdate } from '../repos/user-repo';
import { repoLogCreateCrit } from '../repos/log-repo';
import { repoSessionCreate, repoSessionCreateCsrf, repoSessionGetCsrf } from '../repos/session-repo';
import { setCookie } from 'hono/cookie';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();

app.get('/login', async function (ctx) {
	console.log('Inside GET/login route');
	const tkn = await repoSessionCreateCsrf(ctx);
	return ctx.html(<LoginPage ctx={ctx} csrfToken={tkn} />)
});

app.post('/login', async function (ctx) {
	console.log('Inside POST/login/password route');
	const body = await ctx.req.parseBody();
	const csrfTkn = body['_csrf'] as string;
	const storedTkn = await repoSessionGetCsrf(ctx);
	if (csrfTkn != storedTkn) {
		console.error(`BAD CSRF TOKEN! PageTkn:${csrfTkn} SessTkn:${storedTkn}`);
		///TODO: Log this!!! then clear everything and exit app with bad status
	}
	const username = body['username'] as string;
	const plainPass = body['password'] as string;
	let { user, error } = await verifyPasswordReturnUser(ctx, username, plainPass);
	if (error) {
		if (user) {
			// Handle user errors
			// If user is NOT null but we have error, then we received bad password
			error = 'Invalid password';
			const fails = user!.loginFails += 1;
			if (fails >= 3) {
				await repoUserUpdate(ctx, username, { loginFails: fails, lockedReason: 'Too many bad passwords' });
				await repoLogCreateCrit(ctx, 'User locked: Too many failed login attempts', username);
				error += ": You have 3+ invalid login attempts. Your user profile is locked. A password reset link will be sent to your email.";
				///TODO: Send password reset link email
			}
		}
		return showToastError(ctx, error);
	}
	// Create session
	const exp = getExpiration(3);
	const sess = await repoSessionCreate(ctx, user!, exp.seconds);
	if (sess) {
		setCookie(ctx, 'session', sess.id, {
			path: '/',
			secure: true,
			httpOnly: true,
			expires: new Date(exp.milliseconds),
		});
	}
	await repoUserUpdate(ctx, username, { lastLogin: new Date() });
	return showToastSuccess(ctx, `Login success--Welcome <strong>${username}</strong>!`);
});

export default app
