var express = require("express");
var router = express.Router();
const Crawler = require("crawler");

const c = new Crawler({
    maxConnections: 10,
    rotateUA: true,
    userAgent: [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.70",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/109.0",
    ],
});

/* GET yys listing. */
router.get("/v1/:game_id", function (req, res, next) {
    // search gameinfo & send to client
    // c.queue("https://www.yystv.cn/g/6771", (err, res, done) => {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         let body = res.body;

    //         // match var gameinfo
    //         let gameinfo = body.match(/var gameinfo = (.*?);/)[1];
    //         // gameinfo = JSON.parse(gameinfo);

    //         console.log(gameinfo);
    //         // res.send(gameinfo);
    //         res.json(gameinfo)

    //     }
    //     done();
    // });
    let game_id = req.params.game_id;
    if (isNaN(game_id) || game_id < 1 || game_id > 10000) {
        res.json([]);
        return;
    }

    let url = `https://www.yystv.cn/g/${req.params.game_id}`;

    c.queue([
        {
            uri: url,
            jQuery: true,

            // The global callback won't be called
            callback: (cerror, cres, cdone) => {
                if (cerror) {
                    console.log('cerror', req.params.game_id);
                    res.json([]);
                } else {
                    try {
                        let body = cres.body;

                        // match var gameinfo
                        let gameinfo = body.match(/var gameinfo\ =\ (.*?)\]\};/)[1];
                        // console.log(gameinfo)
                        // 匹配后需要补全的部分
                        gameinfo = gameinfo + "]}";
                        gameinfo = JSON.parse(gameinfo);
                        console.log('get yys gameinfo', url);
                        // console.log(cres.request.headers);

                        res.json(gameinfo);
                    } catch (e) {
                        console.log('catch', e);
                        res.json([]);
                    }
                }
                cdone();
            },
        },
    ]);
});

module.exports = router;
