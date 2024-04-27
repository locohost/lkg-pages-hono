import { Hono } from 'hono';
import type { Env, UserInsert, Vars } from "../types";
import { getExpiration, verifyPasswordReturnUser } from '../lib/auth';
import { sendPostmark } from '../lib/email';
import { getSiteUrl, showToastError, showToastSuccess, showToastInfo } from '../lib/util';
import { LoginPage } from '../pages/login-page';
import { SignupPage } from '../pages/signup-page';
import { repoUserCreate, repoUserCreateEmailVerify, repoUserGetByEmail, repoUserGetByUsername, repoUserUpdate } from '../repos/user-repo';
import { repoLogCreateCrit, repoLogCreateError } from '../repos/log-repo';
import { MDAvatar } from '../constants';
import { repoSessionCreate } from '../repos/session-repo';
import { setCookie } from 'hono/cookie';
import { HomePage } from '../pages/home-page';

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
	if (csrfTkn != ctx.get('csrfTkn') as string) {
		console.error('BAD CSRF TOKEN!');
		///TODO: Log this!!! then clear everything and exit app with bad status
	}
	if (plainPass != confirm) {
		return showToastInfo(ctx, 'Password and Confirm do not match');
	}
	///TODO: Validate chars in following creds
	let checkResp = await repoUserGetByUsername(ctx, username);
	if (checkResp.user) {
		return showToastInfo(ctx, `Username '${username}' already exists. Did you mean to login? If not, please try a different username`);
	}
	checkResp = await repoUserGetByEmail(ctx, email);
	if (checkResp.user) {
		return showToastInfo(ctx, `Email '${email}' already exists. Did you mean to login?`);
	}
	// All guards passed, create the new user profile
	const newUser = {
		handle: username,
		email: email,
		avatar: MDAvatar
	} as UserInsert;
	const userResp = await repoUserCreate(ctx, newUser, plainPass);
	if (userResp.error) {
		return showToastError(ctx, userResp.error);
	}
	const url = getSiteUrl(ctx);
	const href = `${url}/auth/verify-email/${userResp.user!.verifyTkn}`;
	const emailBody = `Please click this link to verify your email address and activate your Late Knight Games new user profile<br/><br/><a href="${href}">Verify this email</a>`;
	const sendResp = await sendPostmark(ctx, userResp.user!.email, 'Please verify your email', emailBody);
	if (sendResp.ErrorCode > 0) {
		return showToastError(ctx, sendResp.Message);
	}
	await repoUserCreateEmailVerify(ctx, userResp.user!.handle, userResp.user!.verifyTkn);
	return showToastSuccess(ctx, `Signup success--Welcome '${username}'! You cannot login until you click the link in the verification email just sent. It may take a few minutes for that to appear in your inbox.`);
});

app.get('/verify-email/:tkn', async function (c) {
	const tkn = c.req.param('tkn') as string;
	const verifyTkn = `USER:EVTKN:${tkn}`;
	const username = await c.env.SESSION.get(verifyTkn);
	if (!username) {
		await repoLogCreateCrit(c, `Bad email verification token: '${tkn}'`);
		return c.html(<HomePage ctx={c} message='Invalid email verification token!' />);
	}
	await repoUserUpdate(c, username!, { emailVerified: true, verifyTkn: '' });
	await c.env.SESSION.delete(verifyTkn);
	return c.html(<HomePage ctx={c} message='Your email is verified. You can login with the credentials you entered!' />);
});

app.get('/login', function (ctx) {
	console.log('Inside GET/login route');
	const tkn = crypto.randomUUID();
	ctx.set('csrfTkn', tkn)
	return ctx.html(<LoginPage ctx={ctx} csrfToken={tkn} />)
});

app.post('/login', async function (ctx) {
	console.log('Inside POST/login/password route');
	const body = await ctx.req.parseBody();
	const csrfTkn = body['_csrf'] as string;
	const sessTkn = ctx.get('csrfTkn') as string;
	if (csrfTkn != sessTkn) {
		console.error(`BAD CSRF TOKEN! PageTkn:${csrfTkn} SessTkn:${sessTkn}`);
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
	const sessResp = await repoSessionCreate(ctx, user!, exp.seconds);
	if (!sessResp.error) {
		setCookie(ctx, 'session', sessResp.sess!.id, {
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
