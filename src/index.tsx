import { Hono } from 'hono';
import type { KVNamespace } from '@cloudflare/workers-types';
import { renderer } from './renderer';
import type { User, Sess } from "./types";
import { sessionAuth, hashPassword, createSession, createUser } from './auth';
import { LoginPage } from './pages/login';
import { SignupPage } from './pages/signup';

type Env = {
	SESSION: KVNamespace,
	SESS_SECRET: string,
	SALT: string
}
type Vars = {
	sess: Sess
}

const app = new Hono<{ Bindings: Env, Variables: Vars }>();
app.use(renderer);

app.get('/', function (c) {
	return c.render(<h1>Hello!</h1>);
});

app.get('/protected', sessionAuth, function (c) {
	const sess = c.get('sess');
	console.log('sess: ', sess);
	return c.render(<h1>Protected, but you have a login session!</h1>)
});

app.get('/signup', function (c) {
	console.log('Inside GET/signup route');
	return c.render(<SignupPage csrfToken="tkn123" />)
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
	await createUser(c.env.SESSION, username, email, plainPass);
	return c.text(`Signup success--Welcome '${username}'!`, 200);
});

app.get('/login', function (c) {
	console.log('Inside GET/login route');
	return c.render(<LoginPage csrfToken="tkn876" />)
});

app.post('/login/password', async function (c) {
	console.log('Inside POST/login/password route');
	const body = await c.req.parseBody();
	const username = body['username'] as string;
	const plainPass = body['password'] as string;
	const userStr = await c.env.SESSION.get(`USER:${username}`);
	if (userStr == null) {
		return c.text('Invalid username', 400);
	}
	const user: User = JSON.parse(userStr);
	///TODO: Validate user.del and user.lockedReason props
	const { pass } = await hashPassword(plainPass, user.salt);
	//console.log('user.pass: ', user.pass);
	//console.log('input pass: ', pass);
	if (user.pass != pass) {
		///TODO: Increment user.loginFails
		///TODO: If user.loginFails > 2 then set user.lockedReason
		return c.body('Invalid password', 401);
	}
	await createSession(c, c.env.SESSION, username, 3);
	return c.body(`Login success--Welcome '${user}'!`, 200);
});

export default app
