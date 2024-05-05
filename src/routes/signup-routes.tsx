import { Hono } from 'hono';
import type { Env, UploadResp, UserInsert, Vars } from "../types";
import { sendPostmark } from '../lib/email';
import { showToastError, showToastSuccess, showToastInfo, getSiteUrlByEnv, uploadToCFImages } from '../lib/util';
import { Err, KVPrfx } from '../constants';
import { repoLogCreateCrit } from '../repos/log-repo';
import { repoUserCreate, repoUserCreateEmailVerify, repoUserGetByEmail, repoUserGetByUsername, repoUserUpdate } from '../repos/user-repo';
import { repoSessionCreateCsrf, repoSessionGetCsrf } from '../repos/session-repo';
import { HomePage } from '../pages/home-page';
import { SignupPage } from '../pages/signup-page';
import { runAntiCsrfChecks } from './_middleware';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();

app.get('/signup', async function (ctx) {
	//console.log('Inside GET/signup route');
	const tkn = await repoSessionCreateCsrf(ctx);
	return ctx.html(<SignupPage ctx={ctx} csrfToken={tkn} />);
});

app.post('/signup', runAntiCsrfChecks, async function (ctx) {
	if (ctx.get('errMssg')) return showToastError(ctx, ctx.get('errMssg'));
	const body = await ctx.req.parseBody();
	const username = (body['username'] as string).trim();
	const email = (body['email'] as string).trim();
	const plainPass = (body['password'] as string).trim();
	const confirm = (body['confirm'] as string).trim();
	const avatar = body['avatar'] as File;
	if (plainPass != confirm) {
		return showToastInfo(ctx, 'Password and Confirm do not match');
	}
	const reEmail = new RegExp(/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/);
	if (!reEmail.test(email)) {
		return showToastInfo(ctx, "Your email looks weird. It should be similar to: <strong>user@domain.com</strong>.");
	}
	if (email == 'user@domain.com') {
		return showToastInfo(ctx, "Very funny :-D");
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
	// Run avatar file info guards
	const avatarInfo: { name: string, file: File | null } = {
		name: ctx.env.DEFAULT_AVATAR,
		file: null
	};
	if (avatar && avatar.name.length < 4) {
		return showToastError(ctx, 'Avatar file name is blank or too short');
	}
	// Test the avatar fileName type extension
	const ap = avatar.name.split('.');
	const ext = ap[ap.length - 1];
	if (['jpg', 'jpeg', 'png'].indexOf(ext) < 0) {
		return showToastError(ctx, 'Avatar file type must be .jpg, .jpeg or .png');
	}
	avatarInfo.name = avatar.name;
	if (avatar && avatar instanceof File) {
		avatarInfo.file = avatar
	}
	// Upload User avatar to CF Images
	let imgUpload: UploadResp;
	if (avatarInfo.file instanceof File) {
		const ruid = crypto.randomUUID();
		const fileName = `${avatarInfo.name}-${username}-${ruid}`;
		const imageResp = await uploadToCFImages(ctx.env.CF_ACCT_ID, ctx.env.CF_IMAGES_TOKEN, avatarInfo.file, fileName);
		console.log('Image upload resp: ', imageResp);
		//console.log('Image upload resp.json: ', await imageResp.json());
		if (imageResp!.status != 200) {
			return showToastError(ctx, `Avatar file file upload failed: ${imageResp.statusText}`);
		}
		imgUpload = await imageResp.json() as UploadResp;
		console.log('Image upload resp.json: ', imgUpload);
	}
	// All guards passed, avatar uploaded: Create the new user profile
	const newUser = {
		handle: username,
		email: email,
		avatar: imgUpload!.result.id
	} as UserInsert;
	const userResp = await repoUserCreate(ctx, newUser, plainPass);
	if (userResp.error) {
		return showToastError(ctx, userResp.error);
	}
	// Send user email verification token/link
	const url = getSiteUrlByEnv(ctx);
	const href = `${url}/signup/verify-email/${userResp.user!.verifyTkn}`;
	const emailBody = `Please click this link to verify your email address and activate your Late Knight Games new user profile<br/><br/><a href="${href}">Verify this email</a>`;
	const sendResp = await sendPostmark(ctx, userResp.user!.email, 'Please verify your email', emailBody, 'VERIFY-SIGNUP');
	if (sendResp.ErrorCode > 0) {
		return showToastError(ctx, sendResp.Message);
	}
	// Create the user email verification record in db
	await repoUserCreateEmailVerify(ctx, userResp.user!.handle, userResp.user!.verifyTkn);
	return showToastSuccess(ctx, `Signup success--Welcome '${username}'! You cannot login until you click the link in the verification email just sent. It may take a few minutes for that to appear in your inbox.`);
});

app.get('/verify-email/:tkn', async function (c) {
	const tkn = c.req.param('tkn') as string;
	const verifyTkn = `${KVPrfx.EmailVerify}:${tkn}`;
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
