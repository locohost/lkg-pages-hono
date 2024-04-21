import { Hono } from 'hono';
import { sessionAuth } from '../lib/auth';
import type { Env, Vars } from "../types";
import { HomePage } from '../pages/home';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();

app.get('/', function (c) {
	return c.html(<HomePage ctx={c} />);
});

app.get('/protected', sessionAuth, async function (c) {
	const sess = c.get('sess');
	console.log('sess: ', sess);
	return c.body('<h1>Protected, but you have permission');
});

export default app
