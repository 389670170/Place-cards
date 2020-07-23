// 日志类型
exports.LogType = {
    // 产出
    /** 货币产出，包括元宝、金币、粮草等 */
    LOG_CURRENCY_PRODUCE: 101,
    /** 材料产出 */
    LOG_MATERIAL_PRODUCE: 102,
    /** 装备产出 */
    LOG_EQUIP_PRODUCE: 103,
    /** 卡牌产出 */
    LOG_CARD_PRODUCE: 104,
    /** 龙晶产出 */
    LOG_DRAGON_PRODUCE: 105,
    /** 武将碎片产出 */
    LOG_CARD_FRAGMENT_PRODUCE: 106,
    /** 装备碎片产出 */
    LOG_EQUIP_FRAGMENT_PRODUCE: 107,
    /** 宝石产出 */
    LOG_GEM_PRODUCE: 108,
    /** 小兵装备产出 */
    LOG_SOLDIER_EQUIP_PRODUCE: 109,
    /** 符文产出 */
    LOG_RUNE_PRODUCE: 110,

    // 消耗
    /** 货币消耗 */
    LOG_CURRENCY_CONSUME: 201,
    /** 道具消耗 */
    LOG_MATERIAL_CONSUME: 202,
    /** 装备消耗 */
    LOG_EQUIP_CONSUME: 203,
    /** 卡牌消耗 */
    LOG_CARD_CONSUME: 204,
    /** 龙晶消耗 */
    LOG_DRAGON_CONSUME: 205,
    /** 卡牌碎片消耗 */
    LOG_CARD_FRAGMENT_CONSUME: 206,
    /** 装备碎片消耗 */
    LOG_EQUIP_FRAGMENT_CONSUME: 207,
    /** 宝石消耗 */
    LOG_GEM_CONSUME: 208,
    /** 小兵装备消耗 */
    LOG_SOLDIER_EQUIP_CONSUME: 209,
    /** 符文消耗 */
    LOG_RUNE_CONSUME: 210,
};

/** 服务器名字 */
exports.ServerName = {
    GLOBAL: "global",
    WORLD_WAR: "worldwar",
    LEGION_WAR: "legionwar",
    TERRITORY_WAR: "territorywar",
    COUNTRY_WAR: "country_war",
    ARENA: "arenaServer",
    LAND_GRABBER: "landGrabber",//landgrabber
    TEAM_ZONE: "teamzone",

    GAME: "game",
    WORLD: "world",
    GATE_WAY: "gate_way",
    WSS: "wss",
    LOG: "log",
}

/** 网络类型 */
exports.NET_TYPE = {
    /** socket 客户端 */
    WEB_SOCKET_CLIENT: "web_socket_client",
    /** socket 服务端 */
    WEB_SOCKET_SERVER: "web_socket_servre",
    /** socket 玩家 */
    WEB_SOCKET_USER: "web_socket_user",
    /** http */
    HTTP_USER: "http_user",
}

/** mongo db 各个数据库名字 */
exports.MONGO_DB_NAME = {
    GLOBAL: {
        DB_WORLD: "world",
    },
    ARENA: {
        DB_USER: "user",
        DB_WORLD: "world",
    },
    COUNTRY_WAR: {
        DB_USER: "user",
        DB_COUNTRY_WAR: "countrywar",
        DB_ROOMS: "rooms",
    },
    LANDGRABBER: {
        DB_USER: "user",
        DB_WORLD: "world",
    },
    LEGION_WAR: {
        DB_REGISTER: "register",
        DB_WORLD: "world",
        LEGION: "legion",
        DB_ROBOT: "robot",
        DB_HISTORY: "history",
        DB_RANK_LIST: "ranklist",
    },
    TEAM_ZONE: {
        DB_USER: "user",
        DB_WORLD: "world",
    },
    TERRITORY_WAR: {
        DB_USER: "user",
        DB_WORLD: "world",
        DB_TERRITORY: "territory",
    },
    WORLD_WAR: {
        DB_USER: "user",
        DB_REPLAY: "replay",
        DB_WORLD: "world",
    },

    GATE_WAY: {
        DB_PLAT: "plat",
        DB_USER: "user",
        DB_PAY: "pay",
    },
    GAME: {
        DB_USER: "user",
        DB_ANALYSIS: "analysis",
        DB_PLAT: "plat",
    },
    WORLD: {
        DB_USER: "user",
        DB_WORLD: "world",
        DB_MAIL: "mail",
    },
    LOG: {
        DB_WORLD: "world",
    },
}

/** 队伍用途名字 */
exports.TEAM_NAME = {
    /** 默认队伍 */
    DEFAULT: "default",
    /** 竞技场队伍 */
    ARENA: "arena",
}

/** 人皇自定义配置  修改人皇功能在这里修改即可 */
exports.SKY_TYPE_CONFIG = {
    /** 武器 */
    weapon: 1,
    /** 翅膀 */
    wing: 2,
    /** 坐骑 */
    mount: 3
};

// 全局变量
exports.pubKey = [3, 33];
exports.priKey = [3, 15];


/** 一天的秒数 */
exports.OneDayTime = 60 * 60 * 24;
/** 一周的秒数 */
exports.OneWeekTime = exports.OneDayTime * 7;

/** 部位数量 */
exports.HeroPartCount = 6;