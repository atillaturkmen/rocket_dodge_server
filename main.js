//omniamorsaequat.com
//https://github.com/DBC201/rocket_dodge_server
require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require('body-parser');
const session = require("express-session");
const redis = require('redis');
const useragent = require('express-useragent');
const https_port = process.env.https_port;
const http_port = process.env.http_port;
const http = require("http");
const https = require('https');
const privateKey = fs.readFileSync(process.env.private_key_dir, 'utf8');
const certificate = fs.readFileSync(process.env.certificate_dir, 'utf8');

const redisClient = redis.createClient();
const RedisStore = require('connect-redis')(session);

const routes = require(path.join(__dirname, "routes", "index"));

let credentials = {
	key: privateKey,
	cert: certificate
};

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(useragent.express());

app.use(session({
	secret: process.env.secret,
	saveUninitialized: true,
	resave: true,
	store: new RedisStore({
		client: redisClient
	}),
}));
app.set("view engine", "ejs");
app.use('/public', express.static(path.join(__dirname, 'public')));

const app2 = express(); //part below listens to http_port and redirects all traffic to https
const http_server = http.createServer(app2).listen(http_port, function (req, res) {
	console.log("Running on port " + http_port);
});
app2.get("*", function (req, res) {
	res.redirect("https://" + req.headers.host + req.url);
});

const https_server = https.createServer(credentials, app).listen(https_port, function () {
	console.log("Running on port " + https_port);
});
app.get("*", routes);