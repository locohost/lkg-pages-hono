
export function LoginPage({ csrfToken }: { csrfToken: string }) {
	return (
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
				<button type="submit">Sign in</button>
			</form>
			<hr />
			<p class="help">Don't have an account? <a href="/signup">Sign up</a></p>
			<p styles="width: 100%; text-align: center;">---- or ----</p>
			<a class="button google" href="/login/federated/google">Sign in with Google</a>
		</section>
	);
};
