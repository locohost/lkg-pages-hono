import { Hono } from 'hono';
import { repoUserCreate, repoUserUpdate } from '../repos/user-repo';
import { repoLogCreateCrit, repoLogCreateError } from '../repos/log-repo';
import { createSession, sendEmail, verifyPasswordReturnUser } from '../lib/auth';
import { LoginPage } from '../pages/login';
import { SignupPage } from '../pages/signup';
import type { Env, Vars } from "../types";
import { getSiteUrl } from '../lib/util';

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
	const userResp = await repoUserCreate(ctx, username, email, plainPass);
	if (userResp.error) {
		return ctx.body(`Oh no! '${userResp.error}'`, 400);
	}
	const url = getSiteUrl(ctx);
	const href = `${url}/auth/verify-email/${userResp.user!.verifyTkn}`;
	const emailBody = `Please click this link to verify your email address and activate your Late Knight Games new user profile<br/><br/><a href="${href}">Verify this email</a>`;
	const sent = await sendEmail(ctx, userResp.user!.email, 'Please verify your email', emailBody);
	///TODO: Check sent for error and handle
	await ctx.env.SESSION.put(`USER:EVTKN:${userResp.user!.verifyTkn}`, userResp.user!.handle);
	return ctx.body(`Signup success--Welcome '${username}'! You cannot login until you click the link in the verification email just sent. It may take a few minutes for that to appear in your inbox.`, 200);
});

app.get('/verify-email/:tkn', async function (c) {
	const tkn = c.req.param('tkn') as string;
	const verifyTkn = `USER:EVTKN:${tkn}`;
	const username = await c.env.SESSION.get(verifyTkn);
	if (!username) {
		await repoLogCreateCrit(c, `Bad email verification token: '${tkn}'`);
		return c.body('Invalid email verification token');
	}
	await repoUserUpdate(c, username!, { emailVerified: true, verifyTkn: '' });
	await c.env.SESSION.delete(verifyTkn);
	return c.body('Your email is verified. You can login with the credentials you  entered!');
});

app.get('/login', function (ctx) {
	console.log('Inside GET/login route');
	const tkn = crypto.randomUUID();
	//ctx.set('csrfTkn', tkn)
	return ctx.html(<LoginPage ctx={ctx} csrfToken={tkn} />)
});

app.post('/login', async function (c) {
	console.log('Inside POST/login/password route');
	const body = await c.req.parseBody();
	// const csrfTkn = body['_csrf'] as string;
	// if (csrfTkn != c.get('csrfTkn')) {
	// 	console.error('BAD CSRF TOKEN!');
	// 	///TODO: Log this!!! then clear everything and exit app with bad status
	// }
	const username = body['username'] as string;
	const plainPass = body['password'] as string;
	const { user, error } = await verifyPasswordReturnUser(c, username, plainPass);
	if (error) {
		// If user is not null, then we received bad username
		if (user) {
			// If we have a user and error, this must be invalid pass
			await repoLogCreateError(c, 'Bad password submitted', username);
			const fails = user!.loginFails += 1;
			await repoUserUpdate(c, username, { loginFails: fails });
			if (user.loginFails >= 3) {
				await repoUserUpdate(c, username, { lockedReason: 'Too many failed login attempts' });
				await repoLogCreateCrit(c, 'User locked: Too many failed login attempts', username);
			}
		}
		return c.body(error, 401);
	}
	await repoUserUpdate(c, username, { lastLogin: new Date() });
	await createSession(c, username, 3);
	return c.body(`Login success--Welcome '${username}'!`, 200);
});

export default app
