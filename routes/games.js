const express = require("./imports").express;
const router = express.Router();

const path = require("./imports").path;
const database = require("./imports").database;
const game_name_list = require("./imports").game_name_list;
const platform_list = require("./imports").platform_list;

router.get("/games/:username/:game_type/:platform", function (req, res){
    let game_type = req.params.game_type;
    let platform = req.params.platform;
    let username = req.params.username;
    if (game_type in game_name_list && platform in platform_list) {
        database.get(`SELECT ${platform+"_replay"} FROM ${game_type} WHERE username = ?`, [username], (err, row) =>{
            if (err) {
                res.render("message", {
                    loggedin: req.session.loggedin,
                    message: "An error occured, please try again later. Report this issue if it persists."
                });
            } else if (row) {
                database.all(`SELECT username, pc_score AS score FROM rocket_dodge WHERE pc_score IS NOT NULL ORDER BY pc_score DESC LIMIT 5`, (err, result) => {
                    res.render(path.join(__dirname, "/../games/replay"), {
                        username: username,
                        scores: JSON.stringify(result),
                        game_states: row[`${platform+"_replay"}`]
                    });
                });
            } else {
                res.render("message", {
                    loggedin: req.session.loggedin,
                    message: "That replay doesn't exist!"
                });
            }
        });
    } else {
        res.render("message", {
            loggedin: req.session.loggedin,
            message: "invalid game or platform"
        });
    }
});

router.get("/games/rocket_dodge", function (req, res) {
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
            res.render(path.join(__dirname, "/../games/rocket_dodge"), {
                username: username,
                scores: JSON.stringify(result),
            });
        });
    }
});

router.get("/games/hold_dodge", function (req, res) {
    let username = req.session.username;
    if (!req.session.loggedin) {
        username = "You";
    }
    if (req.useragent.isMobile) {
        database.all(`SELECT username, mobile_score AS score FROM hold_dodge WHERE mobile_score IS NOT NULL ORDER BY mobile_score DESC LIMIT 5`, (err, result) => {
            res.render(path.join(__dirname, "/../games/hold_dodge"), { //mobile is also checked on gamefiles no need to send here
                username: username,
                scores: JSON.stringify(result),
            });
        });
    } else {
        database.all(`SELECT username, pc_score AS score FROM hold_dodge WHERE pc_score IS NOT NULL ORDER BY pc_score DESC LIMIT 5`, (err, result) => {
            res.render(path.join(__dirname, "/../games/hold_dodge"), {
                username: username,
                scores: JSON.stringify(result),
            });
        });
    }
});

router.get("/games/touch_dodge", function (req, res) {
    let username = req.session.username;
    if (!req.session.loggedin) {
        username = "You";
    }
    if (req.useragent.isMobile) {
        database.all(`SELECT username, mobile_score AS score FROM touch_dodge WHERE mobile_score IS NOT NULL ORDER BY mobile_score DESC LIMIT 5`, (err, result) => {
            res.render(path.join(__dirname, "/../games/touch_dodge"), { //mobile is also checked on gamefiles no need to send here
                username: username,
                scores: JSON.stringify(result),
            });
        });
    } else {
        database.all(`SELECT username, pc_score AS score FROM touch_dodge WHERE pc_score IS NOT NULL ORDER BY pc_score DESC LIMIT 5`, (err, result) => {
            res.render(path.join(__dirname, "/../games/touch_dodge"), {
                username: username,
                scores: JSON.stringify(result),
            });
        });
    }
});

router.get("/games/hold_dodge_accelerated", function (req, res) {
    let username = req.session.username;
    if (!req.session.loggedin) {
        username = "You";
    }
    if (req.useragent.isMobile) {
        database.all(`SELECT username, mobile_score AS score FROM hold_dodge_accelerated WHERE mobile_score IS NOT NULL ORDER BY mobile_score DESC LIMIT 5`, (err, result) => {
            res.render(path.join(__dirname, "/../games/hold_dodge_accelerated"), { //mobile is also checked on gamefiles no need to send here
                username: username,
                scores: JSON.stringify(result),
            });
        });
    } else {
        database.all(`SELECT username, pc_score AS score FROM hold_dodge_accelerated WHERE pc_score IS NOT NULL ORDER BY pc_score DESC LIMIT 5`, (err, result) => {
            res.render(path.join(__dirname, "/../games/hold_dodge_accelerated"), {
                username: username,
                scores: JSON.stringify(result),
            });
        });
    }
});

module.exports = router;