import { Hono } from 'hono';
import { forceLogin, runAntiCsrfChecks } from './_middleware';
import type { Env, User, Vars } from "../types";
import { UserListPage } from '../pages/user-list-page';
import { repoUserGetAll } from '../repos/user-repo';
import { PasswordChangePage } from '../pages/pass-change-page';
import { repoSessionCreateCsrf } from '../repos/session-repo';
import { showToastError, showToastInfo, showToastSuccess } from '../lib/util';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();

// Routes prefix is /user

app.get('/change-pass/:tkn', async function (ctx) {
	const tkn = ctx.req.param('tkn');
	///TODO: Verify the change pass token received
	const csrf = await repoSessionCreateCsrf(ctx);
	return ctx.html(<PasswordChangePage ctx={ctx} csrfToken={csrf} />);
});

app.post('/change-pass', runAntiCsrfChecks, async function (ctx) {
	if (ctx.get('errMssg')) return showToastError(ctx, ctx.get('errMssg'));
	let { email, password, confirm }: { email: string, password: string, confirm: string } = await ctx.req.parseBody();
	password = password.trim(); confirm = confirm.trim();
	if (password != confirm) {
		return showToastError(ctx, 'Password and Confirm do not match');
	}
	///TODO: Change user password in db
	return showToastSuccess(ctx, 'Try logging in now with your new password.')
});

app.get('/all', forceLogin, async function (ctx) {
	const sess = ctx.get('sess');
	const users = await repoUserGetAll(ctx);
	return ctx.html(<UserListPage ctx={ctx} users={users} />);
});

export default app
