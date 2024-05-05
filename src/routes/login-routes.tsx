import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { hexStrFromArrBuff, verifyPasswordReturnUser } from '../lib/auth';
import { getExpiration, showToastError, showToastSuccess } from '../lib/util';
import { repoUserUpdate } from '../repos/user-repo';
import { repoLogCreateCrit } from '../repos/log-repo';
import {
	repoSessionCreate, repoSessionCreateCsrf,
	repoSessionGetCsrf
} from '../repos/session-repo';
import type { Env, Vars } from "../types";
import { LoginPage } from '../pages/login-page';
import { Err } from '../constants';
import { sendPostmark } from '../lib/email';
import { HomePage } from '../pages/home-page';
import { runAntiCsrfChecks } from './_middleware';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();

app.get('/login', async function (ctx) {
	const tkn = await repoSessionCreateCsrf(ctx);
	return ctx.html(<LoginPage ctx={ctx} csrfToken={tkn} />)
});

app.post('/login', runAntiCsrfChecks, async function (ctx) {
	if (ctx.get('errMssg')) return showToastError(ctx, ctx.get('errMssg'));
	const body = await ctx.req.parseBody();
	const username = body['username'] as string;
	// Verify plainPass entered against saved hashedPass
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
				const array = new Uint32Array(16);
				const randPass = hexStrFromArrBuff(crypto.getRandomValues(array));
				const resetBody = `<p>Your pass word has been reset to the following...</p><p><b>${randPass}</b></p><p>Visit the website</p>`;
				const sendResp = await sendPostmark(ctx, user.email, 'Instructions to reset your password', resetBody, 'PASS-RESET');
				if (sendResp.ErrorCode > 0) {
					///TODO: Clean the error message if on prod
					return ctx.html(<HomePage ctx={ctx} message={sendResp.Message} />);
				}
			}
		}
		return showToastError(ctx, error);
	}
	// User login looks Ok: Create session record and cookie
	const exp = getExpiration(3);
	const sessId = await repoSessionCreate(ctx, user!, exp.seconds);
	if (sessId) {
		setCookie(ctx, 'session', sessId, {
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
