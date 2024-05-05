import { Context } from 'hono';
import { Layout } from './layout';

export function PasswordChangePage({ ctx, csrfToken }: { ctx: Context, csrfToken: string }) {
	return (
		<Layout title='Login' ctx={ctx}>
			<div class="text-2xl mb-4">Change User Password</div>
			<form hx-post="/user/change-pass" hx-target=".toast" hx-swap="innerHTML">
			<label class="input input-bordered flex items-center gap-2 mb-2">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 opacity-70"><path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" /><path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" /></svg>
					<input type="text" name="email" class="grow bg-transparent w-full max-w-xs" placeholder="Email" required />
				</label>
				<label class="input input-bordered flex items-center gap-2 mb-2">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 opacity-70"><path fill-rule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clip-rule="evenodd" /></svg>
					<input type="password" name="password" class="grow bg-transparent w-full max-w-xs" placeholder="Password" required />
				</label>
				<label class="input input-bordered flex items-center gap-2 mb-2">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 opacity-70"><path fill-rule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clip-rule="evenodd" /></svg>
					<input type="password" name="confirm" class="grow bg-transparent w-full max-w-xs" placeholder="Confirm" required />
				</label>
				<input type="hidden" name="_csrf" value={csrfToken} />
				<button className="btn btn-primary" type="submit">Change</button>
			</form>
		</Layout>
	);
};

/**

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