import { Hono } from 'hono';
import type { Env, PostmarkResp, Vars } from "../types";
import { createSession, verifyPasswordReturnUser } from '../lib/auth';
import { sendPostmark } from '../lib/email';
import { getSiteUrl, showMessagePageResponse } from '../lib/util';
import { LoginPage } from '../pages/login-page';
import { SignupPage } from '../pages/signup-page';
import { MessagePage } from '../pages/message-page';
import { repoUserCreate, repoUserCreateEmailVerify, repoUserGetByUsername, repoUserUpdate } from '../repos/user-repo';
import { repoLogCreateCrit, repoLogCreateError } from '../repos/log-repo';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();

app.get('/signup', function (ctx) {
	console.log('Inside GET/signup route');
	const tkn = crypto.randomUUID();
	ctx.set('csrfTkn', tkn)
	return ctx.html(<SignupPage ctx={ctx} csrfToken={tkn} />);
});

app.post('/signup', async function (ctx) {
	console.log('Inside POST/signup route');
	const body = await ctx.req.parseBody();
	const username = body['username'] as string;
	const email = body['email'] as string;
	const plainPass = body['password'] as string;
	const confirm = body['confirm'] as string;
	const csrfTkn = body['_csrf'] as string;
	///TODO: Validate chars in following creds
	///TODO: Validate pass & confirm match
	///TODO: Validate username and email are unique
	// if (csrfTkn != c.get('csrfTkn')) {
	// 	console.error('BAD CSRF TOKEN!');
	// 	///TODO: Log this!!! then clear everything and exit app with bad status
	// }
	if (username != confirm) {
		return showMessagePageResponse(ctx, `Oh no! Username and Confirm do not match`, 400);
	}
	const checkResp = await repoUserGetByUsername(ctx, username);
	if (checkResp.user) {
		return showMessagePageResponse(ctx, `Oh no! Username'${checkResp.user}' already exists. Did you mean to login? If not, please try a different username`, 400);
	}
	const userResp = await repoUserCreate(ctx, username, email, plainPass);
	if (userResp.error) {
		return showMessagePageResponse(ctx, `Oh no! '${userResp.error}'`, 400);
	}
	const url = getSiteUrl(ctx);
	const href = `${url}/auth/verify-email/${userResp.user!.verifyTkn}`;
	const emailBody = `Please click this link to verify your email address and activate your Late Knight Games new user profile<br/><br/><a href="${href}">Verify this email</a>`;
	const sendResp = await sendPostmark(ctx, userResp.user!.email, 'Please verify your email', emailBody);
	if (sendResp.ErrorCode > 0) {
		return showMessagePageResponse(ctx, `Oh no! '${sendResp.Message}'`, 400);
	}
	await repoUserCreateEmailVerify(ctx, userResp.user!.handle, userResp.user!.verifyTkn);
	return showMessagePageResponse(ctx, `Signup success--Welcome '${username}'! You cannot login until you click the link in the verification email just sent. It may take a few minutes for that to appear in your inbox.`, 200);
});

app.get('/verify-email/:tkn', async function (c) {
	const tkn = c.req.param('tkn') as string;
	const verifyTkn = `USER:EVTKN:${tkn}`;
	const username = await c.env.SESSION.get(verifyTkn);
	if (!username) {
		await repoLogCreateCrit(c, `Bad email verification token: '${tkn}'`);
		return showMessagePageResponse(c, 'Invalid email verification token!', 400);
	}
	await repoUserUpdate(c, username!, { emailVerified: true, verifyTkn: '' });
	await c.env.SESSION.delete(verifyTkn);
	return showMessagePageResponse(c, 'Your email is verified. You can login with the credentials you entered!', 200);
});

app.get('/login', function (ctx) {
	console.log('Inside GET/login route');
	const tkn = crypto.randomUUID();
	//ctx.set('csrfTkn', tkn)
	return ctx.html(<LoginPage ctx={ctx} csrfToken={tkn} />)
});

app.post('/login', async function (ctx) {
	console.log('Inside POST/login/password route');
	const body = await ctx.req.parseBody();
	const csrfTkn = body['_csrf'] as string;
	// if (csrfTkn != c.get('csrfTkn')) {
	// 	console.error('BAD CSRF TOKEN!');
	// 	///TODO: Log this!!! then clear everything and exit app with bad status
	// }
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
		return ctx.html(<LoginPage ctx={ctx} csrfToken={csrfTkn} message={error} />, 400);
	}
	await repoUserUpdate(ctx, username, { lastLogin: new Date() });
	await createSession(ctx, username, 3);
	return showMessagePageResponse(ctx, `Login success--Welcome '${username}'!`, 200);
});

export default app
