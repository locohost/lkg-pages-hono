import { Hono } from 'hono';
import { renderer } from './pages/renderer';
import { sessionAuth } from './lib/auth';
import type { Env,Vars } from "./types";
import authRoutes from './routes/auth-routes';

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

app.route('/auth', authRoutes);

export default app
