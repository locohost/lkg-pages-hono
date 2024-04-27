import { Context } from 'hono';
import { Layout } from './layout';
import { html } from 'hono/html';

export function HomePage({ ctx, message }: { ctx: Context, message?: string }) {
	return (
		<Layout title='Home' ctx={ctx}>
			{message ? html`
			<div role="alert" class="alert alert-success">
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				<span>${message}</span>
			</div>
			` : null}
			<div className="hero min-h-screen bg-base-200">
				<div className="hero-content text-center">
					<div className="max-w-md">
						<h1 className="text-5xl font-bold">Welcome to Late Knight Games!</h1>
						<p className="py-6">Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem quasi. In deleniti eaque aut repudiandae et a id nisi.</p>
						<button className="btn btn-primary">Get Started</button>
					</div>
				</div>
			</div>
		</Layout>
	);
};
