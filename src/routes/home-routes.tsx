import { Hono } from 'hono';
import { forceLogin } from './_middleware';
import type { Env, Vars } from "../types";
import { HomePage } from '../pages/home-page';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();

app.get('/', function (ctx) {
	return ctx.html(<HomePage ctx={ctx} />);
});

app.get('/protected', forceLogin, async function (ctx) {
	const sess = ctx.get('sess');
	console.log('/protected GET: sess: ', sess);
	return ctx.body('<h1>Protected, but you have session permission');
});

export default app
