import { Context } from 'hono';
import { Layout } from './layout';

export function MessagePage({ ctx, message }: { ctx: Context, message: string }) {
	return (
		<Layout title='Thanks!' ctx={ctx}>
			<div class="text-xl mb-4">{message}</div>
		</Layout>
	);
};
