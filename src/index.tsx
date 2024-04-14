import { Hono, Context, Next } from 'hono';
import type { KVNamespace } from '@cloudflare/workers-types';
//import { Buffer } from 'node:buffer';
import { renderer } from './renderer';
import { getCookie, setCookie } from 'hono/cookie';
//import { nanoid } from 'nanoid';
//import * as crypto from 'crypto';
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
	salt: string;
	created: Date;
	lastLogin: Date;
	loginFails: number;
	lockedReason: string;
	del: boolean;
}

const app = new Hono<{ Bindings: Env }>();
app.use(renderer);

app.get('/', function (c) {
	return c.render(<h1>Hello!</h1>)
});

app.get('/protected', sessionAuth, function (c) {
	return c.render(<h1>Hello!</h1>)
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
	console.log('Ready to generate salt now...');

	//const salt = crypto.randomBytes(16).toString('hex');
	//console.log('salt', salt);
	// const pass =
	// 	crypto.pbkdf2Sync(plainPass, salt, 310000, 32, 'sha256').toString('hex');
	const salt = c.env.SALT;
	console.log('salt: ', salt);
	const pass = await hashPassword(plainPass,salt);
	console.log('hashed pass toString(): ', pass.toString());
	const user: User = {
		email, pass: pass.toString(), salt: '', created: new Date(), loginFails: 0, lastLogin: new Date(), lockedReason: '', del: false
	};
	console.log('user', user);
	console.log('userStr', JSON.stringify(user));
	await c.env.SESSION.put(`USER:${username}`, JSON.stringify(user));
	c.status(200);
	return c.text(`Signup success--Welcome !${username}`)
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
		c.status(400);
		return c.text('Invalid username');
	}
	const user: User = JSON.parse(userStr);
	///TODO: Validate user.del and user.lockedReason props
	const salt = c.env.SALT;
	console.log('salt: ', salt);
	const pass = await hashPassword(plainPass, salt);
	if (user.pass != pass) {
		///TODO: Increment user.loginFails
		///TODO: If user.loginFails > 2 then set user.lockedReason
		c.status(401);
		return c.body('Invalid password');
	}
	const sessId = crypto.randomUUID();
	setCookie(c, 'session', sessId, {
		path: '/',
		secure: true,
		httpOnly: true,
		maxAge: 1000,
		expires: new Date(Date.UTC(2024, 4, 14, 23, 59, 59)),
	});
	const d = new Date();
	// 1 day = 86400 seconds
	// Expire session in 3 hrs
	const seconds = Math.round(d.getTime() / 1000) + (60 * 60 * 3);
	await c.env.SESSION.put(`SESS:${sessId}`, username, { expiration: seconds });
	c.status(200);
	return c.body(`Login success--Welcome '${user}'!`);

});

async function sessionAuth(c: Context, next: Next) {
	const sessId = getCookie(c, 'session');
	console.log('session', sessId);
	if (sessId == null) {
		return c.redirect('/login');
	}
	const username: string = await c.env.SESSION.get(`SESS:${sessId}`);
	const userStr: string = await c.env.SESSION.get(`USER:${username}`);
	const user: User = userStr != null ? JSON.parse(userStr) : null;
	c.set('session', { "id": sessId, "username": username, "email": user.email });
	return await next();
}

async function hashPassword(plainPass: string, salt:string): Promise<string> {
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
