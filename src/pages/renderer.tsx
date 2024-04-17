import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, title }) => {
	return (
		<html>
			<head>
				<link
					href="/static/css/daisyui-2.6.0-dist-full.css"
					rel="stylesheet"
					type="text/css"
				/>
				<script src="/static/js/tailwindcss.js"></script>
				<title>{title}</title>
			</head>
			<body class="m-6">{children}</body>
		</html>
	)
})
