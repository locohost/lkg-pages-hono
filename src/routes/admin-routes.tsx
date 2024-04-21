import { Hono } from 'hono';
import { sendEmail } from '../lib/auth';
import type { Env, Vars } from "../types";
import { MessagePage } from '../pages/message';

const app = new Hono<{ Bindings: Env, Variables: Vars }>();

app.post('/subscribe', async function (ctx) {
	const body = await ctx.req.parseBody();
	const email = body['email'] as string;
	const emailBody = `Thank you for subcribing! Please click this link to activate your subsription. If you did not send this subscription request, simply delete this email. This subscription request will auto-expire in 2 days.`;
	const mssgThanks = 'Thank you for subscribing!';
	await sendEmail(ctx, email, mssgThanks, emailBody);
	return ctx.html(<MessagePage ctx={ctx} message={mssgThanks} />);
});

export default app
