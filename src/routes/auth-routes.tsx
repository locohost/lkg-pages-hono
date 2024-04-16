import { Hono } from 'hono';
import { createSession, createUser, verifyPasswordEnteredGetUser } from '../auth';
import { renderer } from '../renderer';
import { LoginPage } from '../pages/login';
import { SignupPage } from '../pages/signup';
import type { Env, Vars } from "../types";

const app = new Hono<{ Bindings: Env, Variables: Vars }>();
app.use(renderer);

app.get('/signup', function (c) {
	console.log('Inside GET/signup route');
	const tkn = crypto.randomUUID();
	return c.render(<SignupPage csrfToken={tkn} />);
});

app.post('/signup', async function (c) {
	console.log('Inside POST/signup route');
	const body = await c.req.parseBody();
	///TODO: Validate chars in following creds
	///TODO: Validate pass & confirm match
	///TODO: Validate username and email are unique
	const username = body['username'] as string;
	const email = body['email'] as string;
	const plainPass = body['password'] as string;
	await createUser(c, 'SESSION', username, email, plainPass);
	return c.text(`Signup success--Welcome '${username}'!`, 200);
});

app.get('/login', function (c) {
	console.log('Inside GET/login route');
	const tkn = crypto.randomUUID();
	return c.render(<LoginPage csrfToken={tkn} />)
});

app.post('/login', async function (c) {
	console.log('Inside POST/login/password route');
	const body = await c.req.parseBody();
	const username = body['username'] as string;
	const plainPass = body['password'] as string;
	const { user, error } = await verifyPasswordEnteredGetUser(c, 'SESSION', username, plainPass);
	if (error != null) {
		// If user is null, then we got a bad username
		if (user != null) {
			// If we have a user and error, this must be invalid pass
			user!.loginFails += 1;
			if (user.loginFails >= 3) {
				user.lockedReason = 'Too many failed login attempts';
			}
			await c.env.SESSION.put(`USER:${username}`, JSON.stringify(user));
		}
		return c.body(error, 401);
	}
	await createSession(c, 'SESSION', username, 3);
	return c.body(`Login success--Welcome '${username}'!`, 200);
});

export default app
