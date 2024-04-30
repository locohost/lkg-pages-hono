import { Hono } from 'hono';
import { forceLogin } from './_middleware';
import type { Env, User, Vars } from "../types";
import { UserListPage } from '../pages/user-list-page';
import { repoUserGetAll } from '../repos/user-repo';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();

// Routes prefix is /user

app.get('/all', async function (ctx) {
	const sess = ctx.get('sess');
	const users = await repoUserGetAll(ctx);
	return ctx.html(<UserListPage ctx={ctx} users={users} />);
});

export default app
