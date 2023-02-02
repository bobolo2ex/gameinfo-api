var express = require("express");
var router = express.Router();
const Crawler = require("crawler");

let userAgent = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.70",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/109.0",
];

const c = new Crawler({
    maxConnections: 10,
    rotateUA: true,
    userAgent: userAgent,
    // headers
    headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "max-age=0",
        Connection: "keep-alive",
        Cookie: "steamCountry=CN%7Cf1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1; timezoneOffset=28800,0;",
        Host: "store.steampowered.com",
    },
});

const user = new Crawler({
    maxConnections: 10,
    rotateUA: true,
    userAgent: userAgent,
    // headers
    headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/jxl,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.6",
        "Cache-Control": "max-age=0",
        Connection: "keep-alive",
        Cookie: "steamCountry=US%7C65660119b65e060434095f51906cc44d; timezoneOffset=28800,0",
        Host: "steamcommunity.com",
    },
});

// /v1/:user_id
/*
    <a href="https://steamcommunity.com/id/JoeZhao/games/?tab=recent"  class="sectionTab  recent"><span>最近玩过的</span></a>
    <a href="https://steamcommunity.com/id/JoeZhao/games/?tab=all"  class="sectionTab  active all"><span>所有游戏</span></a>
    <a href="https://steamcommunity.com/id/JoeZhao/games/?tab=perfect"  class="sectionTab  perfect"><span>完美通关游戏</span></a>
    <a href="https://steamcommunity.com/id/JoeZhao/followedgames/"  class="sectionTab  followed"><span>已关注</span></a>
    <a href="https://steamcommunity.com/id/JoeZhao/wishlist/"  class="sectionTab  wishlist"><span>愿望单</span></a>
    <a href="https://steamcommunity.com/id/JoeZhao/reviews/"  class="sectionTab  reviews"><span>评测</span></a> 
*/
router.get("/v1/user/:user_id", function (req, res, next) {
    let user_id = req.params.user_id;
    console.info(user_id);

    if (!user_id) {
        res.json([]);
        return;
    }

    let url = `https://steamcommunity.com/id/${user_id}/games/?tab=all`;
    console.log(url);

    user.queue([
        {
            uri: url,
            jQuery: true,

            // The global callback won't be called
            callback: (cerror, cres, cdone) => {
                if (cerror) {
                    console.log("cerror");
                    console.info(cerror);
                    res.json([]);
                } else {
                    try {
                        let body = cres.body;
                        // console.log(body.match(/var rgGames\ =\ (.*?);/));
                        // match var gameinfo
                        let userinfo = {
                            name: "",
                            avatar: "",
                            games: [],
                        }
                        userinfo.name = cres.$(".persona_name_text_content").text().replace(/[\r\t\n]/g, "");
                        userinfo.avatar = cres.$(".playerAvatar img").attr("src");
                        let gameinfo = body.match(/var rgGames = (.*?)\}\];/)[1];
                        // 匹配后需要补全的部分
                        gameinfo = gameinfo + "}]";
                        userinfo.games = JSON.parse(gameinfo);
                        res.json(userinfo);
                    } catch (e) {
                        console.log("catch error");
                        console.info(e);
                        res.json([]);
                    }
                }
                cdone();
            },
        },
    ]);
});

/* GET steam listing. */
router.get("/v1/game/:game_id", function (req, res, next) {
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
                    console.log(cerror);
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
                        data.cover = $("link[rel=image_src]").attr("href");
                        data.brief = $("meta[name=Description]").attr("content");

                        let appHeaderGridContainer = $("#appHeaderGridContainer .grid_content");

                        data.name = $("#appHubAppName").text();
                        data.release_date = $(".date").text();
                        data.production = $("#developers_list a")
                            .map((i, e) => $(e).text())
                            .get();
                        data.publisher =
                            appHeaderGridContainer
                                .eq(1)
                                .text()
                                .replace(/[\r\t\n]/g, "") || "暂无信息";
                        data.chinese = $(".responsive_banner_link_title").text().includes("简体中文") ? 1 : 0;
                        // data.language = $(".game_language_options a").map((i, e) => $(e).text()).get().join("、");
                        data.score = $("#review_histogram_rollup_section .game_review_summary").text() || "暂无评分";
                        data.score_tips = $("#review_histogram_rollup_section .game_review_summary").attr("data-tooltip-html") || "暂无评分";
                        data.metacritic_score =
                            $("#game_area_metascore .score")
                                .text()
                                .replace(/[\r\t\n]/g, "") || 0;

                        // 清除 tags 换行符和制表符
                        data.tags_user = $(".glance_tags.popular_tags a")
                            .map((i, e) =>
                                $(e)
                                    .text()
                                    .replace(/[\r\t\n]/g, "")
                            )
                            .get();

                        data.tags_steam = $("#genresAndManufacturer>span>a")
                            .map((i, e) =>
                                $(e)
                                    .text()
                                    .replace(/[\r\t\n]/g, "")
                            )
                            .get();

                        res.json(data);
                    } catch (e) {
                        console.log(e);
                        res.json([]);
                    }
                }
                cdone();
            },
        },
    ]);
});

module.exports = router;
