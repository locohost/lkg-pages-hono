import { Hono } from 'hono';
import { getExpiration } from '../lib/util';
import { sendPostmark } from '../lib/email';
import type { Env, Vars } from "../types";
import { getSiteUrlByEnv } from '../lib/util';
import { HomePage } from '../pages/home-page';
import { KVPrfx } from '../constants';
import { repoLogCreateCrit } from '../repos/log-repo';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();

app.post('/subscribe', async function (ctx) {
	const body = await ctx.req.parseBody();
	const email = body['email'] as string;
	const url = getSiteUrlByEnv(ctx);
	console.log('siteUrl: ', url);
	const tkn = crypto.randomUUID();
	const exp = getExpiration(48); // Expire unconfirmed sub in 2 days
	await ctx.env.SESSION.put(`${KVPrfx.SubscriberVerify}:${tkn}`, email, { expiration: exp.seconds });
	const emailBody = `Thank you for subcribing! Please click this link to activate your subsription. If you did not send this subscription request, simply delete this email. This subscription request will auto-expire in 2 days.<br /><br /><a href="${url}/admin/confirm-sub/${tkn}">Confirm my subscription</a>`;
	const mssgThanks = 'Thank you for subscribing!';
	const sendResp = await sendPostmark(ctx, email, mssgThanks, emailBody, 'VERIFY-SUB');
	if (sendResp.ErrorCode > 0) {
		///TODO: Clean the error message if on prod
		return ctx.html(<HomePage ctx={ctx} message={sendResp.Message} />);
	}
	return ctx.html(<HomePage ctx={ctx} message={mssgThanks} />);
});

app.get('/confirm-sub/:tkn', async function (ctx) {
	const tkn = ctx.req.param('tkn') as string;
	const email = await ctx.env.SESSION.get(`${KVPrfx.SubscriberVerify}:${tkn}`) as string;
	if (!email) {
		await repoLogCreateCrit(ctx,'');
		return ctx.html(<HomePage ctx={ctx} message='Invalid email verification token!' />);
	}
	ctx.env.SESSION.put(`${KVPrfx.Subscriber}:${email}`, '1');
	ctx.env.SESSION.delete(`${KVPrfx.SubscriberVerify}:${tkn}`);
	const mssgThanks = "Your email subscription is confirmed! We'll send only occassional email updates on web site and game news.";
	return ctx.html(<HomePage ctx={ctx} message={mssgThanks} />);
});

export default app
