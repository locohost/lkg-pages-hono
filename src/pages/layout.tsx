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
					<style>
						.fade-me-out.htmx-swapping &#123;
						opacity: 0;
						transition: opacity 2s ease-out;
						&#125;</style>
					<div class="toast toast-top toast-end fade-me-out"></div>
					{props.children}
					<Footer></Footer>
				</div>
			</body>
		</html>
	)
}