import { Context } from 'hono';
import { Layout } from './layout';
import { User } from '../types';

export function UserListPage({ ctx, users }: { ctx: Context, users: User[] }) {
	return (
		<Layout title='Users' ctx={ctx}>
			<div className="bg-base-200 m-2">
				<div className="overflow-x-auto">
					<table className="table">
						{/* head */}
						<thead>
							<tr>
								<th>
									<label>
										<input type="checkbox" className="checkbox" />
									</label>
								</th>
								<th>User</th>
								<th>Last Login</th>
								<th>Fails</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{users.forEach(user => (
								<tr>
									<th>
										<label>
											<input type="checkbox" className="checkbox" />
										</label>
									</th>
									<td>
										<div className="flex items-center gap-3">
											<div className="avatar">
												<div className="mask mask-squircle w-12 h-12">
													<img src="/tailwind-css-component-profile-2@56w.png" alt="Avatar Tailwind CSS Component" />
												</div>
											</div>
											<div>
												<div className="font-bold">{user.handle}</div>
												<div className="text-sm opacity-50">{user.email}</div>
											</div>
										</div>
									</td>
									<td>
										{user.lastLogin}
										<br />
										<span className="badge badge-ghost badge-sm">{user.lastLoginIp}</span>
									</td>
									<td>{user.loginFails}</td>
									<th>
										<button className="btn btn-ghost btn-xs">details</button>
									</th>
								</tr>
							))}
						</tbody>
						{/* foot */}
						<tfoot>
							<tr>
								<th></th>
								<th>Handle</th>
								<th>Last Login</th>
								<th>Fails</th>
								<th></th>
							</tr>
						</tfoot>

					</table>
				</div>
			</div>
		</Layout>
	);
};
