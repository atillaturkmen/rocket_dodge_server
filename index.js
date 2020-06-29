//omniamorsaequat.com
//https://github.com/DBC201/rocket_dodge_server
require('dotenv').config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require('body-parser');
const session = require("express-session");
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const redis = require('redis');
const useragent = require('express-useragent');
const https_port = process.env.https_port;
const http_port = process.env.http_port;
const http = require("http");
const https = require('https');
const { json } = require('body-parser');
const privateKey = fs.readFileSync(process.env.private_key_dir, 'utf8');
const certificate = fs.readFileSync(process.env.certificate_dir, 'utf8');

const redisClient = redis.createClient();
const RedisStore = require('connect-redis')(session);

var credentials = {
	key: privateKey,
	cert: certificate
};

const game_list = ["rocket_dodge", "hold_dodge", "hold_dodge_accelerated", "touch_dodge"];

const admin_list = read_admin_file();

let database = new sqlite3.Database(process.env.database_dir, (error) => {
	if (error) {
		return console.error(error.message);
	} else {
		console.log('Connected to SQlite database.');
	}
});

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

app.get("/", function (req, res) {
	res.render("home", {
		loggedin: req.session.loggedin,
		is_mobile: req.useragent.isMobile,
	});
	let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
	let current_time = return_time();
	console.log(current_time + " : Connection from " + ip);
});

app.get("/favicon.ico", function (req, res) {
	res.sendFile(path.join(__dirname + "/favicon.ico"));
});

app.get("/rocket_dodge", function (req, res) {
	if (req.useragent.isMobile) {
		res.render("message",{
			loggedin: req.session.loggedin,
			message: "Sorry, this game isn't availible on mobile platforms!"
		});
	} else {
		let username = req.session.username;
		if (!req.session.loggedin) {
			username = "You";
		}
		database.all(`SELECT username, pc_score AS score FROM rocket_dodge WHERE pc_score IS NOT NULL ORDER BY pc_score DESC LIMIT 5`, (err, result) => {
			res.render(path.join(__dirname + "/games/rocket_dodge"), {
				username: username,
				scores: JSON.stringify(result),
			});
		});
	}

});

app.get("/hold_dodge", function (req, res) {
	let username = req.session.username;
	if (!req.session.loggedin) {
		username = "You";
	}
	if (req.useragent.isMobile) {
		database.all(`SELECT username, mobile_score AS score FROM hold_dodge WHERE mobile_score IS NOT NULL ORDER BY mobile_score DESC LIMIT 5`, (err, result) => {
			res.render(path.join(__dirname + "/games/hold_dodge"), { //mobile is also checked on gamefiles no need to send here
				username: username,
				scores: JSON.stringify(result),
			});
		});
	} else {
		database.all(`SELECT username, pc_score AS score FROM hold_dodge WHERE pc_score IS NOT NULL ORDER BY pc_score DESC LIMIT 5`, (err, result) => {
			res.render(path.join(__dirname + "/games/hold_dodge"), {
				username: username,
				scores: JSON.stringify(result),
			});
		});
	}
});

app.get("/touch_dodge", function (req, res) {
	let username = req.session.username;
	if (!req.session.loggedin) {
		username = "You";
	}
	if (req.useragent.isMobile) {
		database.all(`SELECT username, mobile_score AS score FROM touch_dodge WHERE mobile_score IS NOT NULL ORDER BY mobile_score DESC LIMIT 5`, (err, result) => {
			res.render(path.join(__dirname + "/games/touch_dodge"), { //mobile is also checked on gamefiles no need to send here
				username: username,
				scores: JSON.stringify(result),
			});
		});
	} else {
		database.all(`SELECT username, pc_score AS score FROM touch_dodge WHERE pc_score IS NOT NULL ORDER BY pc_score DESC LIMIT 5`, (err, result) => {
			res.render(path.join(__dirname + "/games/touch_dodge"), {
				username: username,
				scores: JSON.stringify(result),
			});
		});
	}
});

app.get("/hold_dodge_accelerated", function (req, res) {
	let username = req.session.username;
	if (!req.session.loggedin) {
		username = "You";
	}
	if (req.useragent.isMobile) {
		database.all(`SELECT username, mobile_score AS score FROM hold_dodge_accelerated WHERE mobile_score IS NOT NULL ORDER BY mobile_score DESC LIMIT 5`, (err, result) => {
			res.render(path.join(__dirname + "/games/hold_dodge_accelerated"), { //mobile is also checked on gamefiles no need to send here
				username: username,
				scores: JSON.stringify(result),
			});
		});
	} else {
		database.all(`SELECT username, pc_score AS score FROM hold_dodge_accelerated WHERE pc_score IS NOT NULL ORDER BY pc_score DESC LIMIT 5`, (err, result) => {
			res.render(path.join(__dirname + "/games/hold_dodge_accelerated"), {
				username: username,
				scores: JSON.stringify(result),
			});
		});
	}
});

app.get("/about", function (req, res) {
	res.render("about", {
		loggedin: req.session.loggedin
	});
});

app.get("/profile", function (req, res) {
	if (req.session.loggedin) {
		let score_table = [];
		for (let list_index in game_list) {
			let score_row = [];
			database.get(`SELECT * FROM ${game_list[list_index]} WHERE username = ?`, [req.session.username], function (err, row) {
				score_row.push(game_list[list_index]);
				if (row) {
					if (row.pc_score == undefined) {
						score_row.push(0);
					} else {
						score_row.push(row.pc_score);
					}
					if (row.mobile_score == undefined) {
						score_row.push(0);
					} else {
						score_row.push(row.mobile_score);
					}
				} else {
					score_row.push(0);
					score_row.push(0);
				}
				score_table.push(score_row);
				if (list_index == game_list.length - 1) {
					res.render("profile", {
						score_table: score_table,
						loggedin: req.session.loggedin,
					});
				}
			});
		}
	} else {
		res.redirect("/login");
	}
});

app.get("/profile/:username", function (req, res) {
	database.get("SELECT username FROM accounts WHERE username = ?", [req.params.username], (error, row) => {
		if (row) {
			let score_table = [];
			for (let list_index in game_list) {
				let score_row = [];
				database.get(`SELECT * FROM ${game_list[list_index]} WHERE username = ?`, [req.params.username], function (err, row) {
					score_row.push(game_list[list_index]);
					if (row) {
						if (row.pc_score == undefined) {
							score_row.push(0);
						} else {
							score_row.push(row.pc_score);
						}
						if (row.mobile_score == undefined) {
							score_row.push(0);
						} else {
							score_row.push(row.mobile_score);
						}
					} else {
						score_row.push(0);
						score_row.push(0);
					}
					score_table.push(score_row);
					if (list_index == game_list.length - 1) {
						res.render("public_profile", {
							score_table: score_table,
							loggedin: req.session.loggedin,
							username: req.params.username
						});
					}
				});
			}
		} else {
			res.render("message",{
				loggedin: req.session.loggedin,
				message: "Wrong username!"
			});
		}
	});
});

app.get("/high_scores", function (req, res) {
	res.render("high_scores", {
		loggedin: req.session.loggedin
	});
});

app.get("/high_scores/:game_type", async (req, res) => {
	if (game_list.includes(req.params.game_type)) {
		let pc_scores = [];
		let mobile_scores = [];
		database.all(`SELECT username, pc_score AS score FROM ${req.params.game_type} WHERE pc_score IS NOT NULL ORDER BY pc_score DESC LIMIT 5`, async (err, result) => {
			for (let i = 0; i < result.length; i++) {
				await pc_scores.push({ username: result[i].username, score: result[i].score });
			}
			database.all(`SELECT username, mobile_score AS score FROM ${req.params.game_type} WHERE mobile_score IS NOT NULL ORDER BY mobile_score DESC LIMIT 5`, async (err, result) => {
				for (let i = 0; i < result.length; i++) {
					await mobile_scores.push({ username: result[i].username, score: result[i].score });
				}
				res.render("show_high_scores", {
					loggedin: req.session.loggedin,
					pc_scores: pc_scores,
					mobile_scores: mobile_scores,
					game_type: req.params.game_type,
				});
			});
		});
	} else {
		res.render("message",{
			loggedin: req.session.loggedin,
			message: "That game doesn't exist!"
		});
	}
});

app.get("/downloads", function (req, res) {
	if (req.session.loggedin) {
		res.render("downloads", {
			loggedin: req.session.loggedin
		});
	} else {
		res.redirect("/login");
	}
});

app.get("/downloads/:platform", function (req, res) {
	if (req.session.loggedin) {
		res.render(req.params.platform, {
			loggedin: req.session.loggedin
		});
	} else {
		res.redirect("/login");
	}
});

app.get("/downloads/android/:version", function (req, res) {
	if (req.session.loggedin) {
		res.sendFile(path.join(__dirname + `/apks/${req.params.version}.apk`));
	} else {
		res.redirect("/login");
	}
});

app.get("/change_password", function (req, res) {
	if (req.session.loggedin) {
		res.render("change_password", {
			loggedin: req.session.loggedin,
		});
	} else {
		res.redirect("/login");
	}
});

app.get('/register', function (req, res) {
	if (req.session.loggedin) {
		res.render("message",{
			loggedin: req.session.loggedin,
			message: "Logout to view this page!"
		});
	} else {
		res.render("register", {
			loggedin: req.session.loggedin,
		});
	}
});

app.get('/login', function (req, res) {
	if (req.session.loggedin) {
		res.render("message",{
			loggedin: req.session.loggedin,
			message: "Logout to view this page!"
		});
	} else {
		res.render("login", {
			loggedin: req.session.loggedin,
		});
	}
});

app.get('/logout', function (req, res) {
	if (req.session.loggedin) {
		req.session.destroy();
	}
	res.redirect("/");
});

app.get("/delete_account", function (req, res) {
	if (req.session.loggedin) {
		res.render("delete_account", {
			loggedin: req.session.loggedin,
		});
	} else {
		res.redirect("/login");
	}
});

app.post("/delete", function (req, res) {
	if (req.session.loggedin) {
		database.get("SELECT password FROM ACCOUNTS WHERE username = ?", [req.session.username], async (err, row) => {
			if (err) {
				console.log(err);
			}
			let pass_check = await bcrypt.compare(req.body.password, row.password);
			if (pass_check) {
				database.run("DELETE FROM accounts WHERE username = ?", [req.session.username], function (err) {
					console.log(err);
				});
				for (let i in game_list) {
					database.run(`DELETE FROM ${game_list[i]} WHERE username = ?`, [req.session.username], function (err) {
						console.log(err);
					});
				}
				req.session.destroy();
				res.render("message",{
					loggedin: req.session.loggedin,
					message: "Account succesfully deleted!"
				});
			} else {
				res.render("message",{
					loggedin: req.session.loggedin,
					message: "Wrong password!"
				});
			}
		});
	} else {
		res.redirect("/login");
	}
});

app.post("/score", function (req, res) {
	let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
	let current_time = return_time();
	console.log(current_time + " : Data received from " + ip);
	let username = req.session.username;
	let score_received = Number(req.body.score);
	let game_type = req.body.game_type;
	let is_mobile = Boolean(req.body.is_mobile);
	let score_type = "pc_score";
	if (is_mobile) {
		score_type = "mobile_score";
	}
	console.log("loggedin: ", req.session.loggedin);
	console.log(`username: ${username}, score: ${score_received}, game_type: ${game_type}, is_mobile: ${is_mobile}, score_type: ${score_type}`);
	if (req.session.loggedin) {
		database.get(`SELECT ${score_type} FROM ${game_type} WHERE username = ?`, [username], function (err, row) {
			console.log("Retrieved row:", row);
			if (err) {
				console.log(err);
			} else if (row) {
				console.log("Row found, executing check...");
				if (is_mobile) {
					console.log(`Is mobile:${is_mobile}`);
					console.log(`Row score:${row.mobile_score} Score received:${score_received}`);
					if (row.mobile_score < score_received || row.mobile_score == undefined) {
						console.log("Updating row score...");
						database.run(`UPDATE ${game_type} SET ${score_type} = ? WHERE username = ?`, [score_received, username], function (err) {
							if (err) {
								console.log("Unable to update.");
								console.log(err);
							} else {
								console.log("Row updated!");
							}
						});
					}
				} else {
					console.log('Executing pc_score check...');
					if (row.pc_score < score_received || row.pc_score == undefined) {
						console.log("Updating row score...");
						database.run(`UPDATE ${game_type} SET ${score_type} = ? WHERE username = ?`, [score_received, username], function (err) {
							if (err) {
								console.log("Unable to update.");
								console.log(err);
							} else {
								console.log("Row updated!");
							}
						});
					}
				}
			} else {
				console.log("Row value not defined. Will try to insert value.");
				database.run(`INSERT INTO ${game_type}(username,${score_type}) VALUES(?,?)`, [username, score_received], function (err) {
					if (err) {
						console.log("Unable to insert.");
						console.log(err);
					} else {
						console.log("Row inserted!");
					}
				});
			}
		});
	}
});

app.post('/auth', async (req, res) => {
	let username_input = req.body.omniamorsaequat_username;
	if (username_input) {
		database.get('SELECT password FROM accounts WHERE username = ?', username_input, async (error, result) => {
			if (result) {
				let pass_check = await bcrypt.compare(req.body.omniamorsaequat_password, result.password);
				if (pass_check) {
					req.session.loggedin = true;
					req.session.username = username_input;
					res.redirect("/profile");
				} else {
					res.render("message",{
						loggedin: req.session.loggedin,
						message: "Wrong password!"
					});
				}
			} else {
				res.render("message",{
					loggedin: req.session.loggedin,
					message: "Wrong username!"
				});
			}
		});
	} else {
		res.render("message",{
			loggedin: req.session.loggedin,
			message: "Please enter a username!"
		});
	}
});

app.post('/signup', async (req, res) => {
	let password_input = req.body.password;
	let username_input = req.body.username;
	let invalid_input = crediential_response(username_input, password_input);
	if (invalid_input) {
		res.render("message",{
			loggedin: req.session.loggedin,
			message: invalid_input
		});
	} else {
		try {
			let salt = await bcrypt.genSalt();
			let hashedpassword = await bcrypt.hash(password_input, salt);
			database.get('SELECT * FROM accounts WHERE username = ?', username_input, function (error, result) {
				if (result) {
					res.render("message",{
						loggedin: req.session.loggedin,
						message: "That username is taken, try again."
					});
				} else {
					database.get("INSERT INTO accounts(username,password) VALUES(?,?)", [username_input, hashedpassword], function (err) {
						if (err) {
							console.log(err);
						}
					});
					res.redirect("/login");
				}
			});
		} catch (e) {
			console.log(e);
			res.redirect('/register');
		}
	}
});

app.post("/update_password", async (req, res) => {
	if (req.session.loggedin) {
		if (req.body.new_password != req.body.confirm_new_password) {
			res.render("message",{
				loggedin: req.session.loggedin,
				message: "Passwords don't match!"
			});
		} else if (crediential_response(req.session.username, req.body.new_password)) {
			res.send(crediential_response(req.session.username, req.body.new_password));
			res.end();
		} else {
			database.get("SELECT password FROM ACCOUNTS WHERE username = ?", [req.session.username], async (err, row) => {
				if (err) {
					console.log(err);
				}
				let pass_check = await bcrypt.compare(req.body.old_password, row.password);
				if (pass_check) {
					let update_query = "UPDATE accounts SET password = ? WHERE username = ?";
					let salt = await bcrypt.genSalt();
					let hashedpassword = await bcrypt.hash(req.body.new_password, salt);
					database.run(update_query, [hashedpassword, req.session.username], function (err) {
						console.log(err);
					});
					res.render("message",{
						loggedin: req.session.loggedin,
						message: "Password updated succesfully!"
					});
				} else {
					res.render("message",{
						loggedin: req.session.loggedin,
						message: "Wrong password!"
					});
				}
			});
		}
	} else {
		res.redirect("/login");
	}
});

function crediential_response(username, password) {
	let max_namelength = 31;
	let min_namelength = 6;
	let max_password = 37;
	let min_password = 8;
	if (username.length < min_namelength) {
		return `Username must be at least ${min_namelength} characters!`;
	} else if (username.length > max_namelength) {
		return `Username can't be longer than ${max_namelength} characters!`;
	} else if (password.length < min_password) {
		return `Password must be at least ${min_password} characters!`;
	} else if (password.length > max_password) {
		return `Password can't be longer than ${max_password} characters!`;
	} else {
		return false;
	}
}

function read_admin_file(admin_array = [], file_name = "admins.txt") {
	let lineReader = require('readline').createInterface({
		input: require('fs').createReadStream(file_name)
	});

	lineReader.on('line', function (line) {
		admin_array.push(line.trim());
	});
	return admin_array;
}

function return_time() {
	let date_ob = new Date();
	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	let hours = date_ob.getHours();
	let minutes = date_ob.getMinutes();
	let seconds = date_ob.getSeconds();
	let dateDisplay = `${date}/${month}/${year} ${hours}:${minutes}:${seconds}`;
	return dateDisplay;
}

function connection_log(text = "Connection from:", ip = '', time = '') {
	file_name = "connection_log.txt";
	fs.appendFile(file_name, `${time} : ${text} ${ip}\n`, () => {
		console.log(`Saved to ${file_name}`);
	});
}