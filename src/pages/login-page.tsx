import { Context } from 'hono';
import { Layout } from './layout';
import { html } from 'hono/html';

export function LoginPage({ ctx, csrfToken, message }: { ctx: Context, csrfToken: string, message?: string | undefined }) {
	return (
		<Layout title='Login' ctx={ctx}>
			<style>
			.fade-me-out.htmx-swap &lbrace;
				opacity: 0; 
				transition: opacity 1s ease-out;
			&rbrace;
			</style>
			{message != undefined ?
				<div
					className="toast toast-top toast-end fade-me-out"
					hx-swap="outerHTML swap:5s"
				>
					<div className="alert alert-error">
						<span>{message}</span>
					</div>
				</div>
				: null}
			<div class="text-2xl mb-4">Login</div>
			<form action="/auth/login" method="post">
				<label class="input input-bordered flex items-center gap-2 mb-2">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 opacity-70"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" /></svg>
					<input type="text" name="username" class="grow bg-transparent w-full max-w-xs" placeholder="Username" required />
				</label>
				<label class="input input-bordered flex items-center gap-2 mb-2">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 opacity-70"><path fill-rule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clip-rule="evenodd" /></svg>
					<input type="password" name="password" class="grow bg-transparent w-full max-w-xs" placeholder="Password" required />
				</label>
				<input type="hidden" name="_csrf" value={csrfToken} />
				<button className="btn btn-primary" type="submit">Login</button>
			</form>
		</Layout>
	);
};

/**
<script type="text/javascript" src="/static/js/clear-toast.js" defer />

<section class="prompt">
			<form action="/login/password" method="post">
				<section>
					<label for="username">Username</label>
					<input id="username" name="username" type="text" autocomplete="username" required autofocus />
				</section>
				<section>
					<label for="current-password">Password</label>
					<input id="current-password" name="password" type="password" autocomplete="current-password" required />
				</section>
				<input type="hidden" name="_csrf" value={csrfToken} />
				<button class="btn" type="submit">Sign in</button>
			</form>
			<hr />
			<p class="help">Don't have an account? <a href="/signup">Sign up</a></p>
			<p styles="width: 100%; text-align: center;">---- or ----</p>
			<a class="button google" href="/login/federated/google">Sign in with Google</a>
		</section>
 */