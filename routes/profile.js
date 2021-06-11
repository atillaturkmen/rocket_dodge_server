const express = require("./imports").express;
const router = express.Router();

const database = require("./imports").database;

const game_list = require("./imports").game_list;
const game_name_list = require("./imports").game_name_list;

router.get("/profile/me", function (req, res) {
    if (req.session.loggedin) {
        let score_table = [];
        for (let list_index=0; list_index<game_list.length; list_index++) {
            let score_row = [];
            database.get(`SELECT * FROM ${game_list[list_index]} WHERE username = ?`, [req.session.username], function (err, row) {
                score_row.push(game_list[list_index]);
                if (row) {
                    if (row.pc_score === undefined) {
                        score_row.push(0);
                    } else {
                        score_row.push(row.pc_score);
                    }
                    if (row.mobile_score === undefined) {
                        score_row.push(0);
                    } else {
                        score_row.push(row.mobile_score);
                    }
                } else {
                    score_row.push(0);
                    score_row.push(0);
                }
                score_table.push(score_row);
                if (list_index === game_list.length - 1) {
                    res.render("profile", {
                        score_table: score_table,
                        loggedin: req.session.loggedin,
                        names: game_name_list,
                        username: req.session.username
                    });
                }
            });
        }
    } else {
        res.redirect("/account/login");
    }
});

router.get("/profile/:username", function (req, res) {
    database.get("SELECT username FROM accounts WHERE username = ?", [req.params.username], (error, row) => {
        if (row) {
            let score_table = [];
            for (let list_index=0; list_index<game_list.length; list_index++) {
                let score_row = [];
                database.get(`SELECT * FROM ${game_list[list_index]} WHERE username = ?`, [req.params.username], function (err, row) {
                    score_row.push(game_list[list_index]);
                    if (row) {
                        if (row.pc_score === undefined) {
                            score_row.push(0);
                        } else {
                            score_row.push(row.pc_score);
                        }
                        if (row.mobile_score === undefined) {
                            score_row.push(0);
                        } else {
                            score_row.push(row.mobile_score);
                        }
                    } else {
                        score_row.push(0);
                        score_row.push(0);
                    }
                    score_table.push(score_row);
                    if (list_index === game_list.length - 1) {
                        res.render("public_profile", {
                            score_table: score_table,
                            loggedin: req.session.loggedin,
                            username: req.params.username,
                            names: game_name_list,
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

module.exports = router;