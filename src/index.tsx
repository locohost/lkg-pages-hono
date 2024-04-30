import { Hono } from 'hono';
import type { Env, Vars } from "./types";
import homeRoutes from './routes/home-routes';
import loginRoutes from './routes/login-routes';
import signupRoutes from './routes/signup-routes';
import adminRoutes from './routes/admin-routes';
import userRoutes from './routes/user-routes';
import { getSessionAuth } from './routes/_middleware';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();
app.use('*', getSessionAuth);

app.route('/', homeRoutes);
app.route('/', signupRoutes);
app.route('/', loginRoutes);
app.route('/', adminRoutes);
app.route('/user', userRoutes);

export default app

