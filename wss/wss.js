/*
 * wss 长连接服务器
 */


const util = require('util');
const common = require('../common/common.js');
const https = require('https');
const http = require('http');
const zlib = require('zlib');

const { ServerName } = require('../common/enum.js');
const { startWebServer, loadGlobalServerConf } = require('../common/server.js');
const { loadConf, scheduleActivity } = require('../common/conf_mgr.js');

global.config = require(process.argv[2]);

var wss = require('./logic/');
require('../common/logger.js');

// 所有在线玩家的信息
global.gUsers = {
    /*
    uid : {
        openid : '',                // 玩家openid
        un : "",                    // 角色名
        level : 0,                  // 等级
        headpic : 0,                // 头像
        headframe : 0,
        vip : 0,                    // vip等级
        lid : 0,                    // 军团id
        country : 0,                // 所在国家
        conn : null,                // 长连接
        gyyx_lf: '',                // 光宇生命指纹
        game: '',                   // 登录游戏类型
        dist_id: 1,                 // 联运后台区服ID
        flags : {                   // 与客户端相关的标记，比如处在某一界面, 由客户端告知
            mine : 1,               // 在金矿界面
        },
        day_world_chat_count: 0,        // 今日世界聊天次数
        team_id:0                       // 小队id
    },
    */
};

// 聊天室
global.gChatMember = {

    clan: {
        //tid:[]
    },
    legion: {
        //lid:[]
    }

};

global.gConnTimes = {
    ai: 1,
    // id : [time, conn],           // 连接时间，连接对象
};

global.gChatLog = {         // 全局聊天记录，只记录在内存中，重启后丢失
    'world': [             // 世界聊天
        /*
        user : {            // 发言者信息
            un : '',
            vip : 0,
            level : 0,
            headpic : 0,
        },
        content : '',       // 聊天内容
        info : {},          // 附加信息，可有可无
        time : 0,           // 时间
        */
    ],

    'legion': {            // 军团聊天
        // lid : [],
    },

    'clan': {               // 战队聊天
        // 'team_id':[]
    },

    'country': {           // 国家聊天
        1: [],             // 魏
        2: [],             // 蜀
        3: [],             // 吴
    },

    'recruit': [],           // 招募

    'black': {             // 黑名单
        // uid : time
    },

    'private': {
        // 'uidA-uidB':[]       小的uid在前面
    }
};

var GameServerIds = Object.getOwnPropertyNames(config.Games);
var server_list = [
    // ServerName.TERRITORY_WAR,
    // ServerName.COUNTRY_WAR,
];

setupLog('wss');
//日志连接数据库
CreateLoggerDB();
// websocket使用的httperver
loadConf(config, ServerName.WSS);
scheduleActivity();
loadGlobalServerConf(config, ServerName.WSS, () => {
    // var httpServer = server.startHttpServer(
    startWebServer(ServerName.WSS, 0, server_list, null, onNetHandler, null, onExit, onWsQuery, onSocketError);
});

function onExit(callback) {
    SaveLog(
        function () {
            console.log("日志数据保存完成");
        }
    );
    // 退出处理
    var loader = new common.Loader(callback);
    loader.addLoad('empty');    // 防止没有需要Load的时候不结束
    loader.onLoad('empty');
}

function onNetHandler(net_type, query, res, resp, onReqHandled) {
    // 只处理由本地发过来的短连接请求
    do {
        if (res._ip != "127.0.0.1") {
            resp.code = 1; resp.desc = 'request refused'; break;
        }
        // type = 'self' 对自己的消息, all 是所有人
        if (query.type == 'self' && (!gUsers[query.uid] || !gUsers[query.uid].conn)) {
            break;
        }
        var wsHandler = null;
        var module = wss[query.mod];

        if (module) {
            wsHandler = module[query.act];
        }

        if (!wsHandler) {
            resp.code = 1;
            resp.desc = 'act ' + query.act + ' not support in mod ' + query.mod;
            break;
        }
        wsHandler(query, resp, function () {
            onReqHandled(res, resp);
        });
        return;
    } while (false);

    onReqHandled(res, resp);
}

function onWsQuery(query, onWsHandled) {
    var tHandler = function (resp, state) {
        onWsHandled(query, resp);
        if (state == 'new') {
            handleNewUser(this.conn, query);
        }
    };
    handleWsQuery(query, tHandler.bind(this))
}

function onSocketError(code, desc) {
    handleClose(this.conn, this.request.origin, code, desc);
}

/** 每5秒钟清除一次连接超时 */
setInterval(function () {
    var now = common.getTime();
    for (var id in gConnTimes) {
        if (id == 'ai') continue;
        if (now - gConnTimes[id][0] > 60) {
            gConnTimes[id][1].close();
        }
    }

    if (now + gTimeZone * 3600 % 86400 < 5) {                   // 次日凌晨统计今日充值
        requestPHP({
            uid: 1,
            act: 'daily_pay',
            args: {
                sid: config.ServerId,
            },
        }, {});
    }
}, 1000 * 5);

/** 处理客户端从长连接发过来的请求 */
var handleWsQuery = function (query, handler) {
    var resp = {
        'code': 1,
        'desc': '',
        'mod': query ? query.mod : "",
        'act': query ? query.act : "",
        'data': {}
    };

    if (!query) {
        handler(resp);
        return;
    }

    do {
        if (!query.uid) {
            resp.desc = 'no uid'; break;
        } else if (!query.mod) {
            resp.desc = 'no mod'; break;
        } else if (!query.act) {
            resp.desc = 'no act'; break;
        } else if (!query.args) {
            resp.desc = 'no args'; break;
        } else if (typeof query.args != 'object') {
            resp.desc = 'args not in json format'; break;
        } else if (query.mod != 'user' && query.act != 'handshake' && (!gUsers[query.uid] || gUsers[query.uid].conn != query.conn)) {
            resp.desc = 'not handshake'; break;
        }

        resp.code = 0;
        query.uid = +query.uid;

        var wsHandler = null;
        var module = wss[query.mod];
        if (module) {
            wsHandler = module[`ws_${query.act}`];
        }

        if (!wsHandler) {
            resp.code = 1;
            resp.desc = 'act ws_' + query.act + ' not support in mod ' + query.mod;
            break;
        }
        wsHandler(query, resp, function (arg) {
            handler(resp, arg);
        });
        return;
    } while (false);

    handler(resp);
};

function handleClose(conn, origin, code, desc) {
    var uid = conn.uid;
    if (gUsers[uid]) {
        // 更新玩家等级，用于下次登录前信息
        var phpReq = {
            uid: uid,
            act: 'update_user',
            client_ip: conn.remoteAddress,
            args: {
                name: gUsers[uid].un,
                level: gUsers[uid].level,
                headpic: gUsers[uid].headframe,
                headframe: gUsers[uid].headframe,
                openid: gUsers[uid].openid,
            },
        };
        requestPHP(phpReq, {});

        requestGame({
            uid: uid,
            mod: 'user',
            act: 'offline',
            auth_key: conn.auth_key,
            auth_time: conn.auth_time,
            args: {
                online_time: common.getTime() - conn.login_time,
            },
        }, {});

        requestTerritoryWar({
            uid: uid,
            mod: 'api',
            act: 'offline',
            auth_key: conn.auth_key,
            auth_time: conn.auth_time,
            args: {
                online_time: common.getTime() - conn.login_time,
            },
        }, {});

        requestCountryWar({
            uid: uid,
            mod: 'countrywar',
            act: 'offline',
            auth_key: conn.auth_key,
            auth_time: conn.auth_time,
            args: {
                online_time: common.getTime() - conn.login_time,
            },
        }, {});

        if (gUsers[uid].conn == conn) {
            delete gUsers[uid];
        }
    }

    if (conn.online_tick) {
        clearInterval(conn.online_tick);
    }

    if (gConnTimes[conn.conn_id]) {
        delete gConnTimes[conn.conn_id];
    }

    if (uid) {
        LOG("DISCONNECT: " + origin + " UID: " + uid + ", " + code + ": " + desc);
    } else {
        LOG("DISCONNECT: " + origin + " HANDSHAKE ERROR");
    }
}

function handleNewUser(conn, query) {
    conn.uid = query.uid;
    conn.auth_key = query.args.auth_key;
    conn.auth_time = query.args.auth_time;
    conn.login_time = common.getTime();

    var user = gUsers[query.uid];
    user.openid = query.args.openid;
    user.conn = conn;
    user.flags = {};
    delete gConnTimes[conn.conn_id];

    var recordOnline = function () {
        var phpReq = {
            uid: query.uid,
            act: 'user_online',
            args: {
                openid: user.openid,
                sid: config.DistId,
            },
        }
        LogCollect(phpReq.uid, phpReq.act, phpReq.args);
        // requestPHP(, {});
    };

    recordOnline();
    conn.online_tick = setInterval(recordOnline, 5 * 60 * 1000);
}

/** 向所有在线的人发送广播 */
global.broadcast = function (data) {
    if (typeof (data) == 'object') {
        data = JSON.stringify(data);
    }

    LOG('broadcast: ' + data);
    for (var uid in gUsers) {
        gUsers[uid].conn.sendUTF(data);
    }
}

/** 向指定对象广播 */
global.broadcastEx = function (uids, data) {
    if (!data) {
        ERROR('no data');
        return false;
    }

    if (typeof (data) == 'object') {
        data = JSON.stringify(data);
    }

    var ret = false;
    for (var i = 0, len = uids.length; i < len; i++) {
        var uid = uids[i];
        if (gUsers[uid]) {
            if (gUsers[uid].conn) {
                gUsers[uid].conn.sendUTF(data);
                ret = true;
            } else {
                ERROR('user conn is null, uid = ' + uid);
            }
        }
    }

    return ret;
};

global.requestGame = function (query, resp, callback) {
    var gameConf = config.Games[GameServerIds[query.uid % GameServerIds.length]];
    var options = {
        host: gameConf[0],
        port: gameConf[1],
        path: '/',
        method: 'POST',
        rejectUnauthorized: false,
    };

    var req = http.request(options, function (res) {
        var chunks = [];
        res.on('data', function (chunk) {
            chunks.push(chunk);
        });

        res.on('end', function () {
            var data = Buffer.concat(chunks).toString();
            var gameResp = null;
            try {
                gameResp = JSON.parse(data);
            } catch (error) {
                ERROR('game resp ' + data);
                gameResp = null;
            }

            if (!gameResp) {
                resp.code = 1;
                resp.desc = 'request game error';
            } else {
                resp.code = gameResp.code;
                resp.desc = gameResp.desc;
                resp.data = gameResp.data;
            }

            callback && callback();
        });
    });

    req.on('error', function () {
        resp.code = 1;
        resp.desc = 'request game error';
        callback && callback(null);
    });

    var stime = common.getTime();
    var sig = common.genHack(0, stime, query.args);
    req.end('mod={0}&act={1}&uid={2}&auth_key={3}&auth_time={4}&args={5}&seq=0&stime={6}&sig={7}'
        .format(query.mod, query.act, query.uid, query.auth_key, query.auth_time, JSON.stringify(query.args), stime, sig));
    req.end();
};
