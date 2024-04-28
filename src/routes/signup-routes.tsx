import { Hono } from 'hono';
import type { Env, UserInsert, Vars } from "../types";
import { sendPostmark } from '../lib/email';
import { getSiteUrl, showToastError, showToastSuccess, showToastInfo } from '../lib/util';
import { SignupPage } from '../pages/signup-page';
import { repoUserCreate, repoUserCreateEmailVerify, repoUserGetByEmail, repoUserGetByUsername, repoUserUpdate } from '../repos/user-repo';
import { repoLogCreateCrit, repoLogCreateError } from '../repos/log-repo';
import { MDAvatar } from '../constants';
import { HomePage } from '../pages/home-page';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();

app.get('/signup', function (ctx) {
	console.log('Inside GET/signup route');
	const tkn = crypto.randomUUID();
	ctx.set('csrfTkn', tkn)
	return ctx.html(<SignupPage ctx={ctx} csrfToken={tkn} />);
});

app.post('/signup', async function (ctx) {
	console.log('Inside POST/signup route');
	const body = await ctx.req.parseBody();
	const username = body['username'] as string;
	const email = body['email'] as string;
	const plainPass = body['password'] as string;
	const confirm = body['confirm'] as string;
	const avatar = body['avatar'] as File;
	const csrfTkn = body['_csrf'] as string;
	if (csrfTkn != ctx.get('csrfTkn') as string) {
		console.error('BAD CSRF TOKEN!');
		///TODO: Log this!!! then clear everything and exit app with bad status
	}
	if (plainPass != confirm) {
		return showToastInfo(ctx, 'Password and Confirm do not match');
	}
	///TODO: Validate chars in following creds
	let checkResp = await repoUserGetByUsername(ctx, username);
	if (checkResp.user) {
		return showToastInfo(ctx, `Username '${username}' already exists. Did you mean to login? If not, please try a different username`);
	}
	checkResp = await repoUserGetByEmail(ctx, email);
	if (checkResp.user) {
		return showToastInfo(ctx, `Email '${email}' already exists. Did you mean to login?`);
	}
	// All guards passed, create the new user profile
	const newUser = {
		handle: username,
		email: email,
		avatar: MDAvatar
	} as UserInsert;
	const userResp = await repoUserCreate(ctx, newUser, plainPass);
	if (userResp.error) {
		return showToastError(ctx, userResp.error);
	}
	// Upload User avatar to R2
	if (avatar.name) {
		const avatarPath = `/static/avatar/${avatar.name}`;
		const avatarBuff = await avatar.arrayBuffer();
		const r2Obj = await ctx.env.LNG_BUCKET.put(avatarPath, avatarBuff);
		console.log('r2Obj: ', r2Obj);
	}
	const url = getSiteUrl(ctx);
	const href = `${url}/verify-email/${userResp.user!.verifyTkn}`;
	const emailBody = `Please click this link to verify your email address and activate your Late Knight Games new user profile<br/><br/><a href="${href}">Verify this email</a>`;
	const sendResp = await sendPostmark(ctx, userResp.user!.email, 'Please verify your email', emailBody);
	if (sendResp.ErrorCode > 0) {
		return showToastError(ctx, sendResp.Message);
	}
	await repoUserCreateEmailVerify(ctx, userResp.user!.handle, userResp.user!.verifyTkn);
	return showToastSuccess(ctx, `Signup success--Welcome '${username}'! You cannot login until you click the link in the verification email just sent. It may take a few minutes for that to appear in your inbox.`);
});

app.get('/verify-email/:tkn', async function (c) {
	const tkn = c.req.param('tkn') as string;
	const verifyTkn = `USER:EVTKN:${tkn}`;
	const username = await c.env.SESSION.get(verifyTkn);
	if (!username) {
		await repoLogCreateCrit(c, `Bad email verification token: '${tkn}'`);
		return c.html(<HomePage ctx={c} message='Invalid email verification token!' />);
	}
	await repoUserUpdate(c, username!, { emailVerified: true, verifyTkn: '' });
	await c.env.SESSION.delete(verifyTkn);
	return c.html(<HomePage ctx={c} message='Your email is verified. You can login with the credentials you entered!' />);
});

export default app

/*
<input class="w-full max-w-xs rounded-md input input-bordered bg-inherit" type="file" id="avatar" name="avatar" />

app.post("/signup", async (c) => {
		///TODO: Add Zod code to verify body data
		const body = await c.req.parseBody<SignupBody>();
		const { username, email, pass, confirm, avatar } = body;
		if (pass !== confirm)
				return c.html(
						ToastError("Password and pass confirm do not match"),
						500
				);
		///TODO: Include folder path to avatar name
		const avatarPath = `assets/static/avatars/${avatar.name}`;
		const user = { username, email, pass, avatarurl: avatarPath } as User;
		// Verify Username and Email uniquenes
		const verify = await verifyUserDoesNotExist(c, user); // <== Will throw an Error
		if (verify.error !== undefined)
				return c.html(ToastError(verify.error), 500);
		const createErr = await repoUserCreate(c, user); // <== Will verify Username and Email
		if (typeof createErr === "string")
				return c.html(ToastError(createErr), 500);
		// Upload player avatar to R2
		const avatarBuff = await avatar.arrayBuffer();
		const mpu = await c.env.LNG_BUCKET.put(avatarPath, avatarBuff);
		return c.html(ToastInfo(`Welcome ${username}! You can login now.`));
});
*/
