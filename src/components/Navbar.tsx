import { Context } from "hono";
import { Sess } from "../types";

export default function Navbar({ ctx }: { ctx: Context }) {
	let { handle, avatar } = (ctx.get('sess') as Sess) ?? { handle: null, avatar: null };
	handle = handle ?? 'Hello!';
	console.debug('Navbar: handle: ', handle);
	avatar = avatar ?? ctx.env.DEFAULT_AVATAR;
	console.debug('Navbar: avatar: ', avatar);
	return (
		<div className="navbar bg-base-100">
			<div className="navbar-start">
				<div className="dropdown">
					<div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
					</div>
					<ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
						<li><a>Item 1</a></li>
						<li>
							<a>Parent</a>
							<ul className="p-2">
								<li><a>Submenu 1</a></li>
								<li><a>Submenu 2</a></li>
							</ul>
						</li>
						<li><a href="/signup">Signup</a></li>
						<li><a href="/login">Login</a></li>
					</ul>
				</div>
				<a className="btn btn-ghost text-xl" href="/">LKG</a>
			</div>
			<div className="navbar-center hidden lg:flex">
				<ul className="menu menu-horizontal px-1">
					<li><a>Item 1</a></li>
					<li>
						<details>
							<summary>Parent</summary>
							<ul className="p-2">
								<li><a>Submenu 1</a></li>
								<li><a>Submenu 2</a></li>
							</ul>
						</details>
					</li>
					<li><a href="/signup">Signup</a></li>
					<li><a href="/login">Login</a></li>
				</ul>
			</div>
			<div className="navbar-end">
				<div className="form-control mx-2">
					<input type="text" placeholder="Search" className="input input-bordered w-24 md:w-auto" />
				</div>
				<div className="dropdown dropdown-end">
					<div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
						<div className="w-10 rounded-full">
							<img alt={handle} src={avatar} />
						</div>
					</div>
					<ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
						<li>
							<a className="justify-between">
								Profile
								<span className="badge">New</span>
							</a>
						</li>
						<li><a>Settings</a></li>
						<li><a>Logout</a></li>
					</ul>
				</div>
			</div>
		</div>
	);
}

