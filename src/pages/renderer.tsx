import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, title }) => {
	return (
		<html>
			<head>
				<title>{title}</title>
				<link rel="icon" type="image/x-icon" href="/static/favicon.ico"></link>
				<link href="/static/css/styles.css" rel="stylesheet" type="text/css" />
			</head>
			<body class="m-6">{children}</body>
		</html>
	)
})
