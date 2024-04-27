import { Context } from 'hono';
import type { FC } from 'hono/jsx'
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

type Props = {
	children: any;
	title: string;
	ctx: Context;
}

export const Layout: FC<Props> = (props) => {
	return (
		<html>
			<head>
				<title>{props.title}</title>
				<link rel="icon" type="image/x-icon" href="/static/favicon.ico" />
				<link href="/static/css/styles.css" rel="stylesheet" type="text/css" />
				<script src="/static/js/htmx.min.js"></script>
			</head>
			<body class="m-2">
				<Navbar ctx={props.ctx}></Navbar>
				<div class="px-7">
					<div class="toast toast-top toast-end"></div>
					{props.children}
					<Footer></Footer>
				</div>
				<script type="text/javascript" src="/static/js/clear-toast.js" defer />
			</body>
		</html>
	)
}