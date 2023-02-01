var express = require("express");
var router = express.Router();

const api_list = ["/yys/v1/{game_id}", "/steam/v1/{steam_id}"];

/* GET home page. */
router.get("/", function (req, res, next) {
    let html = "接口列表：<br/>";
    // each api_list
    api_list.forEach((api) => {
        html += `${api}<br/>`;
    });

    console.log(html);

    res.setHeader('Content-Type', 'text/html').send(html);
});

module.exports = router;
