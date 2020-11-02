const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const express = require("express");
const router = express.Router();

const database = require("./initialize_database");

const game_list = ["rocket_dodge", "hold_dodge", "hold_dodge_accelerated", "touch_dodge"];

router.get("/", function (req, res) {
    if (req.session.loggedin) {
        res.render("home", {
            loggedin: req.session.loggedin,
            is_mobile: req.useragent.isMobile,
        });
    } else {
        checkCookie(req, res, async () => {
            res.render("home", {
                loggedin: req.session.loggedin,
                is_mobile: req.useragent.isMobile,
            });
        });
    }
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
    let current_time = return_time();
    console.log(current_time + " : Connection from " + ip);
});

router.get("/favicon.ico", function (req, res) {
    res.sendFile(path.join(__dirname, "../favicon.ico"));
});

router.get("/rocket_dodge", function (req, res) {
    if (req.useragent.isMobile) {
        res.render("message", {
            loggedin: req.session.loggedin,
            message: "Sorry, this game isn't available on mobile platforms!"
        });
    } else {
        let username = req.session.username;
        if (!req.session.loggedin) {
            username = "You";
        }
        database.all(`SELECT username, pc_score AS score FROM rocket_dodge WHERE pc_score IS NOT NULL ORDER BY pc_score DESC LIMIT 5`, (err, result) => {
            res.render(path.join(__dirname + "../games/rocket_dodge"), {
                username: username,
                scores: JSON.stringify(result),
            });
        });
    }

});

router.get("/hold_dodge", function (req, res) {
    let username = req.session.username;
    if (!req.session.loggedin) {
        username = "You";
    }
    if (req.useragent.isMobile) {
        database.all(`SELECT username, mobile_score AS score FROM hold_dodge WHERE mobile_score IS NOT NULL ORDER BY mobile_score DESC LIMIT 5`, (err, result) => {
            res.render(path.join(__dirname + "../games/hold_dodge"), { //mobile is also checked on gamefiles no need to send here
                username: username,
                scores: JSON.stringify(result),
            });
        });
    } else {
        database.all(`SELECT username, pc_score AS score FROM hold_dodge WHERE pc_score IS NOT NULL ORDER BY pc_score DESC LIMIT 5`, (err, result) => {
            res.render(path.join(__dirname + "../games/hold_dodge"), {
                username: username,
                scores: JSON.stringify(result),
            });
        });
    }
});

router.get("/touch_dodge", function (req, res) {
    let username = req.session.username;
    if (!req.session.loggedin) {
        username = "You";
    }
    if (req.useragent.isMobile) {
        database.all(`SELECT username, mobile_score AS score FROM touch_dodge WHERE mobile_score IS NOT NULL ORDER BY mobile_score DESC LIMIT 5`, (err, result) => {
            res.render(path.join(__dirname + "../games/touch_dodge"), { //mobile is also checked on gamefiles no need to send here
                username: username,
                scores: JSON.stringify(result),
            });
        });
    } else {
        database.all(`SELECT username, pc_score AS score FROM touch_dodge WHERE pc_score IS NOT NULL ORDER BY pc_score DESC LIMIT 5`, (err, result) => {
            res.render(path.join(__dirname + "../games/touch_dodge"), {
                username: username,
                scores: JSON.stringify(result),
            });
        });
    }
});

router.get("/hold_dodge_accelerated", function (req, res) {
    let username = req.session.username;
    if (!req.session.loggedin) {
        username = "You";
    }
    if (req.useragent.isMobile) {
        database.all(`SELECT username, mobile_score AS score FROM hold_dodge_accelerated WHERE mobile_score IS NOT NULL ORDER BY mobile_score DESC LIMIT 5`, (err, result) => {
            res.render(path.join(__dirname + "../games/hold_dodge_accelerated"), { //mobile is also checked on gamefiles no need to send here
                username: username,
                scores: JSON.stringify(result),
            });
        });
    } else {
        database.all(`SELECT username, pc_score AS score FROM hold_dodge_accelerated WHERE pc_score IS NOT NULL ORDER BY pc_score DESC LIMIT 5`, (err, result) => {
            res.render(path.join(__dirname + "../games/hold_dodge_accelerated"), {
                username: username,
                scores: JSON.stringify(result),
            });
        });
    }
});

router.get("/about", function (req, res) {
    res.render("about", {
        loggedin: req.session.loggedin
    });
});

router.get("/profile", function (req, res) {
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

router.get("/profile/:username", function (req, res) {
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
            res.render("message", {
                loggedin: req.session.loggedin,
                message: "Wrong username!"
            });
        }
    });
});

router.get("/high_scores", function (req, res) {
    res.render("high_scores", {
        loggedin: req.session.loggedin
    });
});

router.get("/high_scores/:game_type", function (req, res) {
    if (game_list.includes(req.params.game_type)) {
        let pc_scores = [];
        let mobile_scores = [];
        database.all(`SELECT username, pc_score AS score FROM ${req.params.game_type} WHERE pc_score IS NOT NULL ORDER BY pc_score DESC LIMIT 5`, function (err, result) {
            if (result) {
                for (let i = 0; i < result.length; i++) {
                    pc_scores.push({
                        username: result[i].username,
                        score: result[i].score
                    });
                }
                database.all(`SELECT username, mobile_score AS score FROM ${req.params.game_type} WHERE mobile_score IS NOT NULL ORDER BY mobile_score DESC LIMIT 5`, function (err, result) {
                    for (let i = 0; i < result.length; i++) {
                        mobile_scores.push({
                            username: result[i].username,
                            score: result[i].score
                        });
                    }
                    res.render("show_high_scores", {
                        loggedin: req.session.loggedin,
                        pc_scores: pc_scores,
                        mobile_scores: mobile_scores,
                        game_type: req.params.game_type,
                    });
                });
            } else {
                // if there are no rows, result is undefined, and the above if condition won't run
                //if there is no pc score, an empty list is returned, hence the above if condition runs
                res.render("show_high_scores", { // if there is no rows, there is no score for either platform types
                    loggedin: req.session.loggedin,
                    pc_scores: [],
                    mobile_scores: [],
                    game_type: req.params.game_type,
                });
            }
        });
    } else {
        res.render("message", {
            loggedin: req.session.loggedin,
            message: "That game doesn't exist!"
        });
    }
});

router.get("/downloads", function (req, res) {
    if (req.session.loggedin) {
        res.render("message", {
            loggedin: req.session.loggedin,
            message: "Downloads currently unavailible"
        });
        /*res.render("downloads", {
            loggedin: req.session.loggedin
        });*/
    } else {
        res.redirect("/login");
    }
});

router.get("/downloads/:platform", function (req, res) {
    if (req.session.loggedin) {
        res.render(req.params.platform, {
            loggedin: req.session.loggedin
        });
    } else {
        res.redirect("/login");
    }
});

router.get("/downloads/android/:version", function (req, res) {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname + `../apks/${req.params.version}.apk`));
    } else {
        res.redirect("/login");
    }
});

router.get("/change_password", function (req, res) {
    if (req.session.loggedin) {
        res.render("change_password", {
            loggedin: req.session.loggedin,
        });
    } else {
        res.redirect("/login");
    }
});

router.get('/register', function (req, res) {
    if (req.session.loggedin) {
        res.render("message", {
            loggedin: req.session.loggedin,
            message: "Logout to view this page!"
        });
    } else {
        res.render("register", {
            loggedin: req.session.loggedin,
        });
    }
});

router.get('/login', function (req, res) {
    if (req.session.loggedin) {
        res.render("message", {
            loggedin: req.session.loggedin,
            message: "Logout to view this page!"
        });
    } else {
        res.render("login", {
            loggedin: req.session.loggedin,
        });
    }
});

router.get('/logout', function (req, res) {
    if (req.session.loggedin) {
        req.session.destroy();
        let cookies = req.headers.cookie;
        if (cookies) {
            let arr = cookies.split('; ');
            // find remember me cookie from all cookies
            for (let i in arr) {
                // key value pairs of cookies are seperated with '='
                let ar2 = arr[i].split("=");
                // remember me cookie's selector starts with 'rem'
                if (ar2[0].substring(0, 3) == "rem") {
                    selector = ar2[0];
                    res.clearCookie(selector);
                    database.run("DELETE FROM auth_tokens WHERE selector = ?", [selector], function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            }
        }
    }
    res.redirect("/");
});

router.get("/delete_account", function (req, res) {
    if (req.session.loggedin) {
        res.render("delete_account", {
            loggedin: req.session.loggedin,
        });
    } else {
        res.redirect("/login");
    }
});

router.post("/delete", function (req, res) {
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
                database.run("DELETE FROM auth_tokens WHERE username = ?", [req.session.username], function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                req.session.destroy();
                let cookies = req.headers.cookie;
                if (cookies) {
                    let arr = cookies.split('; ');
                    for (let i in arr) {
                        let ar2 = arr[i].split("=");
                        res.clearCookie(ar2[0]);
                    }
                }
                res.render("message", {
                    loggedin: false,
                    message: "Account succesfully deleted!"
                });
            } else {
                res.render("message", {
                    loggedin: req.session.loggedin,
                    message: "Wrong password!"
                });
            }
        });
    } else {
        res.redirect("/login");
    }
});

router.post("/score", function (req, res) {
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

router.post('/auth', async (req, res) => {
    let username_input = req.body.omniamorsaequat_username;
    let rememberMe = req.body.rememberMe;
    if (username_input) {
        database.get('SELECT password FROM accounts WHERE username = ?', username_input, async (error, result) => {
            if (result) {
                let pass_check = await bcrypt.compare(req.body.omniamorsaequat_password, result.password);
                if (pass_check) {
                    req.session.loggedin = true;
                    req.session.username = username_input;
                    if (rememberMe) {
                        firstRememberMe(req, res);
                    }
                    res.redirect("/profile");
                } else {
                    res.render("message", {
                        loggedin: req.session.loggedin,
                        message: "Wrong password!"
                    });
                }
            } else {
                res.render("message", {
                    loggedin: req.session.loggedin,
                    message: "Wrong username!"
                });
            }
        });
    } else {
        res.render("message", {
            loggedin: req.session.loggedin,
            message: "Please enter a username!"
        });
    }
});

router.post('/signup', async (req, res) => {
    let password_input = req.body.password;
    let username_input = req.body.username;
    let invalid_input = crediential_response(username_input, password_input);
    if (invalid_input) {
        res.render("message", {
            loggedin: req.session.loggedin,
            message: invalid_input
        });
    } else {
        try {
            let salt = await bcrypt.genSalt();
            let hashedpassword = await bcrypt.hash(password_input, salt);
            database.get('SELECT * FROM accounts WHERE username = ?', username_input, function (error, result) {
                if (result) {
                    res.render("message", {
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

router.post("/update_password", async (req, res) => {
    if (req.session.loggedin) {
        if (req.body.new_password != req.body.confirm_new_password) {
            res.render("message", {
                loggedin: req.session.loggedin,
                message: "Passwords don't match!"
            });
        } else if (crediential_response(req.session.username, req.body.new_password)) {
            res.render("message", {
                loggedin: req.session.loggedin,
                message: crediential_response(req.session.username, req.body.new_password)
            });
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
                    res.render("message", {
                        loggedin: req.session.loggedin,
                        message: "Password updated succesfully!"
                    });
                } else {
                    res.render("message", {
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
    if (username.indexOf(' ') != -1) {
        return "You can't have spaces in your username!";
    } else if (username.length < min_namelength) {
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

function randomString(len) {
    var buf = [],
        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        charlen = chars.length;

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    for (var i = 0; i < len; ++i) {
        buf.push(chars[getRandomInt(0, charlen - 1)]);
    }

    return buf.join('');
}

// ilk kez remember me kutucuğu işaretlenirse bu fonksiyon çalışır
async function firstRememberMe(req, res) {
    let selector = "rem" + randomString(9);
    let validator = randomString(64);
    res.cookie(selector, validator, { maxAge: 2592000000, httpOnly: true });

    let salt = await bcrypt.genSalt();
    let hashedValidator = await bcrypt.hash(validator, salt);

    let date = new Date();
    date.setTime(date.getTime() + (2592000000));
    var expiry = date.toISOString();

    database.get("INSERT INTO auth_tokens(selector, hashedValidator, username, expires) VALUES(?, ?, ?, ?)", [selector, hashedValidator, req.session.username, expiry], function (err) {
        if (err) {
            console.log(err);
        }
    });
}

// Checks if user has a remember me cookie
function checkCookie(req, res, next) {
    let loggedin = false;
    let cookies = req.headers.cookie;
    if (cookies) {
        let arr = cookies.split('; ');
        let validator, selector;
        // find remember me cookie from all cookies
        for (let i in arr) {
            // key value pairs of cookies are seperated with '='
            let ar2 = arr[i].split("=");
            // remember me cookie's selector starts with 'rem'
            if (ar2[0].substring(0, 3) == "rem") {
                selector = ar2[0];
                validator = ar2[1];
                break;
            }
        }

        if (validator) {
            database.get("SELECT * FROM auth_tokens WHERE selector = ?", [selector], async function (err, result) {
                if (err) {
                    console.log(err);
                }
                if (result) {
                    let check = await bcrypt.compare(validator, result.hashedValidator);
                    if (check) {
                        req.session.loggedin = true;
                        req.session.username = result.username;
                        next();
                    }
                }
            });
        } else next();
    } else next();
}

module.exports = router;