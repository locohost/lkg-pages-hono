import { Hono, Context, Next } from 'hono';
import type { KVNamespace } from '@cloudflare/workers-types';
import { renderer } from './renderer';
import { getCookie, setCookie } from 'hono/cookie';
import { LoginPage } from './pages/login';
import { SignupPage } from './pages/signup';

type Env = {
	SESSION: KVNamespace,
	SESS_SECRET: string,
	SALT: string
}
type User = {
	email: string;
	pass: string;
	created: Date;
	lastLogin: Date;
	loginFails: number;
	lockedReason: string;
	del: boolean;
}
type Sess = {
	id: string;
	username: string;
	email: string;
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
	///TODO: Validate username and email are unique
	const username = body['username'] as string;
	const email = body['email'] as string;
	const plainPass = body['password'] as string;
	// Save new User to KV
	const pass = await hashPassword(plainPass, c.env.SALT);
	const user: User = {
		email, pass: pass, created: new Date(), loginFails: 0, lastLogin: new Date(), lockedReason: '', del: false
	};
	console.log('user', user);
	await c.env.SESSION.put(`USER:${username}`, JSON.stringify(user));
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
	const pass = await hashPassword(plainPass, c.env.SALT);
	console.log('user.pass: ', user.pass);
	console.log('input pass: ', pass);
	if (user.pass != pass) {
		///TODO: Increment user.loginFails
		///TODO: If user.loginFails > 2 then set user.lockedReason
		return c.body('Invalid password', 401);
	}
	const sessId = crypto.randomUUID();
	// Expire session in 3 hrs
	const d = new Date();
	const expMilliseconds = Math.round(d.getTime() + (3 * 60 * 60 * 1000))
	const expSeconds = expMilliseconds / 1000;
	setCookie(c, 'session', sessId, {
		path: '/',
		secure: true,
		httpOnly: true,
		expires: new Date(expMilliseconds),
	});
	await c.env.SESSION.put(`SESS:${sessId}`, username, { expiration: expSeconds });
	return c.body(`Login success--Welcome '${user}'!`, 200);
});

async function sessionAuth(c: Context, next: Next) {
	const sessId = getCookie(c, 'session');
	console.log('sessionAuth sessId: ', sessId);
	if (sessId == null) {
		return c.redirect('/login', 302);
	}
	const username: string = await c.env.SESSION.get(`SESS:${sessId}`);
	const userStr: string = await c.env.SESSION.get(`USER:${username}`);
	const user: User = userStr != null ? JSON.parse(userStr) : null;
	const sess = { "id": sessId, "username": username, "email": user.email } as Sess;
	c.set('sess', sess);
	return await next();
}

async function hashPassword(plainPass: string, salt: string): Promise<string> {
	const myText = new TextEncoder().encode(plainPass + salt);
	const myDigest = await crypto.subtle.digest(
		{ name: 'SHA-256' }, myText // The data you want to hash as an ArrayBuffer
	);
	// Turn it into a hex string
	const hexString = [...new Uint8Array(myDigest)]
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');
	return hexString;
}
export default app
