import { Hono } from 'hono';
import { createSession, verifyPasswordReturnUser } from '../lib/auth';
import { renderer } from '../pages/renderer';
import { LoginPage } from '../pages/login';
import { SignupPage } from '../pages/signup';
import type { Env, Vars } from "../types";
import { repoUserCreate, repoUserUpdate } from '../repos/user-repo';
import { repoLogCreateCrit, repoLogCreateError } from '../repos/log-repo';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();
app.use(renderer);

app.get('/signup', function (c) {
	console.log('Inside GET/signup route');
	const tkn = crypto.randomUUID();
	c.set('csrfTkn', tkn)
	return c.render(<SignupPage csrfToken={tkn} />);
});

app.post('/signup', async function (c) {
	console.log('Inside POST/signup route');
	const body = await c.req.parseBody();
	///TODO: Validate chars in following creds
	///TODO: Validate pass & confirm match
	///TODO: Validate username and email are unique
	const csrfTkn = body['_csrf'] as string;
	if (csrfTkn != c.get('csrfTkn')) {
		console.error('BAD CSRF TOKEN!');
		///TODO: Log this!!! then clear everything and exit app with bad status
	}
	const username = body['username'] as string;
	const email = body['email'] as string;
	const plainPass = body['password'] as string;
	await repoUserCreate(c, username, email, plainPass);
	return c.text(`Signup success--Welcome '${username}'!`, 200);
});

app.get('/login', function (c) {
	console.log('Inside GET/login route');
	const tkn = crypto.randomUUID();
	c.set('csrfTkn', tkn)
	return c.render(<LoginPage csrfToken={tkn} />)
});

app.post('/login', async function (c) {
	console.log('Inside POST/login/password route');
	const body = await c.req.parseBody();
	const csrfTkn = body['_csrf'] as string;
	if (csrfTkn != c.get('csrfTkn')) {
		console.error('BAD CSRF TOKEN!');
		///TODO: Log this!!! then clear everything and exit app with bad status
	}
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