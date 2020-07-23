const http = require('http');
const https = require('https');
const util = require('util');
const fs = require('fs');
const url = require('url');
const qs = require('querystring');
const zlib = require('zlib');
const clone = require('clone');
const { client } = require('websocket');

const common = require('../common.js');
const { ServerName, NET_TYPE } = require('../enum.js');

var _server_socket_client = {};
var _wait_resp_dict = {};
var _server_list = [];
var on_ws_query_handler = null;
/** 下一帧运行 参数请通过bind放在this中 */
var _next_tick_call = [];
var _server_name = "";
var _idx;
var checkOriginIsAllowed = function (query, conn) {
    var tSocketInfo = _server_socket_client[query.from_server];
    if (!tSocketInfo) { return false; }
    if (!tSocketInfo.clients || tSocketInfo.clients.length <= 0) { return false; }
    var tWebSocketClient = tSocketInfo.clients[query.from_idx];
    if (!tWebSocketClient) { return false; }
    if (tWebSocketClient.conn != conn) { return false; }
    return true;
};

/** 报错socket客户端连接状态 */
exports.startWSClient = function ($server_name, else_id, server_list, $checkOriginIsAllowed, $onQueryHandler) {
    _idx = else_id + 1;
    _server_name = $server_name;
    _server_list = server_list || [];
    on_ws_query_handler = $onQueryHandler;
    checkOriginIsAllowed = $checkOriginIsAllowed || checkOriginIsAllowed;
    setInterval(tick, 20);
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
    _last_socket_tick_time = dt + 5 * 1000;

    tick_for_send(dt);
    _server_list = _server_list || [];
    for (var tKey in ServerName) {
        // for (var i = 0; i < _server_list.length; i++) {
        // var tKey = _server_list[i];
        var tServerName = ServerName[tKey];

        if (_server_list.indexOf(tServerName) == -1) {
            continue;
        }

        var tServerInfoList;
        if (ServerName[tKey] == ServerName.GAME) {
            tServerInfoList = common.GLOBAL_SERVER_INFO_DICT[tServerName];
        }
        else {
            tServerInfoList = [common.GLOBAL_SERVER_INFO_DICT[tServerName]];
        }

        for (var i = 0; i < tServerInfoList.length; i++) {
            var tServerInfo = tServerInfoList[i];
            if (!tServerInfo) { continue; }
            _server_socket_client[tServerName] = _server_socket_client[tServerName] || {};
            var _clientInfo = _server_socket_client[tServerName];
            _clientInfo.clients = _clientInfo.clients || [null];
            var _clients = _clientInfo.clients;
            var tIdx = i + 1;
            var _client = _clients[tIdx];
            if (!_client || !_client.connected) {
                _client = new client();
                var tUrlURL = `ws://${tServerInfo.host}:${tServerInfo.port}/`;
                _client.connect(tUrlURL, "default-protocol", JSON.stringify({ server: _server_name, index: (_idx || 0), orgin_host: tServerInfo.host, orgin_port: tServerInfo.port }));
                console.log(` connect 【    ${tUrlURL}  】 【 ${tServerName} 】`);

                _client.on('connect', function (connection) {
                    console.log(` on socket connect 【  ${this.url}  】 【   ok   】 for [${this.name}] `);
                    if (!this.client) { return; }
                    this.client.connected = true;
                    this.client.conn = connection;

                    connection.on("close", on_client_close.bind({ name: this.name, to_idx: this.to_idx }));
                    connection.on("message", on_message.bind({ name: this.name, conn: connection }));
                    connection.on('ping', on_ping.bind(this.name));
                    connection.on('pong', on_pong.bind(this.name));
                }.bind({ name: tServerName, client: _client, to_idx: tIdx, url: tUrlURL }));

                _client.on('connectFailed', function (err) {
                    console.log(` on socket connect 【  ${this.url}  】 【 failed 】 for [${this.name}] `);
                    if (!this.client) { return; }
                    this.client.connected = false;
                    if (!this.client.conn) { return; }
                    this.client.conn.close();
                }.bind({ name: tServerName, client: _client, url: tUrlURL }));

                _client.on('httpResponse', function (response, client) {
                    // console.log(` on 【  ${this.url}  】 socket http response for [${this.name}] `);
                    if (!this.client) { return; }
                }.bind({ name: tServerName, client: _client, url: tUrlURL }));

                _server_socket_client[tServerName].clients[tIdx] = _client;
            }
        }
    }
}

function onWsHandled(query, resp) {
    var conn = query.conn;
    // 有些请求不需要回复
    if (!resp.nosend && conn.connected) {
        resp.serverTime = common.getTime();
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
        // LOG(util.format('%s %s %s %s %j %d %j %d %s', query.uid, query.mod, query.act, query.seq || 0, query.args, timeCost, resp.data, resp.code, resp.desc));
        // LOG(` uid:${query.uid}, mod:${query.mod}, act:${query.act}, seq:${query.seq || 0}, args:${query.args}, time cost:${timeCost}, resp:{data:${resp.data}, code:${resp.code}, desc:${resp.desc}}`);
        console.log(` uid:${query.uid}, mod:${query.mod}, act:${query.act}, seq:${query.seq || 0}, args:${query.args}, time cost:${timeCost}, resp:{code:${resp.code}, desc:${resp.desc}}`);
    }
};

function on_client_close(code, desc) {
    console.log(` socket close 【 ${this.name} 】 ${code} - ${desc}`);

    var tSocketClient = _server_socket_client[this.name];
    if (!tSocketClient) { return; }
    if (!tSocketClient.clients) { return; }

    var tDeleteList = [];
    if (_wait_resp_dict[this.name]) {
        for (var tKey in _wait_resp_dict[this.name]) {
            tDeleteList.push(tKey);
        }
    }
    for (var i = 0; i < tDeleteList.length; i++) {
        var tRespUID = tDeleteList[i];
        var tSendItem = _wait_resp_dict[this.name][tRespUID];
        if (!tSendItem) {
            delete _wait_resp_dict[this.name][tRespUID];
            continue;
        }

        if (tSendItem.is_must_send) {
            tSocketClient.send_list.push(tSendItem);                                               // 这个消息必须要送达 添加到等待队列
            // send_msg_to_server(this.name, tSendItem.data, tSendItem.send_call, tSendItem.call, tSendItem.is_must_send);     // 这个消息必须要送达 添加到等待队列
            delete _wait_resp_dict[this.name][tRespUID];
            continue;
        }

        if (!tSendItem.call) {
            delete _wait_resp_dict[this.name][tRespUID];
            continue;
        }

        _next_tick_call.push(                                                                                         // 为保证不会造成阻塞 设定为20毫秒后调用函数
            function () {
                this.send_item.call({ code: -114, msg: "socket close" });
            }.bind({ send_item: tSendItem })
        )
        delete _wait_resp_dict[this.name][tRespUID];
        continue;
    }

    for (var tKeyI in tSocketClient._wait_resp_dict) {
        if (!tSocketClient._wait_resp_dict[tKeyI]) { continue; }
        var tSendItem = tSocketClient._wait_resp_dict[tKeyI];

        if (tSendItem.is_must_send) {
            tSocketClient.send_list.push(tSendItem);                                               // 这个消息必须要送达 添加到等待队列
            // send_msg_to_server(this.name, tSendItem.data, tSendItem.send_call, tSendItem.call, tSendItem.is_must_send);
            continue;
        }

        _next_tick_call.push(                                                                                         // 为保证不会造成阻塞 设定为20毫秒后调用函数
            function () {
                this.send_item.call({ code: -114, msg: "socket close" });
            }.bind({ send_item: tSendItem })
        )
        continue;
    }
    tSocketClient._wait_resp_dict = {};

    var client = tSocketClient.clients[this.to_idx];
    client.connected = false;
    if (client.conn) {
        client.conn.removeAllListeners("close");
        client.conn.removeAllListeners("message");
        client.conn.removeAllListeners('ping');
        client.conn.removeAllListeners('pong');
    }
    client.removeAllListeners("connect");
    client.removeAllListeners("connectFailed");
    client.removeAllListeners("httpResponse");
}

function on_message(message) {
    var query = null;
    var conn = this.conn;
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
            if (message.binaryData) {
                let tBinaryData = zlib.unzipSync(message.binaryData);
                try {
                    query = JSON.parse(tBinaryData.toString());
                } catch (error) {
                    console.log('wss message ' + tBinaryData.toString());
                }
            }
            break;
    }
    conn._time = +(new Date());

    query = query || {};
    // console.log(` - ${Date.now()} ,on message ${JSON.stringify(query)}`);
    query.conn = conn;

    if (!checkOriginIsAllowed(query, conn)) {                                                              // 无效的消息源
        this.conn && this.conn.close();
        return;
    }

    if (query.resp_uid && query.from_idx) {                                                           // 一个请求的返回
        query.req = query.req || {};
        console.log(` on query resp {server:${query.from_server} resp uid:${query.resp_uid},index:${query.from_idx} ,code:${query.code} ,desc:${query.desc} ,req_info:{act:${query.req.act} ,mod:${query.req.mod}}}`);

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
        'code': 1,
        'desc': '',
        'data': {},
    };

    var tNeedClose = false;
    if (on_ws_query_handler) {
        tNeedClose = on_ws_query_handler(NET_TYPE.WEB_SOCKET_SERVER, query, query, resp, tOnQueryHandlerCall);
    } else {
        tOnQueryHandlerCall(query, resp);
    }

    // if (state == 'close') {                        // 握手失败，断开连接
    if (tNeedClose) {                        // 握手失败，断开连接
        if (conn.connected) {
            conn.close();
        }
    }
    // console.log(` ..... `, query);
}

function on_ping() {
    // console.log(` server ${this} ping `);
}
function on_pong() {
    // console.log(` server ${this} pong `);
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

    var tNowClientLength = tClientInfo.send_list.length;
    while (tNowClientLength) {                            // 为保证不会重连期间不会死循环，只需要计算当前的消息条数并尝试发送一遍就可以，其余等待下一tick再尝试
        tNowClientLength--;

        var tSendItem = tClientInfo.send_list.pop();

        var tOnSendOver = function (err) {
            var tClientInfo = _server_socket_client[this.name];
            if (!tClientInfo) { return; }

            if (_wait_resp_dict[this.name] && _wait_resp_dict[this.name][`${this.query_uid}_${this.to_idx}`]) {
                var tSendItem = _wait_resp_dict[this.name][`${this.query_uid}_${this.to_idx}`];
            }

            if (tClientInfo.clients[this.to_idx]) {
                tClientInfo.clients[this.to_idx].is_sending = false;
            }

            if (tSendItem) {
                if (err && tSendItem.is_must_send) {
                    tClientInfo.send_list.push(tSendItem);
                    delete _wait_resp_dict[this.name][`${this.query_uid}_${this.to_idx}`];
                }

                var tCallFunc = tSendItem.send_call;
                tCallFunc && tCallFunc(err);
            }

            // console.log(` -----  on socket send msg to ${this.name} 【 ${!err ? "ok" : JSON.stringify(err)} 】`);
        };

        if (tSendItem.to_idx) {

            tSendItem.data.from_idx = _idx;                                                                                  // 发送服务器的索引

            _wait_resp_dict = _wait_resp_dict || {};
            _wait_resp_dict[server_name] = _wait_resp_dict[server_name] || {};
            _wait_resp_dict[server_name][`${tSendItem.query_uid}_${tSendItem.to_idx}`] = tSendItem;

            var _client = _clients[tSendItem.to_idx];
            if (!_client) {
                tClientInfo.send_list.push(tSendItem);
                return false;
            }
            if (!_client.connected) {
                tClientInfo.send_list.push(tSendItem);
                return false;
            }
            if (_client.is_sending) {
                tClientInfo.send_list.push(tSendItem);
                return false;
            }

            _client.conn.sendUTF(JSON.stringify(tSendItem.data), tOnSendOver.bind({ to_idx: tSendItem.to_idx, name: server_name, query_uid: tSendItem.query_uid }));
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
                _wait_resp_dict[server_name] = _wait_resp_dict[server_name] || {};
                _wait_resp_dict[server_name][`${tSendItem.query_uid}_${tSendItem.to_idx}`] = tSendItem;

                if (!_client.connected) {
                    tClientInfo.send_list.push(tSendItem);
                    return false;
                }
                if (_client.is_sending) {
                    tClientInfo.send_list.push(tSendItem);
                    return false;
                }

                _client.conn.sendUTF(JSON.stringify(tSendItem.data), tOnSendOver.bind({ to_idx: tSendItem.to_idx, name: server_name, query_uid: tSendItem.query_uid }));
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
 * 发送消息
 * @param {*} server_name 
 * @param {*} act 
 * @param {*} mod 
 * @param {*} msg 
 * @param {*} msg_resp          返回内容存储的结构体
 * @param {*} send_call         发送情况 
 * @param {*} call_back         请求返回
 * @param {*} is_must_send      必须发送成功 (data:{code:number ,desc:string ,data:any ,resp_uid:string})
 */
global.client_send_msg = exports.client_send_msg = function (server_name, act, mod, msg, msg_resp, send_call, call_back, is_must_send) {
    return send_msg_to_server(server_name, { act: act, mod: mod, args: msg }, msg_resp, send_call, call_back, is_must_send);
}