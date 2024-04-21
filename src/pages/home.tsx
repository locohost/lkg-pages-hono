import { Context } from 'hono';
import { Layout } from './layout';

export function HomePage({ ctx }: { ctx: Context }) {
	return (
		<Layout title='Home' ctx={ctx}>
			<div class="text-2xl mb-4">Home</div>
		</Layout>
	);
};
