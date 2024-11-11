import { css, Style } from 'hono/css'

import type { Context } from 'hono'
import type { FC } from 'hono/jsx'
import type { App } from './types'

export async function getAboutPage(c: Context<App>): Promise<Response> {
	return c.html(<HomePage />)
}

const HomePage: FC = () => {
	return (
		<Layout>
			<div className="container">
				<header>
					{/* <img className="profile-image" src="https://i.uuid.rocks/icons/notion/pypy.png" /> */}
					<h1>PyMirror</h1>
					<p>Unofficial pyenv mirror</p>
				</header>
				<main>
					<h2>About</h2>
					<p>
						<a href="https://github.com/pyenv/pyenv">Pyenv</a> is a simple and powerfull python
						version and environment management tool. This mirror speeds up downloads of python
						source files by caching with{' '}
						<a href="https://www.cloudflare.com/products/cache-reserve/">
							Cloudflare Cache Reserve
						</a>{' '}
						using <a href="https://workers.cloudflare.com/">Cloudflare Workers</a>.
					</p>
					<h2>Usage</h2>
					<p>
						<code>export PYTHON_BUILD_MIRROR_URL="https://pymirror.com/dist/python/"</code>
					</p>
				</main>
				<footer>
					<p>
						Made with 🧡 by <a href="https://github.com/jahands/pyenv-mirror">jahands</a>
					</p>
					<p>
						<small>
							<em>
								Forked from{' '}
								<a href="https://github.com/S0urceC0der/pyenv-mirror">S0urceC0der/pyenv-mirror</a>
							</em>
						</small>
					</p>
				</footer>
			</div>
		</Layout>
	)
}

const Layout: FC = (props) => {
	return (
		<html>
			<head>
				<title>PyMirror</title>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				{/* <!-- Open Graph Meta Tags --> */}
				<meta property="og:title" content="PyMirror" />
				<meta
					property="og:description"
					content="Unofficial pyenv mirror hosted on Cloudflare Workers"
				/>
				{/* <meta property="og:image" content="https://yourwebsite.com/path-to-your-image.jpg"> */}
				<meta property="og:url" content="https://pymirror.com" />
				<meta property="og:type" content="website" />
				<Style>{css`
					/* Global Styles */
					body {
						font-family: Arial, sans-serif;
						margin: 0;
						padding: 0;
						background-color: #121212;
						color: #e0e0e0;
						line-height: 1.6;
					}

					/* Container */
					.container {
						max-width: 800px;
						margin: 0 auto;
						padding: 20px;
						background-color: #1e1e1e;
						box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
					}

					/* Header */
					header {
						text-align: center;
						margin-bottom: 40px;
					}

					header h1 {
						font-size: 2.5em;
						margin-bottom: 10px;
						color: #e0e0e0;
					}

					header p {
						font-size: 1.2em;
						color: #b0b0b0;
					}

					/* Main Content */
					main {
						padding: 20px;
					}

					main h2 {
						font-size: 2em;
						margin-bottom: 20px;
						color: #e0e0e0;
					}

					main p {
						margin-bottom: 20px;
						font-size: 1.1em;
						color: #b0b0b0;
					}

					/* Profile Image */
					.profile-image {
						float: left;
						width: 150px;
						height: 150px;
						border-radius: 50%;
						margin-right: 20px;
						margin-bottom: 20px;
						box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
					}

					/* Links */
					a {
						color: #1e90ff;
						text-decoration: none;
						font-weight: bold;
					}

					a:hover {
						color: #ff6347;
						text-decoration: underline;
					}

					/* Clearfix for Floats */
					.clearfix::after {
						content: '';
						clear: both;
						display: table;
					}

					/* Footer */
					footer {
						text-align: center;
						padding: 20px;
						margin-top: 40px;
						background-color: #333;
						color: #e0e0e0;
					}

					footer p {
						margin: 0;
						font-size: 0.9em;
					}
				`}</Style>
			</head>
			<body>{props.children}</body>
		</html>
	)
}
