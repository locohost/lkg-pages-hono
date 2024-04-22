import { Hono } from 'hono';
import { getExpiration, sendEmail } from '../lib/auth';
import type { Env, Vars } from "../types";
import { MessagePage } from '../pages/message';
import { getSiteUrl, getSiteUrlByEnv } from '../lib/util';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();

app.post('/subscribe', async function (ctx) {
	const body = await ctx.req.parseBody();
	const email = body['email'] as string;
	const url = getSiteUrl(ctx);
	console.log('siteUrl: ', url);
	const tkn = crypto.randomUUID();
	const exp = getExpiration(48); // Expire unconfirmed sub in 2 days
	await ctx.env.SESSION.put(`EMLSUB:${tkn}`, email, { expiration: exp.seconds });
	const emailBody = `Thank you for subcribing! Please click this link to activate your subsription. If you did not send this subscription request, simply delete this email. This subscription request will auto-expire in 2 days.<br /><br /><a href="${url}/admin/confirm-sub/${tkn}">Confirm my subscription</a>`;
	const mssgThanks = 'Thank you for subscribing!';
	await sendEmail(ctx, email, mssgThanks, emailBody);
	return ctx.html(<MessagePage ctx={ctx} message={mssgThanks} />);
});

app.get('/confirm-sub/:tkn', async function (ctx) {
	const tkn = ctx.req.param('tkn') as string;
	const email = await ctx.env.SESSION.get(`EMLSUB:${tkn}`) as string;
	let mssg = 'Invalid email verification token!';
	if (email) {
		ctx.env.SESSION.put(`EMLSUB:${email}`, '1');
		ctx.env.SESSION.delete(`EMLSUB:${tkn}`);
		mssg = "Your email subscription is confirmed! We'll send only occassional email updates on web site and game news.";
	}
	return ctx.html(<MessagePage ctx={ctx} message={mssg} />);
});

export default app
