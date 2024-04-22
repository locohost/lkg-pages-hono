import { Hono } from 'hono';
import type { Env, Vars } from "./types";
import homeRoutes from './routes/home-routes';
import authRoutes from './routes/auth-routes';
import adminRoutes from './routes/admin-routes';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();

app.route('/', homeRoutes);
app.route('/auth', authRoutes);
app.route('/admin', adminRoutes);

export default app

