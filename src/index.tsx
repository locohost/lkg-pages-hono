import { Hono } from 'hono';
import { sendPostmark, sessionAuth } from './lib/auth';
import type { Env, Vars } from "./types";
import { HomePage } from './pages/home';
import authRoutes from './routes/auth-routes';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();

app.get('/', function (c) {
	return c.html(<HomePage ctx={c} />);
});

app.get('/protected', sessionAuth, async function (c) {
	const sess = c.get('sess');
	console.log('sess: ', sess);
	await sendPostmark(c.env.PM_TKN, 'locohost@gmail.com', 'Hello test', 'Hello test body');
	return c.body('<h1>Protected, but you have permission. Just sent test email!</h1>');
});

app.route('/auth', authRoutes);

export default app

