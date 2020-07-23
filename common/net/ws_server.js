const http = require('http');
const https = require('https');
const util = require('util');
const fs = require('fs');
const url = require('url');
const qs = require('querystring');
const zlib = require('zlib');
const clone = require('clone');

const { ERROR, INFO, LOG } = require('../logger.js');
const { NET_TYPE } = require('../enum.js');
const { getTime } = require('../common.js');
const WebSocketServer = require('websocket').server;

var onQueryHandler = null;
var onCloseHandler = null;
/** 服务器的 ws客户端 */
var _server_socket_client = {};
/** 用户的   ws客户端 index 当前值 */
var _user_conn_id = 1;
/** 用户的   ws客户端 信息 {[index:number（唯一值）]:{time:number（最后一条消息时间） ,conn:socket.conn（链接） ,uid:number（玩家ID）}} */
var _user_socket_client = {};
/** 用户uid与链接index的匹配表 */
var _user_uid_to_index_map = {};
var _wait_resp_dict = {};
/** 下一帧运行 参数请通过bind放在this中 */
var _next_tick_call = [];

var _server_name = "";
var _idx;

var checkOriginIsAllowed = function (query, conn) {
    if (query.from_server) {
        var tSocketInfo = _server_socket_client[query.from_server];
        if (!tSocketInfo) { return false; }
        if (!tSocketInfo.clients || tSocketInfo.clients.length <= 0) { return false; }
        var tWebSocketClient = tSocketInfo.clients[query.from_idx];
        if (!tWebSocketClient) { return false; }
        if (tWebSocketClient != conn) { return false; }
        return true;
    }
    else if (query.uid) {
        return true
    }
    else {
        return false;
    }
};

/** 创建websocket服务器 */
exports.startWssServer = function (serverName, else_id, httpServer, $checkOriginIsAllowed, $onQueryHandler, $onCloseHandler) {
    _idx = else_id + 1;
    _server_name = serverName;
    onQueryHandler = $onQueryHandler || onQueryHandler;
    onCloseHandler = $onCloseHandler;
    checkOriginIsAllowed = $checkOriginIsAllowed || checkOriginIsAllowed;
    var wsServer = new WebSocketServer({
        httpServer: httpServer,
    });

    wsServer.on('request', on_request);

    setInterval(tick, 20);
}

function on_request(request) {
    if (!request.origin) {                                          // 没有标注来源 
        request.reject();
        console.log('REJECT: ' + request.origin);
        return;
    }

    var origin
    try {
        origin = JSON.parse(request.origin);
    } catch (error) {
    }

    on_request_handler.bind({ request: request, origin: origin })(true);
}

function on_request_handler(acc) {
    var request = this.request;
    var origin = this.origin;
    if (!acc) {                                                     // 错误的消息
        request.reject();
        console.log('REJECT: ' + request.origin);
        return;
    }

    var conn = request.accept('default-protocol', request.origin);
    conn.connected = true;
    conn.on('message', on_message.bind({ conn: conn, request: request, from_idx: origin ? origin.idx : 0, name: origin ? origin.server : "" }));
    conn.on('close', on_close.bind({ conn: conn, request: request, from_idx: origin ? origin.idx : 0, name: origin ? origin.server : "" }));

    if (origin && origin.server && origin.index) {
        _server_socket_client[origin.server] = _server_socket_client[origin.server] || { clients: [] };
        _server_socket_client[origin.server].clients = _server_socket_client[origin.server].clients || [];
        _server_socket_client[origin.server].clients[origin.index] = conn;
        console.log(`socket connect [${origin.server} ,${origin.index}] 【　ok  】`);
    }
    else {
        _user_socket_client[_user_conn_id++] = {
            time: getTime(),
            conn: conn,
            uid: NaN
        };
    }
    console.log("CONNECT: " + request.origin);
};

function delete_close_conn(server_name) {
    for (var tKey in _server_socket_client) {
        if (server_name && server_name != tKey) { continue; }

        var tSocketInfo = _server_socket_client[tKey];
        if (!tSocketInfo) { continue; }

        var tConnList = tSocketInfo.clients;
        if (!tConnList || tConnList.length < 0) { continue; }

        for (var i = (tConnList.length - 1); i >= 0; i--) {
            if (!tConnList[i]) { continue; }
            if (tConnList[i].connected) { continue; }

            var tDeleteList = [];
            if (_wait_resp_dict[tKey]) {
                for (var tKeyI in _wait_resp_dict[tKey]) {
                    tDeleteList.push(tKeyI);
                }
            }
            for (var i = 0; i < tDeleteList.length; i++) {
                var tRespUID = tDeleteList[i];
                var tSendItem = _wait_resp_dict[tKey][tRespUID];
                if (!tSendItem) {
                    delete _wait_resp_dict[tKey][tRespUID];
                    continue;
                }

                if (tSendItem.is_must_send) {
                    tSocketInfo.send_list.push(tSendItem);                                             // 这个消息必须要送达 添加到等待队列
                    delete _wait_resp_dict[tKey][tRespUID];
                    continue;
                }

                if (!tSendItem.call) {
                    delete _wait_resp_dict[tKey][tRespUID];
                    continue;
                }

                _next_tick_call.push(                                                                                         // 为保证不会造成阻塞 设定为20毫秒后调用函数
                    function () {
                        this.send_item.call({ code: -114, msg: "socket close" });
                    }.bind({ send_item: tSendItem })
                )
                delete _wait_resp_dict[tKey][tRespUID];
                continue;
            }

            tConnList[i] = null;
        }
    }
}

function on_close(code, desc) {
    if (this.name) {
        console.log(` socket close 【 ${this.name} 】 ${code} - ${desc}`);
    }
    this.conn.removeAllListeners('message');
    this.conn.removeAllListeners('close');
    this.conn.connected = false;

    for (var tKey in _user_socket_client) {
        var tSocketClientInfo = _user_socket_client[tKey];
        if (!tSocketClientInfo) { continue; }
        if (tSocketClientInfo.conn != this.conn) { continue; }
        delete _user_socket_client[tKey];
        break;
    }

    if (onCloseHandler) {
        onCloseHandler(code, desc);
    }
}

function onWsHandled(query, resp) {
    var conn = query.conn;
    // 有些请求不需要回复
    if (!resp.nosend && conn.connected) {
        resp.serverTime = getTime();
        var strData = JSON.stringify(resp)

        if (!config.NotGzip && strData.length > 1024) {
            zlib.deflate(
                strData,
                function (err, out) {
                    conn.sendBytes(out);
                }
            );
        } else {
            conn.sendUTF(strData);
        }
    }

    var timeCost = +(new Date()) - conn._time;
    if (query.mod != 'push') {
        console.log(`onWsHandled query:{uid:${query.uid ? query.uid : `${query.from_server}_${query.from_idx}`}, act:${query.act}, mod:${query.mod}}, seq:${query.seq || 0}, time cost:${timeCost}, resp:{code:${resp.code}, desc:${resp.desc}}`)
        // LOG(`onWsHandled query:{uid:${query.uid}, act:${query.act}, mod:${query.mod}}, ${query.seq || 0}, ${JSON.stringify(query.args)}, time cost:${timeCost}, ${resp.data}, resp:{code:${resp.code}, desc:${resp.desc}}`)
    }
};

function on_message(message) {
    var query = null;
    switch (message.type) {
        case 'utf8':
            try {
                query = JSON.parse(message.utf8Data);
            } catch (error) {
                query = { msg: message.utf8Data };
                ERROR('wss message not json ' + message.utf8Data);
            }
            break;
        case 'binary':
            if (!message.binaryData) { break; }

            let tBinaryData = zlib.unzipSync(message.binaryData);
            try {
                query = JSON.parse(tBinaryData.toString());
            } catch (error) {
                ERROR('wss message ' + tBinaryData.toString());
            }
            break;
    }
    this.conn._time = +(new Date());

    query = query || {};

    if (!checkOriginIsAllowed(query, this.conn)) {                                                              // 无效的消息源
        this.conn.close();
        return;
    }

    // console.log(` - on message ${JSON.stringify(query)} ,${Date.now()}`);
    query.conn = this.conn;

    if (query.resp_uid && query.from_idx) {                                                           // 一个请求的返回
        query.req = query.req || {};
        console.log(` on query resp {server:${query.from_server} ,index:${query.from_idx} ,code:${query.code} ,desc:${query.desc} ,req_info:{act:${query.req.act} ,mod:${query.req.mod}}}`);

        _wait_resp_dict = _wait_resp_dict || {};
        _wait_resp_dict[query.from_server] = _wait_resp_dict[query.from_server] || {};
        var tSendItem = _wait_resp_dict[query.from_server][`${query.resp_uid}_${query.from_idx}`];
        if (tSendItem) {
            if (tSendItem.resp) {
                if (!query) {
                    tSendItem.resp.code = 1;
                    tSendItem.resp.desc = `request ${query.to_server} error`;
                } else {
                    tSendItem.resp.code = query.code;
                    tSendItem.resp.desc = query.desc;
                    tSendItem.resp.data = query.data;
                }
            }
            tSendItem.call && tSendItem.call(query);
        }
        delete _wait_resp_dict[query.from_server][`${query.resp_uid}_${query.from_idx}`];
        // console.log(` on resp result ${query.from_server}, ${query.resp_uid}_${query.from_idx}`);
        return;
    }

    var tOnQueryHandlerCall = (query, resp) => {
        if (query.act == "handshake" && query.mod == "user") {
            var tOldSocketClientInfo = _user_socket_client[_user_uid_to_index_map[query.uid]];
            if (tOldSocketClientInfo) {                                             // 有旧的连接代表是重复连接 将旧的tim设定为0 之后判断是否需要超时断开
                tOldSocketClientInfo.time = 0;
            }

            for (var tKey in _user_socket_client) {
                var tSocketClientInfo = _user_socket_client[tKey];
                if (!tSocketClientInfo) { continue; }
                if (tSocketClientInfo.conn != query.conn) { continue; }

                tSocketClientInfo.uid = query.uid;                                  // 当前链接 记录对应的索引表
                tSocketClientInfo.time = getTime();
                _user_uid_to_index_map[query.uid] = tKey;
                break;
            }
        }

        query = query || {};
        resp.resp_uid = query.query_uid;
        resp.req = {
            act: query.act,
            mod: query.mod,
        };
        resp.to_server = query.from_server;
        resp.from_server = _server_name;
        var tOldIDX = query.to_idx;
        resp.to_idx = query.from_idx;
        resp.from_idx = tOldIDX;
        onWsHandled(query, resp)
    }

    var resp = {
        'code': 0,
        'desc': '',
        'data': {},
    };

    if (onQueryHandler) {
        var tNeedClose = onQueryHandler((query.from_server ? NET_TYPE.WEB_SOCKET_SERVER : NET_TYPE.WEB_SOCKET_USER), query, query, resp, tOnQueryHandlerCall);
    } else {
        tOnQueryHandlerCall(query, resp);
    }

    if (tNeedClose) {                        // 握手失败，断开连接
        if (conn.connected) {
            conn.close();
        }
    }
}

function tick() {
    var tNow = Date.now();
    next_tick_call_back(tNow);
    socket_tick(tNow);
}

function next_tick_call_back(dt) {
    if (_next_tick_call && _next_tick_call.length > 0) {
        for (var i = 0; i < _next_tick_call.length; i++) {
            _next_tick_call[i]();
        }
    }
}

var _last_socket_tick_time = 0;
function socket_tick(dt) {
    if (_last_socket_tick_time >= dt) { return; }
    tick_for_send(dt);

    _last_socket_tick_time = dt + 5 * 1000;
    delete_close_conn();
}

function send_msg_to_user(uid, msg_data, call_back) {
    msg_data = msg_data || {};
    msg_data.query_uid = Date.now();

    var tSocketClientInfo = _user_socket_client[_user_uid_to_index_map[uid]]
    var _client = tSocketClientInfo ? tSocketClientInfo.conn : null;

    if (!_client) {
        call_back({ code: 0, desc: ` client ${uid} not existent ` });
        return false;
    }

    if (!_client.connected) {
        call_back({ code: 0, desc: ` client ${uid} disconnect ` });
        return false;
    }

    tSocketClientInfo.time = getTime();
    _client.sendUTF(JSON.stringify(tSendItem.data), tOnSendOver);
    call_back({ code: 0, desc: ` send over ` });
    return true;
}

function send_msg_to_server(server_name, msg_data, msg_resp, send_call, call_back, is_must_send) {
    msg_data = msg_data || {};
    msg_data.to_server = server_name;
    msg_data.from_server = _server_name;
    msg_data.query_uid = `${server_name}_${Date.now()}_${Math.random() * 10000}`;

    _server_socket_client[server_name] = _server_socket_client[server_name] || {};
    _server_socket_client[server_name].send_list = _server_socket_client[server_name].send_list || [];
    _server_socket_client[server_name].send_list.push({ query_uid: msg_data.query_uid, data: msg_data, resp: msg_resp, send_call: send_call, call: call_back, is_must_send: is_must_send });

    send_call = send_call || function (err) {
        // console.log(err);
    };
    if (!client_send(server_name)) {
        send_call({ code: 0, desc: ` server client error [${server_name}]` });
    }
    else {
        send_call({ code: 0, desc: ` send over ` });
    }
    return true;
}

function client_send(server_name) {
    var tClientInfo = _server_socket_client[server_name];
    if (!tClientInfo) { return false; }
    if (!tClientInfo.send_list) { return false; }
    if (tClientInfo.send_list.length <= 0) { return false; }

    var _clients = tClientInfo.clients;
    if (!_clients) { return false; }

    var tNowClientLength = tClientInfo.send_list.length;                            // 为保证不会重连期间不会死循环，只需要计算当前的消息条数并尝试发送一遍就可以，其余等待下一tick再尝试
    while (tNowClientLength) {
        tNowClientLength--;
        var tSendItem = tClientInfo.send_list.pop();

        var tOnSendOver = function (err) {
            var tClientInfo = _server_socket_client[this.name];
            if (!tClientInfo) { return; }

            if (_wait_resp_dict[this.name] && _wait_resp_dict[this.name][`${this.query_uid}_${this.to_idx}`]) {
                var tSendItem = _wait_resp_dict[this.name][`${this.query_uid}_${this.to_idx}`];
            }

            if (tSendItem) {
                if (err && tSendItem.is_must_send) {
                    tClientInfo.send_list.push(tSendItem)
                    delete _wait_resp_dict[this.name][`${this.query_uid}_${this.to_idx}`];
                }

                var tCallFunc = tSendItem.send_call;
                tCallFunc && tCallFunc(err);
            }

            // console.log(` -----  on socket send msg to ${server_name} 【 ${!err ? "ok" : JSON.stringify(err)} 】`);
        };

        if (tSendItem.to_idx) {

            tSendItem.data.from_idx = _idx;                                                                                  // 发送服务器的索引

            _wait_resp_dict = _wait_resp_dict || {};
            _wait_resp_dict[this.name] = _wait_resp_dict[this.name] || {};
            _wait_resp_dict[this.name][`${this.query_uid}_${this.to_idx}`] = tSendItem;

            var _client = _clients[tSendItem.to_idx];
            if (!_client) {
                tClientInfo.send_list.push(tSendItem);
                return false;
            }
            if (!_client.connected) {
                tClientInfo.send_list.push(tSendItem);
                return false;
            }

            _client.sendUTF(JSON.stringify(tSendItem.data), tOnSendOver.bind({ to_idx: tSendItem.to_idx, name: server_name, query_uid: tSendItem.query_uid }));
        }
        else {
            for (var i = 0; i < _clients.length; i++) {

                var _client = _clients[i];
                if (!_client) {
                    continue;
                }

                var tRespObj = tSendItem.resp;
                tSendItem = clone(tSendItem);
                tSendItem.resp = tRespObj;

                tSendItem.to_idx = i;
                tSendItem.data.from_idx = _idx;                                                                                 // 发送服务器的索引
                tSendItem.data.to_idx = i;                                                                                      // 目标服务器索引

                _wait_resp_dict = _wait_resp_dict || {};
                _wait_resp_dict[this.name] = _wait_resp_dict[this.name] || {};
                _wait_resp_dict[this.name][`${this.query_uid}_${this.to_idx}`] = tSendItem;

                if (!_client.connected) {
                    tClientInfo.send_list.push(tSendItem);
                    continue;
                }

                _client.sendUTF(JSON.stringify(tSendItem.data), tOnSendOver.bind({ to_idx: tSendItem.to_idx, name: server_name, query_uid: tSendItem.query_uid }));
            }
        }
    }

    return true;
}

function tick_for_send(dt) {
    for (var tKey in _server_socket_client) {
        client_send(tKey);
    }
}

/**
 * 发送消息给其他服务器
 * @param {*} server_name 
 * @param {*} act 
 * @param {*} mod 
 * @param {*} msg 
 * @param {*} msg_resp          返回内容存储的结构体
 * @param {*} send_call         发送情况 
 * @param {*} call_back         请求返回
 * @param {*} is_must_send      必须发送成功 (data:{code:number ,desc:string ,data:any ,resp_uid:string})
 */
global.server_send_msg = exports.server_send_msg = function (server_name, act, mod, msg, msg_resp, send_call, call_back, is_must_send) {
    return send_msg_to_server(server_name, { act: act, mod: mod, args: msg }, msg_resp, send_call, call_back, is_must_send);
}

/**
 * 发送消息给玩家
 * @param {*} server_name 
 * @param {*} act 
 * @param {*} mod 
 * @param {*} msg 
 * @param {*} send_call         发送情况 
 * @param {*} call_back         请求返回
 */
global.send_msg_to_user = exports.send_msg_to_user = function (server_name, act, mod, msg, send_call, call_back) {
    return send_msg_to_user(server_name, { act: act, mod: mod, args: msg }, send_call, call_back);
}