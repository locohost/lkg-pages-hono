export function SignupPage({ csrfToken }: { csrfToken: string }) {
	return (
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
	);
};