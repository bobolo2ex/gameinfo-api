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
    // headers
    headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "max-age=0",
        "Connection": "keep-alive",
        "Cookie": "steamCountry=CN%7Cf1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1; timezoneOffset=28800,0; _ga=GA1.2.1000000000.1600000000; _gid=GA1.2.1000000000.1600000000; _gat_gtag_UA_100000000_1=1",
        "Host": "store.steampowered.com",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
    },
});

/* GET steam listing. */
router.get("/v1/:game_id", function (req, res, next) {

    let game_id = req.params.game_id;
    console.info(game_id);
    // steam 的游戏 id 是数字，而且是 7 位数（猜测未成立）
    // 目前没有更好的方式，只能简单判断一下
    if (isNaN(game_id)) {
        res.json([]);
        return;
    }

    c.queue([
        {
            uri: `https://store.steampowered.com/app/${req.params.game_id}`,
            jQuery: true,

            // The global callback won't be called
            callback: (cerror, cres, cdone) => {
                if (cerror) {
                    console.log(cerror)
                    res.json([]);
                } else {
                    try {
                        // data format
                        // * cover: https://steamcdn-a.akamaihd.net/steam/apps/1091500/capsule_616x353.jpg
                        // * name: 《猎魔人2》
                        // * price: ￥ 59.00
                        // * release_date: 2020年11月12日
                        // * production: ["红狮游戏"]
                        // * publisher: 红狮游戏
                        // * chinese: 1/0
                        // * brief: 《猎魔人2》是一款动作冒险游戏，玩家将扮演一名猎魔人，与一群猎魔人一起，穿越到一个充满魔物的世界，寻找并消灭魔物，解救被魔物控制的人类。
                        // * language: 英语
                        // * score: "多半好评"
                        // * metacritic_score: 75
                        // * tags_user: ["动作", "角色扮演", "策略"]
                        // * tags_steam: ["游戏"]
                        let data = {
                            cover: "",
                            name: "",
                            release_date: "",
                            production: [],
                            publisher: "",
                            chinese: 0,
                            brief: "",
                            // language: "",
                            score: "",
                            metacritic_score: 0,
                            tags_user: [],
                            tags_steam: [],
                        };

                        


                        const $ = cres.$;
                        data.cover = $("link[rel=image_src]").attr('href');
                        data.brief = $("meta[name=Description]").attr('content');

                        let appHeaderGridContainer = $("#appHeaderGridContainer .grid_content");



                        data.name = $("#appHubAppName").text();
                        data.release_date = $(".date").text();
                        data.production = $("#developers_list a").map((i, e) => $(e).text()).get();
                        data.publisher = appHeaderGridContainer.eq(1).text().replace(/[\r\t\n]/g, "") || "暂无信息";
                        data.chinese = $(".responsive_banner_link_title").text().includes("简体中文") ? 1 : 0;
                        // data.language = $(".game_language_options a").map((i, e) => $(e).text()).get().join("、");
                        data.score = $("#review_histogram_rollup_section .game_review_summary").text() || "暂无评分";
                        data.score_tips = $("#review_histogram_rollup_section .game_review_summary").attr('data-tooltip-html') || "暂无评分";
                        data.metacritic_score = $("#game_area_metascore .score").text().replace(/[\r\t\n]/g, "") || 0;

                        // 清除 tags 换行符和制表符
                        data.tags_user = $(".glance_tags.popular_tags a").map((i, e) => $(e).text().replace(/[\r\t\n]/g, "")).get();

                        data.tags_steam = $("#genresAndManufacturer>span>a").map((i, e) => $(e).text().replace(/[\r\t\n]/g, "")).get();

                        res.json(data);
                    } catch (e) {
                        console.log(e)
                        res.json([]);
                    }
                }
                cdone();
            },
        },
    ]);
});

module.exports = router;
