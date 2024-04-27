import { Context } from 'hono';
import { Layout } from './layout';
import { html } from 'hono/html';

export function SignupPage({ ctx, csrfToken }: { ctx: Context, csrfToken: string }) {
	return (
		<Layout title="Signup" ctx={ctx}>
			<div class="text-2xl mb-4">Sign up</div>
			<form hx-post="/auth/signup" hx-target=".toast" hx-swap="innerHTML">
				<label class="input input-bordered flex items-center gap-2 mb-2">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 opacity-70"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" /></svg>
					<input type="text" name="username" class="grow bg-transparent w-full max-w-xs" placeholder="Username" required />
				</label>
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
				<button className="btn btn-primary" type="submit">Sign up</button>
			</form>
		</Layout>
	);
};

/**
			<label class="input input-bordered flex items-center gap-2">
				<input type="text" class="grow" placeholder="Search" />
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 opacity-70"><path fill-rule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clip-rule="evenodd" /></svg>
			</label>


<section class="prompt">
			<h1>Sign up</h1>
			<form action="/signup" method="post">
				<section>
					<label for="username">Username</label>
					<input id="username" name="username" type="text" autocomplete="username" required />
				</section>
				<section>
					<label for="email">Email</label>
					<input id="email" name="email" type="text" autocomplete="email" required />
				</section>
				<section>
					<label for="new-password">Password</label>
					<input id="new-password" name="password" type="password" autocomplete="new-password" required />
				</section>
				<input type="hidden" name="_csrf" value={csrfToken} />
				<button type="submit">Sign up</button>
			</form>
			<hr />
			<p class="help">Already have an account? <a href="/login">Sign in</a></p>
		</section>

 */