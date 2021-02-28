const path = require("./imports").path;
const return_time = require("./helper_functions").return_time;

const express = require("./imports").express;
const router = express.Router();

const database = require("./imports").database;
const bcrypt = require("./imports").bcrypt;

const account = require("./account");
const downloads = require("./downloads");
const games = require("./games");
const profile = require("./profile");
const score = require("./score");

router.get("/account/*", account);
router.post("/account/*", account);

router.get("/downloads/*", downloads);
router.post("/downloads/*", downloads);

router.get("/games/*", games);
router.post("/games/*", games);

router.get("/profile/*", profile);
router.post("/profile/*", profile);

router.get("/score/*", score);
router.post("/score/*",score);

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
    res.sendFile(path.join(__dirname, "/../favicon.ico"));
});

router.get("/about", function (req, res) {
    res.render("about", {
        loggedin: req.session.loggedin
    });
});

// Checks if user has a remember me cookie
function checkCookie(req, res, next) {
    let cookies = req.headers.cookie;
    if (cookies) {
        let arr = cookies.split('; ');
        let validator, selector;
        // find remember me cookie from all cookies
        for (let i=0; i<arr.length; i++) {
            // key value pairs of cookies are seperated with '='
            let ar2 = arr[i].split("=");
            // remember me cookie's selector starts with 'rem'
            if (ar2[0].substring(0, 3) === "rem") {
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
                    } else next();
                } else next();
            });
        } else next();
    } else next();
}

module.exports = router;