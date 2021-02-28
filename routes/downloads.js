const express = require("./imports").express;
const router = express.Router();

router.get("/downloads/view", function (req, res) {
    if (req.session.loggedin) {
        res.render("message", {
            loggedin: req.session.loggedin,
            message: "Downloads currently unavailible"
        });
        /*res.render("downloads", {
            loggedin: req.session.loggedin
        });*/
    } else {
        res.redirect("/account/login");
    }
});

router.get("/downloads/:platform", function (req, res) {
    if (req.session.loggedin) {
        res.render(req.params.platform, {
            loggedin: req.session.loggedin
        });
    } else {
        res.redirect("/account/login");
    }
});

router.get("/downloads/android/:version", function (req, res) {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, `/../apks/${req.params.version}.apk`));
    } else {
        res.redirect("/account/login");
    }
});

module.exports = router;