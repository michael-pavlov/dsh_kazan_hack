const {serverError} = require("./util");
const Koa = require("koa");
const serve = require("koa-static");
const jwt = require("koa-jwt");
const bodyparser = require("koa-bodyparser");
const path = require("path");
const fs = require("fs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const {StaticRouter} = require("react-router-dom");
const {JWT_SECRET} = require("./" + process.env.NODE_ENV + ".cfg.js");
const App = require("../src/App").default;

const app = new Koa();

app.use(function (ctx, next) {
	return next().catch((e) => {
		console.error("Error during processing request: ", e);
		if (401 === e.status) {
			ctx.status = 401;
			ctx.body = {error: 401};
		} else {
			if (e.msg !== "404" && ctx.status === 404) {
				ctx.status = 500;
				ctx.body = {error: e.msg};
			} else {
				throw e;
			}
		}
	});
});
app.use(
	jwt({secret: JWT_SECRET}).unless({
		custom(ctx) {
			return (
				!ctx.path.startsWith("/api") ||
				ctx.path.startsWith("/api/public") ||
				ctx.path.startsWith("/api/doc/analyze") ||
				ctx.path.startsWith("/api/jurs/details") ||
				ctx.path.startsWith("/api/jurs/recall") ||
				ctx.path.startsWith("/api/jurs/pop-jurs")
			);
		},
	}),
);

app.use(bodyparser({jsonLimit: "15mb"}));

require("./jurs").init(app);
require("./user").init(app);
require("./doc").init(app);

let indexFile = "";
const indexFilePath = path.resolve("static/index.html");
fs.readFile(indexFilePath, "utf8", (err, data) => {
	if (err) {
		console.error("Something went wrong:", err);
		throw new Error("Could not read index file");
	} else {
		indexFile = data;
	}
});

app.use(async (ctx, next) => {
	const accepts = ctx.accepts();
	if (accepts.includes("text/html") || accepts.includes("html")) {
		if (indexFile === "") {
			ctx.status = 500;
		} else {
			const app = ReactDOMServer.renderToString(
				<App router={StaticRouter} routerProps={{location: ctx.request.path}} />,
			);
			ctx.body = indexFile.replace('<div id="r"></div>', `<div id="r">${app}</div>`);
			ctx.response.type = "html";
		}
	} else {
		await next();
	}
});
app.use(serve("static"));

app.listen(3000);
