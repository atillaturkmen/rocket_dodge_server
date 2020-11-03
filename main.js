//omniamorsaequat.com
//https://github.com/DBC201/rocket_dodge_server
require("dotenv").config();
const argv = require("yargs")(process.argv.slice(2))
	.option("no_https", {
		description: "runs http only",
		alias: "n",
		type: "boolean",
		default: false,
	})
	.option("no_redis", {
		description: "does not enable redis",
		alias: "r",
		type: "boolean",
		default: false
	})
	.help().alias("help", "h")
	.parse();

const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require('body-parser');
const session = require("express-session");
const useragent = require('express-useragent');
const https_port = process.env.https_port;
const http_port = process.env.http_port;
const http = require("http");
const https = require('https');

const app = express();

const routes = require(path.join(__dirname, "routes", "index"));



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(useragent.express());

let redis, redisClient, RedisStore, session_parameter;

if (argv.no_redis){
	session_parameter = {
		secret: process.env.secret,
		saveUninitialized: true,
		resave: true
	}
}else{
	redis = require('redis');
	redisClient = redis.createClient();
	RedisStore = require('connect-redis')(session);
	session_parameter = {
		secret: process.env.secret,
		saveUninitialized: true,
		resave: true,
		store: new RedisStore({
			client: redisClient
		})
	}
}

app.use(session(session_parameter));

app.set("view engine", "ejs");
app.use('/public', express.static(path.join(__dirname, 'public')));


let http_server;
let https_server;
function create_http_server(app, port) {
	console.log("Running on port " + port);
	return http.createServer(app).listen(port);
}

if (argv.no_https){
	http_server = create_http_server(app, http_port);
} else {
	const app2 = express(); //part below listens to http_port and redirects all traffic to https
	http_server = create_http_server(app2, http_port);

	const privateKey = fs.readFileSync(process.env.private_key_dir, 'utf8');
	const certificate = fs.readFileSync(process.env.certificate_dir, 'utf8');

	let credentials = {
		key: privateKey,
		cert: certificate
	};
	app2.get("*", function (req, res) {
		res.redirect("https://" + req.headers.host + req.url);
	});

	https_server = https.createServer(credentials, app).listen(https_port, function () {
		console.log("Running on port " + https_port);
	});
}
app.get("*", routes);