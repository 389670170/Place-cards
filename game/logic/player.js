
const util = require('util');
const clone = require('clone');
const CostLog = require('./cost_log.js');
const ResBack = require('./resback.js');
const Upgrade = require('./upgrade.js');
const loginCommon = require('./common.js');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const server = require('../../common/server.js');
const logic_event_mgr = require('./logic_event_mgr.js');
const logic = require('../logic');
const hero = require('./hero.js');
const rune_mod = require('./rune.js');
const task_mod = require('./task.js');
const player_team = require('./player_team.js');
const { user_snapshot_data } = require('../../common/common.js');
const { ServerName, LogType, OneDayTime, TEAM_NAME, SKY_TYPE_CONFIG, HeroPartCount } = require('../../common/enum.js');
const { client_send_msg } = require('../../common/net/ws_client.js');
const { forceSyncToWorld } = require('./common.js');
const { parseAwardsConfig, isModuleOpen_new, reformAwards, cloneHeroInitAttr } = require('../../common/global.js');

function Player(uid) {
    this.uid = uid;
    this.user = null;
    this.dirty = {};                    // 本次操作脏数据
    this.allDirty = {};                 // 累计的脏数据
    this.saveCount = 0;                 // 数据库存盘计数
    this.saveError = false;             // 是否出现数据库写入错误
    this.lastActive = common.getTime(); // 上次活跃时间
    this.heroDirty = true;              // 阵上武将数据是否需要重新计算
    this.teamChanged = true;            // 阵型是否发生了变化
    this.lock = false;                  // 并发锁
    this.seq = 0;                       // 请求序列值, 用于判断是否是消息重发
    this.hasTip = false;                // 是否有提醒
    this.payNotify = false;             // 是否有新支付

    this.winner_token = '';             // 微蓝登录token
    this.loginId = 0;                   // 登录日志ID, 0为未记录
    this.logoutId = 0;                  // 登出日志ID, 0为未记录
    this.loginTime = 0;                 // 登录时间

    this.action = {                     // 当前消息
        mod: 'mod',                     // 消息模块
        act: 'act',                     // 消息接口
        args: {},                       // 请求参数
        getEvent: function () {
            return util.format('%s.%s', this.mod, this.act);
        }
    };
}


Player.create = function (uid) {
    var now = common.getTime();

    var initUser = {
        '_id': uid,
        /** 并发锁, 0空闲 >0解锁时间(单位s) */
        'lock': 0,
        /** 自增长ID,用于编号系统 */
        'ai': 1,
        "custom_king": {
            'index': 0,
        },

        /** 基本信息 */
        'info': {
            /** 玩家角色名 */
            'un': '',
            /** 玩家账号 */
            'account': '',
            /** 玩家头像 */
            'headpic': 1,
            /** 头像框 */
            'headframe': 30002,
            /** 用户创建时间 */
            'create': now,
            /** 玩家ID */
            'uid': uid,
            /** 国号, 1/2/3 魏/蜀/吴 */
            'country': 0,
            /** 皇城官职 */
            'position': 0,
            /** 主角坐骑 */
            'dragon': 1,

            /** 玩家登录ip */
            'ip': '',
            /** 玩家登陆平台 */
            'platform': '',
            /** 玩家登陆设备 */
            'device': '',
            /** 玩家登陆系统 */
            'system': '',
            /** 玩家首登的设备唯一ID */
            'device_id': '',
            /** 设备类型 */
            'device_type': '',
        },

        /** 基础数据 */
        'status': {
            /** 英雄貨幣 */
            'hero_exp': 0,
            /** 战队经验 */
            'team_exp': 0,
            /** 战队币 */
            'team': 0,
            /** 经验 */
            'xp': 0,
            /** 等级 */
            'level': 1,
            /** 金币 */
            'gold': conf_mgr.gConfGlobal.initGold,
            /** 元宝 */
            'cash': 0,
            /** 绑定元宝 */
            'bindcash': 0,
            /** VIP等级 */
            'vip': 0,
            /** VIP经验 */
            'vip_xp': 0,
            /** 粮草 */
            'food': conf_mgr.gConfGlobal.initFood,
            /** 噩梦关卡体力 */
            'food_red': conf_mgr.gConfGlobal.foodRedInitial,
            /** 幸运值 */
            'luck': 0,
            /** 爬塔币 */
            'tower': 0,
            /** 竞技场币 */
            'arena': 0,
            /** 国家货币 */
            'country': 0,
            /** 军团币 || 新军团用这个 */
            'legion': 0,
            /** 将魂数 */
            'soul': 0,
            /** 荣誉令牌 */
            'token': 0,
            /** 普通招募令 */
            'ntoken': 0,
            /** 高级招募令 */
            'htoken': 0,
            /** 神将商店刷新令 */
            'gtoken': 0,
            /** 神将商店免费刷新令 */
            'free_gtoken': 0,
            /** 神秘商店刷新令 */
            'mtoken': 0,
            /** 神秘商店免费刷新令 */
            'free_mtoken': 0,
            /** 军团红包 */
            'boon': 0,
            /** 成就蛋 */
            'egg': 0,
            /** 竞技场经验 */
            'arena_xp': 0,
            /** 竞技场等级 */
            'arena_level': 1,
            /** 木材 */
            'wood': 0,
            /** 玩家军团战个人贡献 */
            'legionwar': 0,
            /** 试炼币 */
            'trial_coin': 0,
            /** 爱心值 */
            'love': 0,
            /** 领地战耐力 */
            'staying_power': parseInt(conf_mgr.gConfTerritoryWarBase.enduranceLimit.value),
            /** 领地战行动力 */
            'action_point': 100,
            /** 幸运转盘 积分 */
            'rotate_score': 0,
            /** 幸运转盘 低级硬币 */
            'rotate_ncoin': 0,
            /** 幸运转盘 高级硬币 */
            'rotate_hcoin': 0,
            /** 命运之轮 硬币 */
            'fate_coin': 0,
            /** 龙晶石 */
            'mine_1': 0,
            /** 龙栖木 */
            'mine_2': 0,
            /** 龙玄锭 */
            'mine_3': 0,
            /** 龙岗岩 */
            'mine_4': 0,
            /** 龙泉泪 */
            'mine_5': 0,
            /** 物资 */
            'goods': 0,
            /** 军资 */
            'countrywar': 0,
            /** 国战积分 */
            'country_score': 0,
            /** 皇城俸禄 */
            'salary': 0,
            /** 技能书 */
            'sky_book': 0,
            /** 朗姆酒 */
            'wine': 0,
            /** 星星 */
            'star': 0,
            /** 月亮 */
            'moon': 0,
            /** 太阳 */
            'sun': 0,
            /** 符文经验 */
            'rune_exp': 0,
            /** 符文结晶 */
            'rune_crystal': 0,
            /** 高级符文结晶 */
            'rune_crystal2': 0,
            /** 神之魂晶 */
            'godsoul': 0,
            /** 魔晶，装备分解产物 */
            'smelt': 0,
            /** 竞技场门票 */
            'atoken': 0,
            /** 活跃度 */
            'active': 0,
            /** 矿锄数量 */
            'digging': conf_mgr.gConfGlobal.diggingToolInit,
            /** 占地凭证 */
            'rob': 0,
            /** 魔法棒 */
            'wand': 0,
        },

        /** 标志 */
        'mark': {
            /** is use now rune */
            'new_rune': 3,
            /** 数据版本, 依次递增 */
            'version': Upgrade.get_version(),
            /** 光宇生命指纹 */
            'gyyx_lf': '',
            /** 新手引导步奏,0完成 */
            'guide': 1,
            /** 功能开启引导 */
            'func_guide': 0,
            /** 一次性引导记录 */
            'step': {
                /** 引导id: 引导完成步骤 */
                // gid: 0,
            },
            /** 上次登录日期20130101，游戏日期，以每天的凌晨5点为分界线 */
            'day': 0,
            /** 上次登录日期20130101，真实日期 */
            'login_day': 0,
            /** 今日首次登陆时间 */
            'login_today_time': 0,
            /** 上次登录时间 */
            'login_time': 0,
            /** 上次活跃时间 */
            'active_time': 0,
            /** 累计登录次数 */
            'logins': 0,
            /** 累计登录天数 */
            'login_days': 0,
            /**  留存, 按bit计算是否登陆 */
            'retention': 0,
            /**  最近一次粮草恢复的时间 */
            'food_time': 0,
            /** 最近一次粮草恢复的时间 */
            'food_time_red': 0,
            /** 最近一次耐力恢复时间 */
            'staying_power_time': 0,
            /** 最近一个行动力恢复时间 */
            'action_point_time': 0,
            /** 当日在线时长 */
            'online_time': 0,
            /**  总在线时长 */
            'total_online_time': 0,
            /** 是否首次创建军团 */
            'first_create_legion': 1,
            /** 玩家最高战力 */
            'max_fight_force': 0,
            /** 玩家最高战力(不计算额外属性) */
            'max_fight_force_no_extra': 0,
            /**  玩家当日世界聊天次数 */
            'day_world_chat_count': 0,
            /** 占领村庄地块次数 */
            'occupy_land_count': 0,
            /** 开启王者宝箱的数量 */
            'open_cave_box_count': 0,
            /** 是否发过新手邮件 */
            'mail': 0,
            /** 赠送英雄的id */
            'map_hero_id': 0,
            /** 领取英雄计时器 */
            'map_hero_timer': 0,
            /** 首次付费时间，后台统计用 */
            'first_pay_time': 0,
            /** 首笔充值金额，后台统计用 */
            'first_pay_cash': 0,
            /** 看过的礼包id列表 */
            'visit_gift_bag': [],
            /** boss出生提示 */
            'boss_notice': [],
            /** 在线奖励 */
            'outline': {
                'guide': {
                    'progress': {},
                    'got': {},
                },
                'boss': {
                    'progress': {},
                    'fight_num': 0,
                },
                /** guide or boss */
                'now_show': 'guide',
            },
        },

        /**  hero */
        'hero_bag': {
            'index': 1,
            'heros': {/*index:{},*/ },
            'buy': 0, // buy times
        },

        /** 背包 */
        'bag': {
            /** 材料 */
            'material': {},
            /** 宝石 */
            'gem': {},
            /** 碎片 */
            'fragment': {},
            /** 卡牌 */
            'card': {},
            'equip': {
                // /** 唯一ID */
                // 'eid': {
                //     /** 装备编号 */
                //     'id':
                //     /** 品级：0-6级 */
                //     'grade' : 0
                //     /** 所属武将的编号 */
                //     'hid':
                // }
            },
            /** 小兵装备 */
            'dress': {},
            /** 龙晶 */
            'dragon': {
                /** 龙晶唯一id */
                // gid: {
                /** 龙晶id */
                //     id: 0,
                /** 镶嵌龙 */
                //     dragon: 0,
                /** 属性 */
                //     attr: {
                /** 属性类型: 属性值 */
                //         type: value,
                //     },
                // },
            },
            /** 限时道具 */
            'limitmat': {
                /** 唯一id */
                // mid: {
                /** 道具id */
                //     id: 0,
                /** 过期时间 */
                //     expire: 0,
                /** 数量 */
                //     num: 0,
                // },
            },
        },

        'payment': {
            /** 购买记录 */
            'pay_list': {
                /**  充值id: 充值次数 */
                // id: 0,
            },
            /** 购买记录 */
            'pay_records': {
                /** 充值id: 充值次数 */
                // id: 0,
            },
            /** 已经购买元宝数 */
            'paid': 0,
            /** 首次购买赠送和月卡领取的元宝 */
            'gift_cash': 0,
            /** 已经花费金钻 */
            'cost': 0,
            /** 已花费的蓝钻 */
            'cost_bindcash': 0,
            /**  周卡剩余天数 */
            'week_card': 0,
            /** 月卡剩余天数 */
            'month_card': 0,
            /** 终身卡已领取领取日期, 0为未购买 */
            'long_card': 0,
            /**  vip特权礼包 */
            'vip_rewards': {
                /** vip等级: 是否已购买 */
                // vip: 0,
            },
            'vip_rewards_version': conf_mgr.gConfVersion["vipReset"] ? conf_mgr.gConfVersion["vipReset"].version : 0,
            /**  已充值的钱数 */
            'money': 0,
            /**  每日累计充值金额 */
            'day_money': 0,
            /** 测试的充值金 */
            'old_paid': 0,
            /** 最后一次充值金额 */
            'last_pay_money': 0,
            /** 最后一尺充值时间 */
            'last_pay_time': 0,
        },

        'activity': {
        },

        'battle': {
            /** now进度 */
            'progress': 1,
            'type': 0,
        },

        /** 已读的系统邮件和系统公告 */
        'mail': {
            /**  邮件或公告id : 1 已读，2 已删 */
            // id : 1,
        },

        /** 探索随机结果，不同步到客户端，隔天要重置 */
        'adventure_rand': {
            // 1 : 0
        },

        /** 已经使用的可重复使用兑换码id */
        'cdkey': {},

        /** 提醒 */
        'tips': {
            /** 每日任务 */
            'daily_task': 0,
            /** 主线任务 */
            'main_task': 0,
            /** 天下形势 */
            'world_situation': 0,
            /** 七天乐 */
            'open_seven': 0,
            /** 积分兑换 */
            'exchange_points': 0,
            /** 首冲任务 */
            'first_pay': 0,
        },

        /** 头像框状态 */
        'head_frame_status': {
            /** 0表示未激活，1表示已激活 */
            // id : 0,
        },

        /** 杂项数据 */
        'misc': {
        },
    };

    for (var tKey in logic) {
        var tLogic = logic[tKey];
        if (!tLogic) { continue; }
        if (!tLogic.init_user_data) { continue; }
        tLogic.init_user_data(initUser);
    }

    return initUser;
};

Player.prototype = {
    init: function (fields, callback) {
        if (fields && (typeof (fields) == 'object') &&
            Object.getOwnPropertyNames(fields).length > 0) {
            // 加载玩家部分数据
            fields['ai'] = 1;
        }

        var player = this;

        // 读取玩家数据
        gDBUser.findOne({ _id: player.uid }, fields, function (err, doc) {
            if (!doc) {
                if (err) {
                    callback && callback(false);
                } else {
                    var today = common.getDate();
                    //创建新用户
                    player.user = Player.create(player.uid);
                    player.getPlayerMemData(true);// pos init

                    var tSlotHeroList = [];
                    for (var i = 1; i <= conf_mgr.gConfGlobal.initSlots; i++) {
                        var tSlotInfo = conf_mgr.gConfInitSlots[i];
                        if (!tSlotInfo) { continue; }
                        tSlotHeroList = tSlotHeroList.concat(tSlotInfo.award);
                    }

                    var tAddHeroList = player.addAwards(tSlotHeroList, "init_player", `lord`);
                    for (var i = 1; i <= tSlotHeroList.length; i++) {                               // 添加初始英雄
                        var tHeroData = tAddHeroList.heros[i];
                        var tHeroPos = tAddHeroList.heros[i].bag_pos;
                        player_team.addInTeam(player, TEAM_NAME.DEFAULT, 1, conf_mgr.gConfInitSlots[i].slotsId, tHeroPos);

                        var tHeroEquipStr = conf_mgr.gConfGlobal[`initEquip${i}`];               // 判断是否需要给对应英雄穿装备
                        if (!tHeroEquipStr) { continue; }
                        var awards = parseAwardsConfig(tHeroEquipStr);
                        var addedAwards = player.addAwards(awards, "init_player", `lord_${i}`);     // 先加进背包

                        var tEquipIDList = [];
                        for (var j = 0; j < awards.lenght; j++) {
                            var tAwardInfo = awards[j];
                            if (!tAwardInfo) { continue; }
                            if (tAwardInfo[0] != "equip") { continue; }
                            tEquipIDList.push(tAwardInfo[1]);
                        }
                        hero.hero_wear(player, tHeroData, tEquipIDList);
                    }

                    var firstAwards = conf_mgr.gConfSpecialReward['first_play_award'].reward;
                    player.addAwards(firstAwards, 'player', 'init');

                    gDBUser.insertOne(player.user, function (err, result) {
                        if (err) {
                            callback && callback(false);
                        } else {
                            callback && callback(true);
                        }
                    });

                    // 初始化等级活动, 但为等级1开启
                    for (var tKey in logic) {
                        var tLogic = logic[tKey];
                        if (!tLogic) { continue; }
                        if (!tLogic.check_activity_state) { continue; }
                        tLogic.check_activity_state(player, today);
                    }

                    // 检测活动是否开启

                    for (var item in player.user) {
                        player.markDirty(item);
                    }
                }
            } else {
                player.user = doc;

                player.resetSomeData();
                player.checkVersion();
                player.getPlayerMemData();
                callback && callback(true);
            }
        });
    },

    resetSomeData: function () {
        var user = this.user;
        user.payment = user.payment || {};

        var tResetVersion = conf_mgr.gConfVersion["vipReset"] ? conf_mgr.gConfVersion["vipReset"].version : 0;                       // 重置vip礼包领取信息
        user.payment.vip_rewards_version = user.payment.vip_rewards_version || 0;

        if (user.payment.vip_rewards_version != tResetVersion) {
            user.payment.vip_rewards_version = tResetVersion;
            user.payment.vip_rewards = {};
            this.markDirty('payment');
        }

        user.payment.money = (user.payment.money - 0) || 0;
        this.markDirty('payment');

        for (var tKey in logic) {                       // 登陆时重置
            var tLogic = logic[tKey];
            if (!tLogic) { continue; }
            if (!tLogic.reset_by_login) { continue; }
            tLogic.reset_by_login(this);
        }
    },

    save: function (force, callback) {        // 合并写入
        var haveDirty = false;
        for (var key in this.dirty) {
            haveDirty = true;
            this.allDirty[key] = this.dirty[key];
        }

        this.dirty = {};

        if (haveDirty) {
            this.saveCount += 1;
        }

        if ((!force && this.saveCount < 10) || (Object.keys(this.allDirty).length == 0)) {            // 10次数据库操作必写入
            callback && callback(true);
            return;
        }

        var updates = { $set: {}, $unset: {} };
        var arrangedDirty = this.arrangeDirty(this.allDirty);
        for (var item in arrangedDirty) {
            var remove = arrangedDirty[item];
            if (remove) {
                updates['$unset'][item] = 1;
            } else {
                var obj = this.user;
                var args = item.split(".");
                var ok = true;
                for (var i = 0; i < args.length; i++) {
                    if (typeof (obj) != 'object') {                        // 未找到
                        ok = false;
                        break;
                    }
                    obj = obj[args[i]];
                }

                if (ok && obj != undefined && obj != NaN && obj != null) {
                    updates['$set'][item] = obj;
                } else {
                    ERROR('invalid save: ' + item);
                }
            }
        }

        this.allDirty = {};
        this.saveCount = 0;

        var toUpdate = 2;

        if (Object.keys(updates['$unset']).length == 0) {
            delete updates['$unset'];
            toUpdate--;
        }

        if (Object.keys(updates['$set']).length == 0) {
            delete updates['$set'];
            toUpdate--;
        }

        if (toUpdate) {
            gDBUser.update({ _id: this.uid }, updates, function (err, result) {
                if (err) {
                    ERROR(util.format('%d SAVE %j %j', this.uid, updates, err));
                    this.saveError = true;
                    callback && callback(false);
                } else {
                    callback && callback(true);
                }
            }.bind(this));
        }
    },

    saveAll: function () {
        gDBUser.save(this.user, function (err, result) {
        });
    },

    nextId: function () {
        this.user.ai += 1;
        this.markDirty('ai');
        return this.user.ai;
    },

    /** 充值返还 */
    pay_back: function () {
        var phpReq = {
            uid: this.uid,
            act: 'pay_back',
            args: {
                openid: this.user.info.account,
            },
        };
        var phpResp = {};
        var tOnPhpReq = () => {
            if (phpResp.code != 0) { return; }

            if (phpResp.data.isPayBack == 1) { return; }                // 为1表示 已经返过利了

            var conf = conf_mgr.gConfMail[1012];
            if (!conf) { return; }

            var cashNum = phpResp.data.cash * 10;            // 返还金钻、蓝钻、vip经验等
            var bindcashNum = phpResp.data.cash * 20;
            var vipExpNum = phpResp.data.cash * 10;
            var awards = [['user', 'vip_xp', vipExpNum], ['user', 'cash', cashNum], ['user', 'bindcash', bindcashNum]];

            if (phpResp.data.cash && phpResp.data.cash > 0) {
                user.payment.old_paid = phpResp.data.cash * 10;
                player.markDirty('payment');
            }

            if (phpResp.data.weekcard && phpResp.data.weekcard > 0) {//返还周卡
                awards.push(['weekcard', 400001, phpResp.data.weekcard]);
                var awardAry = parseAwardsConfig(conf_mgr.gConfGlobal.weekCardSpecialAward);
                for (var num = 0; num < phpResp.data.weekcard; num++) {
                    for (var i = 0; i < awardAry.length; i++) {
                        awards.push(awardAry[i]);
                    }
                }
            }

            if (phpResp.data.monthcard && phpResp.data.monthcard > 0) {//返还月卡
                awards.push(['monthcard', 400002, phpResp.data.monthcard]);
                var awardAry = parseAwardsConfig(conf_mgr.gConfGlobal.monthCardSpecialAward);
                for (var num = 0; num < phpResp.data.monthcard; num++) {
                    for (var i = 0; i < awardAry.length; i++) {
                        awards.push(awardAry[i]);
                    }
                }
            }

            if (phpResp.data.grow_fund && phpResp.data.grow_fund > 0) {//激活成长基金
                var growFund = user.activity.grow_fund;
                growFund.bought = 1;
                growFund.bought_type++;
                player.markDirty('activity.grow_fund.bought');
                player.markDirty('activity.grow_fund.bought_type');

                var growReq = {
                    'act': 'buy_grow_fund',
                    'mod': 'activity',
                    'uid': player.uid,
                    'args': {}
                };
                var growResp = {};
                requestWorld(growReq, growResp, function () { });
            }

            var mail = {
                content: [1012, phpResp.data.cash],
                awards: awards,
                time: common.getTime(),
                expire: common.getTime() + conf_mgr.gConfMail[1012].time * OneDayTime,
            };

            var reqWorld = {
                mod: 'mail',
                act: 'add_mail',
                uid: user.info.uid,
                args: {
                    mail: mail,
                },
            };
            requestWorld(reqWorld, {});
        }
        requestPHP(phpReq, phpResp, tOnPhpReq);
    },

    resetByDay: function (today) {
        DEBUG(`-------: player resetByDay ${this.uid}, ${today}`)
        var player = this;
        var user = this.user;        // 共用数据
        var dayDiff = common.getDateDiff(today, user.mark.day);

        if (!user.mark.day) {
            this.pay_back();
        } else {
            if (dayDiff >= 1) {
                //ResBack.calc_resback(this, today, dayDiff > 7 ? 7 : dayDiff);
            }
        }

        user.mark.login_today_time = common.getTime();
        user.mark.day = today;
        user.mark.login_days++;
        this.markDirty('mark.day');
        this.markDirty('mark.login_days');

        user.mark.boss_notice = [];
        this.markDirty('mark.boss_notice');

        // 重置神将、装备商店免费刷新次数
        var privilege = user.task.privilege;
        var godStorePrivilegeId = conf_mgr.gConfNobiltyTitleKey['godShopRefresh'].id;
        var equipStorePrivilegeId = conf_mgr.gConfNobiltyTitleKey['equipShopRefresh'].id;
        if (privilege[godStorePrivilegeId]) {
            user.status.free_gtoken = privilege[godStorePrivilegeId];
            this.markDirty('status.free_gtoken');
        }

        if (privilege[equipStorePrivilegeId]) {
            user.status.free_mtoken = privilege[equipStorePrivilegeId];
            this.markDirty('status.free_mtoken');
        }

        // 重置每日任务, 月卡, 终身卡
        user.task.daily = {};
        user.task.daily_reward = {};
        user.task.daily_active = 0;
        user.task.food_get = [];

        // 重置周卡领取
        var payment = user.payment;
        if (payment.week_card) {
            payment.week_card -= dayDiff;
            if (payment.week_card <= 0) {
                payment.week_card = 0;
            } else {
                user.task.daily[conf_mgr.gConfDailyTask['weekCard']] = 1;
            }
            this.markDirty('payment.week_card');
        }

        if (user.payment.week_card) {
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, this, 'doubleCard', 1);
        }

        // 重置月卡领取
        if (payment.month_card) {
            payment.month_card -= dayDiff;
            if (payment.month_card <= 0) {
                payment.month_card = 0;
            } else {
                user.task.daily[conf_mgr.gConfDailyTask['monthCard']] = 1;
            }
            this.markDirty('payment.month_card');
        }

        // 每日任务月卡、终身卡
        if (user.payment.month_card) {
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, this, 'doubleCard', 1);
        }

        // 重置终身卡领取
        if (user.payment.long_card) {
            user.task.daily[conf_mgr.gConfDailyTask['longCard']] = 1;
        }
        this.markDirty('task.daily');
        this.markDirty('task.daily_reward');
        this.markDirty('task.daily_active');
        this.markDirty('task.food_get');
        // player.doOpenHoliday('login');

        // 重置祭坛祈祷次数
        for (var id in user.altar) {
            user.altar[id] = 0;
            this.markDirty('altar.' + id);
        }

        // // 检测并重置签到数据
        // this.checkAndResetSign()

        // 重置每日充值
        user.payment.day_money = 0;
        this.markDirty('payment.day_money');
        user.payment.day_paid = 0;
        this.markDirty('payment.day_paid');

        // 重置每日提醒
        if (user.tips.daily_task) {
            delete user.tips.daily_task;
            this.markDirty('tips.daily_task');
        }
        if (user.tips.active_task) {
            delete user.tips.active_task;
            this.markDirty('tips.active_task');
        }

        // 重置每日在线时间
        user.mark.online_time = 0;
        this.markDirty('mark.online_time');

        // 重置每日世界聊天次数
        user.mark.day_world_chat_count = 0;
        this.markDirty('mark.day_world_chat_count');

        // 重置服战物资
        if (user.status.goods) {
            user.status.goods = 0;
            this.markDirty('status.goods');
        }

        // 刷新礼包
        // this.updateGiftBags();

        // 在线奖励(充值BOSS攻击次数)
        if (this.user.mark.outline) {
            this.user.mark.outline.boss.fight_num = 0;
            player.markDirty('mark.outline');
        }

        for (var tKey in logic) {
            var tLogic = logic[tKey];
            if (!tLogic) { continue; }
            if (!tLogic.reset_by_day) { continue; }
            tLogic.reset_by_day(this, today);
        }
    },

    /** 每周活动数据重置 */
    resetByWeek: function () {
        var today = common.getDate();
        var user = this.user;

        // 重置擂台数据
        user.status.arena_level = 1;
        user.status.arena_xp = 0;
        this.markDirty('status.arena_level');
        this.markDirty('status.arena_xp');

        for (var tKey in logic) {
            var tLogic = logic[tKey];
            if (!tLogic) { continue; }
            if (!tLogic.reset_by_week) { continue; }
            tLogic.reset_by_week(this, today);
        }
    },

    /** 每周活动数据重置 */
    resetByMonth: function () {
        var today = common.getDate();
        for (var tKey in logic) {
            var tLogic = logic[tKey];
            if (!tLogic) { continue; }
            if (!tLogic.reset_by_month) { continue; }
            tLogic.reset_by_month(this, today);
        }
    },

    /** 获取玩家的内存数据，这些数据不会存数据库 */
    getPlayerMemData: function (force) {
        if (!this.memData || force) {
            this.memData = {
                //'all_star': 0,                      // 通关的总星星数
                //'star_num': 0,                     // 星星数量
                'moon_num': 0,                     // 月亮数量
                'sun_num': 0,                      // 太阳数量
                'ffchanged': 1,                     // 战斗力是否发生了变化
                'fight_force': 0,                   // 总战斗力
                'pos': {                            // 每个卡槽信息
                    /*
                    hid : {
                        'ffchanged' : 0,            // 武将战斗力是否变化
                        'innate' : {                // 突破成长对武将的加成
                            pos : [innateId, value] // 位置 : 对此武将的属性加成id, 值
                        }

                        'equip_suit_count' : {},    // 套装件数
                        'equip_changed' : {},       // 发生变化的装备位置
                        'uni_equip_changed' : {},   // 跨服服发生变化的装备位置

                        //'rune_changed' : {},        // 发送变化的符文位置
                    }
                    */
                },
                'pos_count': 0,                     // 已上阵的武将数量
                'equip_num': 0,                     // 未被装备的装备数量
                'dragongem_num': 0,                 // 未被装备的龙晶数量
                'limitmat': [                       // 限时道具过期队列
                    /* [mid, expire] */             // 道具唯一id, 过期时间
                ],

                'enemy_id': '',                     // PVP状态下匹配对手UID
                'fight_info': 0,                    // 战斗己方信息
                'fight_enemy': 0,                   // 战斗敌方信息
                'rand1': 0,                         // 战斗随机数1
                'rand2': 0,                         // 战斗随机数2
                'rand_pos': 0,                      // 战斗校验武将选取位置
                'rand_attrs': [],                   // 战斗校验属性选取
                'fight_time': 0,                    // 战斗开始时间
                'status': '',                       // 当前战斗状态(金矿,爬塔,军团试炼,竞技场,押镖)

                'chapter': 0,                       // 当前攻打军团副本章节ID
                'progress': 0,                      // 当前攻打军团副本进度ID

                'mine_id': 0,                       // 当前准备占领的金矿id
                'deposit': 0,                       // 打金矿的押金

                'arena_enemy': {},                  // 竞技场刷新的对手

                'legion_id': 0,                     // 玩家军团id
                'legion_name': '',                  // 玩家军团名称
                'legion_level': 0,                  // 军团等级
                'legion_war_level': 0,              // 军团战段位
                'legion_icon': [],                  // 军团icon
                'hire_owners': [],                  // 雇佣武将的玩家uid
                'hire_hids': [],                    // 雇佣的武将id

                'team_id': 0,                      // 战队id
                'team_name': '',                     // 战队名字
                'team_level': 0,                     // 战队等级

                'dirty': {},                        // 用于向世界服更新玩家数据
                'uni_dirty': {},                    // 跨服战的更新数据
                'land_grabber_dirty': {},          // 跨服村庄更新数据

                'use_cash': 0,                      // 跨服战排位赛是否使用元宝
                'score_add': 0,                     // 排位赛临时积分变化，打完后要返回去
                'updated_worldwar': 0,              // 是否已经更新过跨服服务数据

                'wss_login': 0,                     // 长连接握手时间

                'village_id': 0,                   // 当前小队占领的村庄id
                'village_land': [],                // 当前占领的地块【村庄ID，地块id】
                'village_o_ts': 0,                 // 当前占领村庄的时间戳, 用于异步控制 o=occupy
                'village_f_ts': 0,                 // 当前战斗村庄的时间戳, 用于异步控制 f=fight
            };

            // var team1 = this.user.team[TEAM_NAME.DEFAULT][1];
            // for (var hid in team1) {
            //     var pos = team1[hid];
            //     this.memData.pos[hid] = {
            //         'ffchanged': 1,
            //         //'fate': [],
            //         'innate': {},
            //         'equip_suit_count': {},
            //         'equip_changed': {},
            //         'uni_equip_changed': {},
            //         //'rune_changed': {},
            //     };

            //     if (hid) {
            //         this.memData.pos_count++;
            //     }
            // }

            // // 获取全体突破加成

            // // 获取未装备的装备数量
            // var bag = this.user.bag;
            // for (var eid in bag.equip) {
            //     var equip = bag.equip[eid];
            //     if (!equip.pos) {
            //         this.memData.equip_num++;
            //     }
            // }

            // // 获取未装备的龙晶数量
            // for (var gid in bag.dragon) {
            //     var gem = bag.dragon[gid];
            //     if (!gem.dragon) {
            //         this.memData.dragongem_num++;
            //     }
            // }

            // // 获取限时道具过期队列
            // for (var mid in bag.limitmat) {
            //     var mat = bag.limitmat[mid];
            //     this.memData.limitmat.push([+mid, mat.expire]);
            // }
            // this.memData.limitmat.sort(function (item1, item2) {
            //     return item1[1] - item2[1];
            // });

            // 转换dirty
            for (var item in this.dirty) {
                this.memData.dirty[item] = 0;
            }
        }
    },

    arrangeDirty: function (dirty) {
        var arrangedDirty = {};

        for (var item in dirty) {
            var dirtyType = dirty[item];

            var needRemove = [];
            var addNew = true;
            var levels = item.split('.');
            for (var eitem in arrangedDirty) {
                var elevels = eitem.split('.');
                if (elevels.length == levels.length) continue;
                var minLen = Math.min(elevels.length, levels.length);

                var isTree = true;
                for (var i = 0; i < minLen; i++) {
                    if (elevels[i] != levels[i]) {
                        isTree = false;
                        break;
                    }
                }

                if (!isTree) continue;

                if (elevels.length < levels.length) {                    // 更低级别的变更,抛弃
                    addNew = false;
                    break;
                } else {                    // 更高级别的变更
                    needRemove.push(eitem);
                }
            }

            needRemove.forEach(function (removeItem) {
                delete arrangedDirty[removeItem];
            });

            if (addNew) {
                arrangedDirty[item] = dirtyType;
            }
        }

        return arrangedDirty;
    },

    // mapWorldWarDirty: function () {
    //     var updateData = {};
    //     var arrangedDirty = this.arrangeDirty(this.memData.uni_dirty);
    //     for (var item in arrangedDirty) {
    //         var obj = this.user;
    //         var mirrorObj = gInitWorldUser;
    //         var args = item.split(".");
    //         var ok = true;
    //         for (var i = 0; i < args.length; i++) {
    //             if (typeof (obj) != 'object') {
    //                 // 未找到
    //                 ok = false;
    //                 break;
    //             }
    //             obj = obj[args[i]];
    //             if (mirrorObj) {
    //                 mirrorObj = mirrorObj[args[i]];
    //             } else {
    //                 mirrorObj = 0;
    //             }
    //         }

    //         if (ok && obj != undefined && obj != NaN && obj != null) {
    //             var result = null;
    //             if (typeof (mirrorObj) == 'object' && !(util.isArray(mirrorObj))) {
    //                 result = mapObject(obj, mirrorObj);
    //             } else {
    //                 result = obj;
    //             }
    //             updateData[item] = result;
    //         } else {
    //             ERROR('invalid worldwar update: ' + item);
    //         }
    //     }
    //     this.memData.uni_dirty = {};
    //     return updateData;
    // },

    // 标志需要写入的变更数据名 a.b格式
    markDirty: function (item) {

        this.dirty[item] = 0;
        var worldUpdate = gInitWorldUser;
        var segs = item.split('.');
        for (var i = 0, len = segs.length; i < len; i++) {
            var seg = segs[i];
            if (!(seg in worldUpdate)) {
                return;
            }
            worldUpdate = worldUpdate[seg];
            if (typeof (worldUpdate) != 'object') {
                break;
            } else {
                var empty = true;
                for (var id in worldUpdate) {
                    empty = false;
                    break;
                }
                if (empty) {
                    break;
                }
            }
        }

        if (this.memData) {
            this.memData.dirty[item] = 0;
        }
    },

    markDelete: function (item) {
        this.dirty[item] = 1;
    },

    cleanDirty: function () {
        this.dirty = {};
    },

    // ---------------玩家逻辑相关------------------

    addXp: function (exp, mod, act) {
        var award = [];
        var status = this.user.status;
        var oldLevel = status.level;
        var level = oldLevel;
        var xp = status.xp + exp;
        while (conf_mgr.gConfLevel[level + 1] && xp >= conf_mgr.gConfLevel[level].exp) {
            xp -= conf_mgr.gConfLevel[level].exp;
            level++;
        }

        if (!conf_mgr.gConfLevel[level + 1]) {
            // 达到最高等级
            var maxXp = conf_mgr.gConfLevel[level].exp - 1;
            xp = xp > maxXp ? maxXp : xp;
        }

        if (oldLevel != level) {
            award = this.onPlayerLevelUp(level, oldLevel);
        }

        status.xp = xp;
        this.markDirty('status.xp');

        var args = {
            uid: this.uid,
            type: 'xp',
            num: exp,
            mod: mod,
            act: act,
            old_level: oldLevel,   // 加经验前的等级
            new_level: level,      // 加经验后的等级
        };
        server.addGameLog(LogType.LOG_CURRENCY_PRODUCE, args, null);

        return award;
    },

    // 等级提升
    onPlayerLevelUp: function (newLevel, oldLevel) {
        var today = common.getDate();
        this.user.status.level = newLevel;
        this.markDirty('status.level');

        var phpReq = {
            uid: this.uid,
            act: 'user_levelup',
            args: {
                sid: config.DistId,
                openid: this.user.info.account,
                level: newLevel,
            },
        };
        LogCollect(phpReq.uid, phpReq.act, phpReq.args);

        this.doGuideTask('levelUp', newLevel);

        this.updateHeadFrameStatus('user_level', newLevel);

        var levelUpAward = [];

        // 向wss服更新玩家等级
        updateWssData(this.user._id, { level: newLevel });

        for (var tKey in logic) {
            var tLogic = logic[tKey];
            if (!tLogic) { continue; }
            if (!tLogic.check_activity_state) { continue; }
            tLogic.check_activity_state(this, today);
        }

        if (newLevel >= 60 && newLevel % 10 == 0) {
            var array = [];
            var userName = this.user.info.un;
            array[0] = userName;
            array[1] = newLevel;
            if (userName == null) {
                array[0] = '';
            }

            pushSysMsg('updateLevel', array);
        }

        if (conf_mgr.gConfLevel[newLevel].guideIndex > 0) {
            this.user.mark.guide = 1;
            this.markDirty('mark.guide');
        }

        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_TASK, this, 'legionFire', 1);

        outline_sync_to_client(this);        // 在线奖励通知

        return levelUpAward;
    },

    /** 玩家关卡胜利回调 */
    onCustomFightWin: function (customId) {
        var today = common.getDate();
        for (var tKey in logic) {
            var tLogic = logic[tKey];
            if (!tLogic) { continue; }
            if (!tLogic.check_activity_state) { continue; }
            tLogic.check_activity_state(this, today);
        }
    },

    /** 发送新用户邮件 */
    sendNewUserMail: function () {
        var user = this.user;
        if (user.mark.mail) { return; }
        var awards = parseAwardsConfig(conf_mgr.gConfGlobal.initMail);                       // 新用户奖励邮件
        var reqWorld = {
            mod: 'mail',
            act: 'add_mail',
            uid: this.uid,
            args: {
                mail: {
                    content: [1010],
                    awards: awards,
                    time: common.getTime(),
                    expire: common.getTime() + conf_mgr.gConfMail[1010].time * OneDayTime,
                }
            },
        };

        var _me = this;
        requestWorld(reqWorld, {}, function () {
            user.mark.mail = 1;
            _me.markDirty('mark.mail');
        });
    },

    getHeroBagMax: function () {
        var buyAdd = this.user.hero_bag.buy * (+conf_mgr.gConfGlobal.heroNumBuyAdd);
        var vipAdd = conf_mgr.gConfVip[this.user.status.vip]['heroNumLimit'];
        var tequanAdd = task_mod.getPrivilegeVal(this, 'heroNumLimit');
        return buyAdd + vipAdd + tequanAdd;
    },

    markFightForceChanged: function (pos) {
        this.memData.ffchanged = 1;
    },

    markFightForceChangedAll: function () {
        var user = this.user;
        for (var pos in user.hero_bag.heros) {
            if (user.hero_bag.heros[pos].hid) {
                this.markFightForceChanged(pos);
            }
        }
    },

    ispassbattle: function (limitType, limitCustom) {
        var user = this.user;
        var myValue = user.battle.type * 10000 + user.battle.progress;
        var targetV = (+limitType) * 10000 + (+limitCustom);
        ERROR('myValue:' + myValue + ' targetV' + targetV);
        if (myValue > targetV) {
            return true;
        } else {
            return false;
        }
    },

    checkFightforce: function (ff, levels) {
        if (!gVerify) {
            return true;
        }

        if (ff == NaN || levels == NaN) {
            return false;
        }

        if (!ff) {
            return true;
        }

        if (ff < player_team.getFightForce(this, TEAM_NAME.DEFAULT) * 1.5) {
            var sumLevel = this.user.status.level;
            var pos = this.user.pos;
            for (var i in pos) {
                sumLevel += pos[i].level;
            }
            if (levels == sumLevel) {
                return true;
            }
        }

        var wssReq = {
            uid: this.user.info.uid,
            mod: 'user',
            act: 'trick',
            type: '',
            flag: '',
            args: {},
        };
        requestWss(wssReq, {});
        return false;
    },

    check_resback: function () {
        return ResBack.check_resback(this);
    },
    // ---------------武将逻辑相关------------------

    getHeroRetrunAwards: function (theHero, resolve) {
        var awards = [];
        var heroConf = conf_mgr.gConfHero[theHero.rid];
        if (!heroConf) {
            return [];
        }

        if (resolve) {
            var resolveAward = heroConf['resolveAward'];
            awards = awards.concat(resolveAward);
        }

        var heroTemplateId = heroConf.heroTemplateId;     // hero模板id
        if (theHero.awake > 4) {
            heroTemplateId = heroConf.templatedIdUltimate;
        }

        // 模板類型
        var rebornType = conf_mgr.gConfCombatHeroTemplate[heroTemplateId]['rebornType'];
        var tier = theHero.tier;
        if (conf_mgr.gConfReborn[rebornType][tier]) {
            var tierAwards = clone(conf_mgr.gConfReborn[rebornType][tier]['return']);
            if (resolve) {
                for (var i = 0; i < tierAwards.length; i++) {
                    var rate = +conf_mgr.gConfGlobal['heroReturnTier' + (i + 1)];
                    tierAwards[i][2] = Math.ceil(tierAwards[i][2] * (rate / 100));
                }
            }

            awards = awards.concat(tierAwards);
        }

        var levelAwards = clone(conf_mgr.gConfLevel[theHero.level]['roleUpGradeReturn']);
        if (resolve) {
            for (var i = 0; i < levelAwards.length; i++) {
                var rate = +conf_mgr.gConfGlobal['heroReturnLevel' + (i + 1)];
                levelAwards[i][2] = Math.ceil(levelAwards[i][2] * (rate / 100));
            }
        }
        awards = awards.concat(levelAwards);

        //part awake
        for (var pos in theHero.part) {
            var awakeLevel = theHero.part[pos]['awake_level'];
            var maxAwake = theHero.part[pos]['max_awake'];

            if (maxAwake) {
                var maxAwards = clone(conf_mgr.gConfPartBase[pos].return);
                if (resolve) {
                    for (var i = 0; i < maxAwards.length; i++) {
                        var rate = +conf_mgr.gConfGlobal['heroReturnPart1'];
                        maxAwards[i][2] = Math.ceil(maxAwards[i][2] * (rate / 100));
                    }
                }
                awards = awards.concat(maxAwards);
            }

            if (awakeLevel <= 0 || !conf_mgr.gConfPartAwake[pos][awakeLevel]) {
                continue;
            }

            var partAwards = clone(conf_mgr.gConfPartAwake[pos][awakeLevel]['return']);
            if (resolve) {
                for (var i = 0; i < partAwards.length; i++) {
                    var rate = +conf_mgr.gConfGlobal['heroReturnPart1'];
                    partAwards[i][2] = Math.ceil(partAwards[i][2] * (rate / 100));
                }
            }

            //ERROR('partAwards');
            //ERROR(partAwards);
            awards = awards.concat(partAwards);
        }

        //awake
        if (resolve && theHero.awake > 1) {
            var awakeRreward = clone(conf_mgr.gConfDestiny[theHero.awake]['return']);
            if (resolve) {
                for (var i = 0; i < awakeRreward.length; i++) {
                    var rate = +conf_mgr.gConfGlobal['heroReturnAwake' + (i + 1)];
                    awakeRreward[i][2] = Math.ceil(awakeRreward[i][2] * (rate / 100));
                }
            }

            awards = awards.concat(awakeRreward);
        }

        return awards;
    },

    deleteHeros: function (hids, isResolve) {
        var awards = [];
        var herosObj = this.user.hero_bag.heros;

        for (var i = hids.length - 1; i >= 0; i--) {
            var hid = hids[i];
            var theHero = herosObj[hid];
            if (hid == 1 || !theHero) {
                continue;
            }

            var oneReturn = this.getHeroRetrunAwards(theHero, isResolve);
            awards = awards.concat(oneReturn);

            // equip  'hid': 0,
            var theEquips = theHero.equip;
            for (var id in theEquips) {
                var eId = theEquips[id];
                if (eId == 0) {
                    continue;
                }

                this.user.bag.equip[eId].hid = 0;
                this.markDirty(util.format('bag.equip.%d.hid', eId));
            }

            // gems
            var partInfo = theHero.part;
            for (var pos in partInfo) {
                var partGems = partInfo[pos].gems;
                for (var k = 1; k <= 4; k++) {
                    var gid = partGems[k];
                    if (gid > 0) {
                        awards.push(['gem', +gid, +1]);
                    }
                }
            }

            // rune 
            var runeUse = theHero.rune_use;
            for (var index = 0; index < 4; index++) {
                var runId = runeUse[index];
                if (runId > 0) {
                    rune_mod.changeRune(this, runId, 0);
                }
            }

            delete herosObj[hid];
            this.markDelete("hero_bag.heros." + hid);
        }

        return awards;
    },

    addEquip: function (id, grade, intensify, refine_exp, mod, act) {
        this.user.bag.equip[id] = this.user.bag.equip[id] || 0;
        this.user.bag.equip[id]++;
        this.markDirty(`bag.equip.${id}`);

        var args = {
            uid: this.uid,
            id: id,
            mod: mod,
            act: act,
        }

        server.addGameLog(LogType.LOG_EQUIP_PRODUCE, args, null);

        return id;
    },

    addDragonGem: function (id, mod, act, attr) {
        var conf = conf_mgr.gConfDragonGem[id];
        if (!conf) {
            return;
        }

        var gid = this.nextId();

        if (!attr) {
            attr = common.randRange(conf.min, conf.max);
        }

        var dragonGem = {
            id: +id,
            dragon: 0,
            attr: attr,
        };

        this.user.bag.dragon[gid] = dragonGem;
        this.markDirty('bag.dragon.' + gid);

        var args = {
            uid: this.uid,
            gid: gid,
            id: id,
            attr: attr,
            mod: mod,
            act: act,
        }

        server.addGameLog(LogType.LOG_DRAGON_PRODUCE, args, null);

        return gid;
    },

    addLimitMat: function (id, type, expire, num, mod, act) {
        var mid = this.nextId();
        var realExpire = 0;
        if (type == 1) {
            realExpire = common.getTime(Math.floor(expire / 100)) + expire % 100 * 3600;
        } else if (type == 2) {
            realExpire = common.getTime() + expire * 86400;
        }

        var limitmat = {
            id: +id,
            num: +num,
            type: +type,
            expire: realExpire,
        };

        this.user.bag.limitmat[mid] = limitmat;
        this.markDirty('bag.limitmat.' + mid);
        return mid;
    },

    costLimitMat: function (id, num, mod, act) {
        var limitmat = this.user.bag.limitmat;
        var costs = [];
        for (var i = 0, len = this.memData.limitmat.length; i < len && num; i++) {
            var earliest = this.memData.limitmat[i][0];
            var mat = limitmat[earliest];
            if (mat.id != id) {
                continue;
            }
            if (mat.num + num > 0) {
                mat.num += num;
                this.markDirty('bag.limitmat.' + earliest);
                costs.push(['limitmat', earliest, num]);
                num = 0;
            } else {
                this.memData.limitmat.splice(i, 1);
                delete limitmat[earliest];
                this.markDelete('bag.limitmat.' + earliest);
                costs.push(['limitmat', earliest, -mat.num]);
                num += mat.num;
                i--;
                len--;
            }
        }
        return costs;
    },

    checkCosts: function (costs) {
        if (!costs) return true;

        var reformCost = reformAwards(costs)
        var now = common.getTime();
        for (var i = 0, max = reformCost.length; i < max; i++) {
            var cost = reformCost[i];
            var costType = cost[0];
            var costId = cost[1];
            var costNum = Math.floor(+cost[2]);
            if (isNaN(costNum)) continue;

            var user = this.user;
            if (costType == 'user') {
                if (costId == 'staying_power') {
                    this.getStayingPower(common.getTime());
                }

                if (costId == 'action_point') {
                    this.getActionPoint(common.getTime());
                }

                if (costId == 'mixcash') {
                    var costBindCash = Math.abs(costNum);
                    var hasBindCash = user.status.bindcash;
                    if (hasBindCash < costBindCash) {
                        costBindCash = hasBindCash;

                        var needCash = Math.abs(costNum) - costBindCash;
                        var hasCash = user.status.cash;
                        if (hasCash < needCash) {
                            return false;
                        }
                    }
                } else {
                    var status = user.status;
                    if (status.hasOwnProperty(costId)) {
                        if (isNaN(costNum)) {
                            ERROR('add award error type: ' + costId + 'number: ' + costNum);
                            return false;
                        }
                        if (status[costId] + costNum < 0) {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
            } else if (costType == 'equip') {
                if (!this.user.bag.equip[costId]) {
                    return false;
                }
            } else if (costType == 'dragon') {
                if (!this.user.bag.dragon[costId]) {
                    return false;
                }
            } else if (costType == 'limitmat') {
                var limitmat = this.user.bag.limitmat;
                var curNum = 0;
                for (var mid in limitmat) {
                    if (limitmat[mid].id == costId && limitmat[mid].expire > now) {
                        curNum += limitmat[mid].num;
                        if (curNum > costNum) {
                            return true;
                        }
                    }
                }
                return false;
            } else {
                if (isNaN(costNum) || isNaN(costId)) {
                    return false;
                }

                costId = +costId;
                costNum = Math.floor(costNum);
                if (costNum < 0) {
                    if (!user.bag[costType]) {
                        return false;
                    }

                    var curNum = user.bag[costType][costId];
                    if (!curNum) {
                        return false;
                    }

                    if (curNum + costNum < 0) {
                        return false;
                    }
                }
            }
        }

        return true;
    },

    getMatrialCount: function (matrialID) {
        if (isNaN(matrialID)) {
            return 0;
        }

        var costType = 'material';
        var user = this.user;
        if (!user.bag[costType]) {
            return 0;
        }

        var curNum = user.bag[costType][matrialID] || 0;

        return curNum;
    },

    /** 获取宝石数量 */
    getGemNumByTypeAndLevel: function (gemType, gemLevel) {
        var user = this.user;
        if (!user.bag['gem']) {
            return 0;
        }

        for (gemid in user.bag['gem']) {
            var type = parseInt(gemid / 100);
            var level = gemid % 100;

            if (gemType == type && gemLevel == level) {
                return user.bag['gem'][gemid];
            }
        }

        return 0;
    },

    /** 添加一个奖励 */
    addAward: function (addedAwards, awardType, awardId, awardNum, award, mod, act, notShow) {
        var user = this.user;
        if (awardType == 'user') {
            var status = user.status;
            if (awardId == 'xp') {
                var levelUpAward = this.addXp(awardNum, mod, act);
                addedAwards.push(award);

                if (levelUpAward.length > 0) {
                    this.addAward(addedAwards, levelUpAward[0][0], levelUpAward[0][1], levelUpAward[0][2], levelUpAward[0], mod, act, true);
                }
            } else if (awardId == 'arena_xp') {
            } else if (awardId == 'vip_xp') {
                user.status.vip_xp = ((user.status.vip_xp - 0) || 0) + awardNum;
                this.markDirty('status.vip_xp');
                this.updateVip();
                addedAwards.push(award);
            } else if (awardId == 'mixcash') {
                // 先消耗绑定元宝，再消耗非绑定元宝
                var consumeBindCash = Math.abs(awardNum);
                var consumeCash = 0;
                var hasBindCash = user.status.bindcash;
                if (hasBindCash < Math.abs(awardNum)) {
                    consumeBindCash = hasBindCash;

                    var hasCash = user.status.cash;
                    if (hasCash >= Math.abs(awardNum) - hasBindCash) {
                        consumeCash = Math.abs(awardNum) - hasBindCash;
                    }
                }

                if (consumeBindCash > 0) {
                    var cost = ['user', 'bindcash', -consumeBindCash];
                    if (this.addResource('bindcash', -consumeBindCash, mod, act)) {
                        addedAwards.push(cost);
                    }
                }
                if (consumeCash > 0) {
                    var cost = ['user', 'cash', -consumeCash];
                    if (this.addResource('cash', -consumeCash, mod, act)) {
                        addedAwards.push(cost);
                    }
                }

                logic_event_mgr.emit(logic_event_mgr.EVENT.COST_MIX_CASH, this, Math.abs(awardNum));
            } else if (this.addResource(awardId, awardNum, mod, act)) {
                if (notShow && notShow == true) {
                    award[3] = 1;// 不显示在奖励列表
                }
                addedAwards.push(award);

                if (awardNum < 0 && ('bindcash' == awardId || 'cash' == awardId)) {
                    logic_event_mgr.emit(logic_event_mgr.EVENT.COST_MIX_CASH, this, Math.abs(awardNum));
                }
            }
        } else if (awardType == 'equip') {
            if (awardNum < 0) {
                var equip_cnt = this.user.bag.equip[awardId] = this.user.bag.equip[awardId] || 0;
                if (equip_cnt > 0) {
                    var args = {
                        uid: this.uid,
                        eid: awardId,
                        mod: mod,
                        act: act,
                        num: awardNum,
                    }

                    server.addGameLog(LogType.LOG_EQUIP_CONSUME, args, null);
                }

                if (equip_cnt + awardNum >= 0) {
                    this.user.bag.equip[awardId] = this.user.bag.equip[awardId] + awardNum;
                    this.markDirty(`bag.equip.${awardId}`);
                    addedAwards.push(['equip', awardId, awardNum]);
                }
            } else {
                if (!conf_mgr.gConfEquip[awardId]) { return; }

                var grade = +award[2];
                for (var j = 0; j < awardNum; j++) {
                    var eid = this.addEquip(awardId, grade, 0, 0, mod, act);
                }
                addedAwards.push(['equip', awardId, awardNum]);

                this.onEquipGetCallback(awardId, awardNum);
            }
            this.memData.equip_num += awardNum;
        } else if (awardType == 'dragon') {
            if (awardNum < 0) {
                var dragonObj = this.user.bag.dragon[awardId];
                if (dragonObj) {
                    var args = {
                        uid: this.uid,
                        gid: this.user.bag.dragon[awardId],
                        id: dragonObj.id,
                        attr: dragonObj.attr,
                        mod: mod,
                        act: act,
                    };
                    server.addGameLog(LogType.LOG_DRAGON_PRODUCE, args, null);
                }

                delete this.user.bag.dragon[awardId];
                this.markDelete("bag.dragon." + awardId);
                award[1] = +award[1];
                addedAwards.push(award);
            } else {
                if (!conf_mgr.gConfDragonGem[awardId])
                    return;
                for (var j = 0; j < awardNum; j++) {
                    var gid = this.addDragonGem(awardId, mod, act);
                    addedAwards.push(['dragon', gid, this.user.bag.dragon[gid]]);
                }
                this.memData.dragongem_num += awardNum;
            }
        } else if (awardType == 'headframe') {
            this.updateHeadFrameStatus(awardId, awardNum > 0);
            addedAwards.push(award);
        } else if (awardType == 'limitmat') {
            if (awardNum < 0) {
                addedAwards.combine(this.costLimitMat(awardId, awardNum, mod, act));
            } else if (this.memData.limitmat.length < 50) {
                var mid = this.addLimitMat(awardId, award[2], award[3], award[4], mod, act);
                addedAwards.push(['limitmat', mid, this.user.bag.limitmat[mid]]);
                this.memData.limitmat.push([mid, this.user.bag.limitmat[mid].expire]);
                this.memData.limitmat.sort(function (item1, item2) {
                    return item1[1] - item2[1];
                });
            }
        } else if (awardType == 'skyweapon') {
            this.addWeaponEquip(award[1], award[2], award[3], mod, act);
            addedAwards.push(award);
        } else if (awardType == 'skywing') {
            this.addWingEquip(award[1], award[2], award[3], mod, act);
            addedAwards.push(award);
        } else if (awardType == 'skymount') {
            this.addSkyMount(award[1], award[2], award[3], mod, act);
            addedAwards.push(award);
        } else if (awardType == 'rune') {
            addedAwards = rune_mod.addAward(this, addedAwards, awardType, awardId, awardNum, award, mod, act, notShow);
        } else if (awardType == 'weekcard') {
            // 小月卡
            user.payment.week_card += 30;
            this.markDirty('payment.week_card');
            addedAwards.push(award);

            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, this, 'weekCard', 1);
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, this, 'doubleCard', 1);
        } else if (awardType == 'monthcard') {
            // 月卡
            user.payment.month_card += 30;
            this.markDirty('payment.month_card');
            addedAwards.push(award);

            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, this, 'monthCard', 1);
            logic_event_mgr.emit(logic_event_mgr.EVENT.DO_DAILY_TASK, this, 'doubleCard', 1);
        } else if (awardType == 'wake_dragon') {
            // 激活巨龙
            if (conf_mgr.gConfCustomDragon[awardId]) {
                this.wake_dragon(awardId);
                addedAwards.push(award);
            }
        } else if (awardType == 'card' && awardNum > 0) {
            // 获得英雄
            award[1] = +award[1];
            addedAwards.push(award);
            // 估计得上报英雄结构-fish
        } else {
            if (this.addBag(awardType, awardId, awardNum, mod, act)) {
                award[1] = +award[1];
                addedAwards.push(award);
            }
        }
    },

    /** 随机出一个奖励 */
    randomAward: function (itemGroupConf, totalOdds) {
        var awardIndex = 1;
        var rangeOdd = 0;
        var randOdd = common.randRange(0, totalOdds);
        var groupLength = Object.keys(itemGroupConf).length;
        for (var j = 1; j <= groupLength; j++) {
            rangeOdd += itemGroupConf[j].weight;
            if (randOdd < rangeOdd) {
                awardIndex = j;
                break;
            }
        }

        var award = clone(itemGroupConf[awardIndex].award[0]);
        var awardType = award[0];
        var awardId = award[1];
        var awardNum = 0;

        // 再算一遍数量
        if (awardType == 'equip') {
            awardNum = Math.floor(+award[award.length - 1]);
        } else if (awardType == 'user' && awardId == 'staying_power') {
            // 耐力上限为100，不能超过
            awardNum = Math.floor(+award[2]);
            var curNum = this.user.status.staying_power;
            if (curNum + awardNum > parseInt(conf_mgr.gConfTerritoryWarBase.enduranceLimit.value)) {
                awardNum = parseInt(conf_mgr.gConfTerritoryWarBase.enduranceLimit.value) - curNum;
            }
        } else {
            awardNum = Math.floor(+award[2]);
        }

        var retAward = {};
        retAward.award = award;
        retAward.awardType = awardType;
        retAward.awardId = awardId;
        retAward.awardNum = awardNum;

        return retAward;
    },

    /**
     * 
     * @param {*} awards 
     * @param {*} mod 哪个模块调用的，用于日志记录
     * @param {*} act 哪个接口调用的，用于日志记录
     */
    addAwards: function (awards, mod, act) {
        // awards 格式[[user,gold,100], [material,10,10]], [gem,10,1], [limitmat,1,1,2010010101,1]
        //  [equip, weapon, '1',1], [card,1,1], [user, cash, 100]
        var addedAwards = [];
        if (!awards) return false;
        for (var i = 0, max = awards.length; i < max; i++) {
            var award = awards[i];
            if (!award) continue;
            var awardType = award[0];
            var awardId = award[1];
            if (awardId == 'food') {
                continue;
            }

            var awardNum = 0;
            if (awardType == 'equip') {
                awardNum = Math.floor(+award[award.length - 1]);
            } else if (awardType == 'user' && awardId == 'staying_power') {
                // 耐力上限为100，不能超过
                awardNum = Math.floor(+award[2]);
                var curNum = this.user.status.staying_power;
                if (curNum + awardNum > parseInt(conf_mgr.gConfTerritoryWarBase.enduranceLimit.value)) {
                    awardNum = parseInt(conf_mgr.gConfTerritoryWarBase.enduranceLimit.value) - curNum;
                }
            } else if (awardType == 'group') {
                awardNum = Math.floor(+award[3]);
            } else {
                awardNum = Math.floor(+award[2]);
            }
            if (isNaN(awardNum) || !awardNum) continue;

            var suss = true;
            if (awardType == 'user' && awardId == 'country_score') {
                var countryWarReq = {};
                countryWarReq.mod = 'countrywar';
                countryWarReq.act = 'add_score';
                countryWarReq.uid = this.uid;
                countryWarReq.args = {
                    score: awardNum,
                };

                var countryWarResp = {};
                countryWarResp.code = 0;
                countryWarResp.desc = '';
                countryWarResp.data = {};

                requestCountryWar(countryWarReq, countryWarResp, function () {
                    if (countryWarResp.code != 0) {
                        suss = false;
                    }
                });
            }

            if (!suss) {
                continue;
            }

            if (awardType == 'group') {                                                     // 道具组
                var groupAwardMod = award[2];   // 奖励模式
                var groupAwardNum = Math.floor(+award[3]);
                var groupId = parseInt(awardId);
                var itemGroupConf = conf_mgr.gConfItemGroupConfig[groupId];
                if (!itemGroupConf || itemGroupConf.length == 0)
                    continue;

                var totalOdds = 0;
                var groupLength = Object.keys(itemGroupConf).length;
                for (var j = 1; j <= groupLength; j++) {
                    totalOdds += itemGroupConf[j].weight;
                }

                if (groupAwardMod == 0) {                                                   // 随机多次
                    for (var j = 0; j < groupAwardNum; j++) {
                        var retAward = this.randomAward(itemGroupConf, totalOdds);
                        award = retAward.award;
                        awardType = retAward.awardType;
                        awardId = retAward.awardId;
                        awardNum = retAward.awardNum;

                        if (isNaN(awardNum) || !awardNum) continue;

                        this.addAward(addedAwards, awardType, awardId, awardNum, award, mod, act);
                    }
                } else if (groupAwardMod == 1) {                                            // 随机1次
                    var retAward = this.randomAward(itemGroupConf, totalOdds);
                    award = retAward.award;
                    awardType = retAward.awardType;
                    awardId = retAward.awardId;
                    awardNum = retAward.awardNum * groupAwardNum;

                    if (awardType == 'equip') {
                        award[3] = awardNum;
                    } else {
                        award[2] = awardNum;
                    }

                    if (isNaN(awardNum) || !awardNum)
                        continue;

                    this.addAward(addedAwards, awardType, awardId, awardNum, award, mod, act);
                }
            } else {
                this.addAward(addedAwards, awardType, awardId, awardNum, award, mod, act);
            }
        }

        var retAwards = {};
        retAwards.awards = addedAwards;
        retAwards.heros = this.selectHeroAwards(addedAwards);
        return retAwards;
    },

    // selecte heros in awards
    selectHeroAwards: function (addedAwards) {
        var heroIndexs = [];
        var heros = {};
        for (var i = addedAwards.length - 1; i >= 0; i--) {
            if (addedAwards[i][0] == 'card') {
                var heroArr = hero.addHero(this, +addedAwards[i][1], Math.floor(+addedAwards[i][2]))
                if (heroArr.length > 0) {
                    heroIndexs = heroIndexs.concat(heroArr);
                }
            }
        }

        for (var k = heroIndexs.length - 1; k >= 0; k--) {
            var index = heroIndexs[k];
            heros[index] = this.user.hero_bag.heros[index];
        }

        return heros;
    },

    addResource: function (name, num, mod, act) {
        var status = this.user.status;

        if (!status.hasOwnProperty(name)) {
            return false;
        }

        if (isNaN(num)) return false;

        num = Math.floor(num);

        if (status[name] + num < 0) {
            LOG(util.format("Error: 材料扣除不足 %s %d", name, num))
            return false;
        }
        var update_before = status[name];
        status[name] += num;
        if (name == 'cash') {
            if (num < 0) {
                this.onCashCost(-num);
            } else {
                this.checkLuckyDragon();
            }
        } else if (name == 'bindcash') {
            if (num < 0) {
                this.onBindCashCost(-num);
            }
        }
        var update_later = status[name];
        if (conf_mgr.gConfUser[name].record) {
            CostLog(this, this.action.mod, this.action.act, this.action.args, name, num, update_before, update_later);
        }

        // 日志记录
        if (num < 0) {                                                  // 消耗
            var args = {
                uid: this.uid,
                type: name,
                num: num,
                mod: mod,
                act: act,
            };
            server.addGameLog(LogType.LOG_CURRENCY_CONSUME, args, function () {

            });
        } else if (num > 0) {                                           // 获得
            var args = {
                uid: this.uid,
                type: name,
                num: num,
                mod: mod,
                act: act,
            };
            server.addGameLog(LogType.LOG_CURRENCY_PRODUCE, args, function () {

            });
        }

        this.markDirty('status.' + name);
        return true;
    },

    addBag: function (type, id, num, mod, act) {
        if (isNaN(num) || isNaN(id)) return false;
        id = +id;
        num = Math.floor(num);
        if (type == 'equip') {
            return false;
        }

        if (!(type in this.user.bag)) {
            return false;
        }

        if (!(id in this.user.bag[type])) {
            this.user.bag[type][id] = 0;
        }

        if ((this.user.bag[type][id] + num) < 0) {
            return false;
        }

        var oldNum = this.user.bag[type][id];
        this.user.bag[type][id] += num;
        var newNum = this.user.bag[type][id];
        if (this.user.bag[type][id] == 0 && type != 'card') {
            delete this.user.bag[type][id];
            this.markDelete(['bag', type, id].join('.'));
        } else {
            this.markDirty(['bag', type, id].join('.'));
        }

        // 记录日志
        var args = {
            uid: this.uid,
            id: id,
            num: num,
            old_num: oldNum,
            mod: mod,
            act: act,

        }


        var bag_args = {
            sid: config.DistId,
            openid: this.user.info.account,
            level: this.user.status.level,
            type: type,
            material_id: id,
            costName: mod + '_' + act,
            costValue: num,
            update_before: oldNum,
            update_later: newNum,
        };

        if (type == 'material') {
            if (num > 0) {
                server.addGameLog(LogType.LOG_MATERIAL_PRODUCE, args, null);
            } else {
                server.addGameLog(LogType.LOG_MATERIAL_CONSUME, args, null);
            }
            LogCollect(this.uid, 'add_bag', bag_args);
        } else if (type == 'fragment') {
            if (num > 0) {
                server.addGameLog(LogType.LOG_CARD_FRAGMENT_PRODUCE, args, null);
            } else {
                server.addGameLog(LogType.LOG_CARD_FRAGMENT_CONSUME, args, null);
            }
            LogCollect(this.uid, 'add_bag', bag_args);
        } else if (type == 'dress') {
            if (num > 0) {
                server.addGameLog(LogType.LOG_SOLDIER_EQUIP_PRODUCE, args, null);
            } else {
                server.addGameLog(LogType.LOG_SOLDIER_EQUIP_CONSUME, args, null);
            }
            LogCollect(this.uid, 'add_bag', bag_args);
        } else if (type == 'gem') {
            if (num > 0) {
                server.addGameLog(LogType.LOG_GEM_PRODUCE, args, null);
            } else {
                server.addGameLog(LogType.LOG_GEM_CONSUME, args, null);
            }
            LogCollect(this.uid, 'add_bag', bag_args);
        }

        return true;
    },

    updateRoleEquipTalent: function (hid) {
        var roleObj = this.user.hero_bag.heros[hid];
        if (!roleObj) {
            return;
        }
        var wearEquip = this.user.hero_bag.heros[hid].equip;
        var equipBag = this.user.bag.equip;
        var talent = roleObj.talent;
        var points = 0;
        for (var pos in wearEquip) {
            var eid = wearEquip[pos];
            if (!eid) {
                continue;
            }

            var oneObj = equipBag[eid];
            if (!oneObj) {
                continue;
            }

            var grade = oneObj.grade;
            var equipConf = conf_mgr.gConfEquip[oneObj.id];
            if (!equipConf) {
                continue;
            }

            var quality = equipConf.quality;
            var talentConf = conf_mgr.gConfEquipBase[pos][quality];
            if (!talentConf) {
                continue;
            }

            var talentPoints = talentConf.talentPoints;

            points += talentPoints[grade] || 0;

        }

        talent.point = points;
        this.markDirty('hero_bag.heros.' + hid + '.talent');
        player_team.getFightForce(this, TEAM_NAME.DEFAULT, 0, true);
        return points;
    },

    refreshShop: function (type, count) {
        var selectedGroups = conf_mgr.gShopGroupWeight[type].must.slice();
        var userLevel = this.user.status.level;
        for (var i = 0, len = selectedGroups.length; i < len; i++) {
            var groupId = selectedGroups[i];
            if (conf_mgr.gShopGroupLimit[groupId][0] > userLevel || conf_mgr.gShopGroupLimit[groupId][1] < userLevel) {
                selectedGroups.splice(i, 1);
                i--;
                len--;
            }
        }

        var leftCount = count - selectedGroups.length;
        if (leftCount > 0) {
            var otherGroups = clone(conf_mgr.gShopGroupWeight[type].others);
            for (var groupId in otherGroups) {
                if (conf_mgr.gShopGroupLimit[groupId][0] > userLevel || conf_mgr.gShopGroupLimit[groupId][1] < userLevel) {
                    delete otherGroups[groupId];
                }
            }

            for (var i = 0, len = Object.keys(otherGroups).length; i < len; i++) {
                var sgId = common.wRand(otherGroups);
                selectedGroups.push(sgId);
                delete otherGroups[sgId];
            }
        }

        var goods = {};
        for (var i = 0, cnt = 0, len = selectedGroups.length; i < len && cnt < count; i++) {
            var groupId = selectedGroups[i];
            var weights = clone(conf_mgr.gShopItemWeight[type][groupId]);
            for (var id in weights) {
                if (userLevel < conf_mgr.gConfShop[id].minLevel || userLevel > conf_mgr.gConfShop[id].maxLevel) {
                    delete weights[id];
                }

                if (type == ShopType.MYSTERY && !this.user.shop[type].refresh) {
                    // 神秘商店第一次一定只能刷新出橙色装备
                    if (conf_mgr.gConfShop[id].get[0][1] < Quality.ORANGE) {
                        delete weights[id];
                    }
                }
            }

            var rid = common.wRand(weights);
            if (!rid) {
                continue;
            }
            var lid = 3;
            if (type != ShopType.MYSTERY || this.user.shop[type].refresh) {
                lid = common.wRand(conf_mgr.gShopGoodWeight[rid]);
            }
            goods[rid] = [lid, 0];
            var good = conf_mgr.gConfShop[rid].get[0];
            // 随机装备
            if (good[0] == 'equip' && good.length > 4) {
                goods[rid][2] = generateEquip(good, userLevel);
                goods[rid][3] = good[3];
            }
            cnt++;
        }
        if (type == ShopType.COUNTRYPOSITION) {
            this.user.shop[type] = {};
            this.user.shop[type].goods = {};
            this.user.shop[type].refresh = common.getDate();
            this.markDirty(util.format('shop.%d', type));
        }
        this.user.shop[type].goods = goods;
        this.markDirty(util.format('shop.%d.goods', type));
    },

    /** 刷新商店物品 */
    refreshShopGoods: function (id, tab) {
        var shopConf = conf_mgr.gConfShopNew[id];
        if (!shopConf) {
            return;
        }

        var tabConf = conf_mgr.gConfShopTab[tab];
        if (!tabConf) {
            return;
        }

        var user = this.user;
        user.shop_new[id][tab].goods = [];
        user.shop_new[id][tab].refresh_time = 0;

        var userLevel = user.status.level;

        var curTime = common.getTime();        //获取开服天数
        var serverOpenTime = common.GLOBAL_SERVER_INFO_DICT.serverStartTime;
        var serverOpenDay = Math.floor((curTime - serverOpenTime) / OneDayTime) + 1;

        var groups = tabConf.groups;
        for (var i = 0; i < groups.length; i++) {
            var groupId = groups[i];
            var groupConf = conf_mgr.gConfShopGoods[groupId];
            var goodsCount = Object.keys(groupConf).length;

            var weightArr = {};            // 帅选符合条件的商品
            for (var j = 1; j <= goodsCount; j++) {
                if (userLevel >= groupConf[j].minLevel && userLevel <= groupConf[j].maxLevel
                    && serverOpenDay >= groupConf[j].minDay && serverOpenDay <= groupConf[j].maxDay
                    && groupConf[j].groupWeight != -1) {
                    weightArr[j] = groupConf[j].groupWeight;
                }
            }

            if (Object.keys(weightArr).length > 0) {
                var goodsId = common.wRand(weightArr);
                //var goodsId = weightArr[randIndex];
                var goodsObj = {};
                goodsObj.groupId = groupId;
                goodsObj.goodsId = parseInt(goodsId);
                goodsObj.buy = 0;
                user.shop_new[id][tab].goods.push(goodsObj);
            }
        }

        if (tabConf.resetAlgorithm == 'disorderGroup') {            // 随机打乱顺序
            user.shop_new[id][tab].goods.sort(function (a, b) { return (Math.random() > 0.5) ? 1 : -1; });
        }

        user.shop_new[id][tab].refresh_time = common.getTime();
        this.markDirty(util.format('shop_new.%d.%d.goods', id, tab));
        this.markDirty(util.format('shop_new.%d.%d.refresh_time', id, tab));
    },

    /** 积分兑换进度获取 */
    getExchangePointsProgress: function (key, count) {
        if (!isActivityStart(this, 'exchange_points')) {
            return;
        }

        var conf = conf_mgr.gConfAvExchangePointsKey[key];
        if (!conf) {
            return;
        }

        for (var id in conf_mgr.gConfAvExchangePointsKey[key]) {
            var round = conf_mgr.gConfAvExchangePointsId[id].round;
            var startTime = conf_mgr.gConfAvExchangePointsTime[round].startTime;
            var endTime = conf_mgr.gConfAvExchangePointsTime[round].endTime;
            var nowTime = common.getTime();
            if (nowTime >= startTime && nowTime <= endTime) {
                var exchangePoints = this.user.activity.exchange_points;
                if (exchangePoints.time != conf_mgr.gConfAvExchangePointsTime[round].startTime) {
                    exchangePoints.time = conf_mgr.gConfAvExchangePointsTime[round].startTime;
                    exchangePoints.progress = {};
                    exchangePoints.rewards = {};
                    if (round == 1) {
                        exchangePoints.integral = 0;
                    }
                    this.markDirty('activity.exchange_points');
                }

                if (!exchangePoints.progress[key]) {
                    exchangePoints.progress[key] = count;
                } else {
                    exchangePoints.progress[key] += count;
                }

                var rewards = exchangePoints.rewards;
                for (var id in conf) {
                    if (exchangePoints.progress[key] >= conf[id].target && !rewards[id]) {
                        this.addTip('exchange_points');
                    }
                }

                this.markDirty('activity.exchange_points.progress.' + key);
                break;
            }
        }
    },

    /** 统计强化到指定等级的装备件数 */
    getEquipCountWithIntensifyLevel: function (level) {
        var user = this.user;
        var bag = user.bag;
        var count = 0;
        for (var eid in bag.equip) {
            var equipObj = bag.equip[eid];
            if (equipObj.intensify >= level && equipObj.pos > 0) {
                count++;
            }
        }

        return count;
    },

    /** 统计指定品级的装备件数 */
    getEquipCountWithQuality: function (quality) {
        var user = this.user;
        var bag = user.bag;
        var count = 0;
        for (var eid in bag.equip) {
            var equipObj = bag.equip[eid];
            var equipConf = conf_mgr.gConfEquip[equipObj.id];

            if (equipConf.quality >= quality && equipObj.hid > 0) {
                count++;
            }
        }
        return count;
    },

    /** 统计精炼到指定等级的装备件数 */
    getEquipCountWithRefineLevel: function (level) {
        var user = this.user;
        var bag = user.bag;
        var count = 0;
        for (var eid in bag.equip) {
            var equipObj = bag.equip[eid];
            var equipConf = conf_mgr.gConfEquip[equipObj.id];
            if (equipConf) {
                var refineExp = equipObj.refine_exp;
                var refineLevel = getRefineLevelByExp(equipConf.quality, refineExp)[0];
                if (refineLevel >= level && equipObj.pos > 0) {
                    count++;
                }
            }
        }

        return count;
    },

    /** 统计等级达到指定等级的英雄数 */
    getHeroCountWithLevel: function (level) {
        var user = this.user;
        var count = 0;
        var team1 = user.team[1];
        for (var hid in team1) {
            var theHero = user.hero_bag.heros[hid];
            if (theHero && theHero.level >= level) {
                count++;
            }
        }

        return count;
    },

    /** 统计突破到指定等级的英雄数 */
    getHeroCountWithTalentLevel: function (talent) {
        var user = this.user;
        var count = 0;
        var team1 = user.team[1];
        for (var hid in team1) {
            var theHero = user.hero_bag.heros[hid];
            if (theHero && theHero.tier >= talent) {
                count++;
            }
        }

        return count;
    },

    /** 统计升到指定等级的龙数量 */
    getDragonCountWithLevel: function (level) {
        var user = this.user;
        var count = 0;
        for (var id in user.dragon) {
            var dragonObj = user.dragon[id];
            if (dragonObj) {
                if (dragonObj.level >= level) {
                    count++;
                }
            }
        }

        return count;
    },

    getArenaRankConditionDetail: function (condition) {
        var baseRank = 100000;
        var detail = {
            type: Math.floor(condition / baseRank),
            rank: condition % baseRank
        };
        return detail;
    },

    /** 统计觉醒到指定星级的部位数量 */
    getPartCountWithStar: function (star) {
        var user = this.user;
        var count = 0;

        for (var i in user.pos) {
            if (user.pos[i].rid <= 0) { continue; }
            for (var j = 1; j <= HeroPartCount; j++) {
                if (!user.pos[i].part[j]) { continue; }
                if (user.pos[i].part[j].awake_level < star) { continue; }
                count++;
            }
        }

        return count;
    },

    /** 统计所有部位总的觉醒星级 */
    getAllPartStarCount: function () {
        var user = this.user;
        var team1 = user.team[1];
        var count = 0;
        for (var hid in team1) {
            var heroObj = user.hero_bag.heros[hid];
            if (!heroObj) { continue; }
            for (var j = 1; j <= HeroPartCount; j++) {
                if (!heroObj.part[j]) { continue; }
                count += heroObj.part[j].awake_level;
            }
        }
        return count;
    },

    /** 统计镶嵌指定等级及以上宝石数量 */
    getEmbedGemCountWithLevel: function (level) {
        var user = this.user;
        var count = 0;

        for (var i in user.pos) {
            if (user.pos[i].rid <= 0) { continue; }
            for (var j = 1; j <= HeroPartCount; j++) {
                for (var k = 1; k <= 4; k++) {
                    var gemId = user.pos[i].part[j].gems[k];
                    if (gemId <= 0) { continue; }
                    var gemConf = conf_mgr.gConfGem[gemId];
                    if (!gemConf) { continue; }
                    if (gemConf.level < level) { continue; }
                    count++;
                }
            }
        }

        return count;
    },

    getStayingPower: function (now) {
        var param = this.getBuildingParam('enduranceRecoverRate');

        var user = this.user;
        var powerTime = user.mark.staying_power_time;
        var powerInterval = parseInt(conf_mgr.gConfTerritoryWarBase.enduranceRecoverInterval.value);
        powerInterval = Math.floor(powerInterval * (1 - param[0] / 100));

        var powerMax = parseInt(conf_mgr.gConfTerritoryWarBase.enduranceLimit.value);
        if (user.status.staying_power >= powerMax) {
            user.status.staying_power = powerMax;
            user.mark.staying_power_time = now;
            this.markDirty('status.staying_power');
            this.markDirty('mark.staying_power_time');
            return user.status.staying_power;
        }

        if (now - powerTime < powerInterval) {
            return user.status.staying_power;
        }

        var gotPowner = Math.floor((now - powerTime) / powerInterval);
        if (user.status.staying_power + gotPowner > powerMax) {
            gotPowner = powerMax - user.status.staying_power;
            powerTime = now;
        } else {
            powerTime = powerTime + gotPowner * powerInterval;
        }

        user.status.staying_power += gotPowner;
        this.markDirty('status.staying_power');
        user.mark.staying_power_time = powerTime;
        this.markDirty('mark.staying_power_time');
        return user.status.staying_power;
    },

    cullStayingPower: function (val) {
        var new_val = val;
        var powerMax = parseInt(conf_mgr.gConfTerritoryWarBase.enduranceLimit.value);
        if (new_val > powerMax) {
            new_val = powerMax;
        }

        if (new_val < 0) {
            new_val = 0;
        }

        return new_val;
    },

    updateVip: function () {
        var user = this.user;
        var vipXp = user.status.vip_xp;
        var oldVip = user.status.vip;
        var extraVip = task_mod.getPrivilegeVal(this, 'vipExp');

        for (var i = 1; i < 1000; i++) {
            if (!conf_mgr.gConfVip[i] || conf_mgr.gConfVip[i].cash > vipXp + extraVip) {
                break;
            }
        }

        user.status.vip = i - 1;
        var newVip = i - 1;
        if (oldVip != i - 1) {
            updateWssData(user.info.uid, { vip: i - 1 });
            forceSyncToWorld(user.info.uid);
            this.markDirty('status.vip');

            requestWorldByModAndAct({ uid: user._id }, 'user', 'update_vip', {
                old_vip: oldVip,
                new_vip: newVip,
            });

            this.updateHeadFrameStatus('vip_level', newVip);
        }
    },

    getActionPoint: function (now) {
        var user = this.user;
        var actionTime = user.mark.action_point_time;

        // if (!this.isTerritoryWarOpen() && actionTime == 0) {            // 领地战没开启的时候不回复体力
        //     return user.status.action_point;
        // }

        if (actionTime == 0) {
            actionTime = now;
        }

        var param = this.getBuildingParam('actionMax');
        var param2 = this.getBuildingParam('actionRecoverRate');

        var actionInterval = parseInt(conf_mgr.gConfTerritoryWarBase.actionRecoverInterval.value);
        actionInterval = Math.floor(actionInterval * (1 - param2[0] / 100));

        var pointMax = parseInt(conf_mgr.gConfTerritoryWarBase.actionLimit.value);
        pointMax = Math.floor(pointMax + param[0]);

        if (user.status.action_point >= pointMax) {
            user.mark.action_point_time = now;
            this.markDirty('mark.action_point_time');
            return user.status.action_point;
        }

        if (now - actionTime < actionInterval) {
            return user.status.action_point;
        }

        var gotPoint = Math.floor((now - actionTime) / actionInterval);
        if (user.status.action_point + gotPoint > pointMax) {
            gotPoint = pointMax - user.status.action_point;
            actionTime = now;
        } else {
            actionTime = actionTime + gotPoint * actionInterval;
        }

        user.status.action_point += gotPoint;
        this.markDirty('status.action_point');
        user.mark.action_point_time = actionTime;
        this.markDirty('mark.action_point_time');
        return user.status.action_point;
    },

    calcRoleReborn: function (condition) {
        var allPos = this.user.hero_bag.heros;
        var cnt = 0;
        for (var hid in allPos) {
            if (allPos[hid].tier >= condition) {
                cnt++;
            }
        }
        return cnt;
    },

    calcSoldierLevel: function (condition) {
        var cnt = 0;
        return cnt;
    },

    calcEquipGod: function (condition) {
        return 0;
    },

    // ---------------人皇 end---------------------

    getCreateDays: function () {
        var createDate = common.getDate(this.user.info.create);
        var today = common.getDate();
        return common.getDateDiff(createDate, today);
    },

    getOnlineTime: function () {
        if (!this.memData.wss_login) {
            return 0;
        }

        return common.getTime() - this.memData.wss_login + this.user.mark.online_time;
    },

    onCashCost: function (cash) {
        var user = this.user;
        user.payment.cost += cash;
        this.markDirty('payment.cost');
        this.doOpenHoliday('payment.paid', cash);

        if (isActivityStart(this, 'expend_gift')) {        // 消费有礼
            var expendGift = this.user.activity.expend_gift;
            if (expendGift.time != conf_mgr.gConfActivities['expend_gift'].startTime) {
                expendGift.time = conf_mgr.gConfActivities['expend_gift'].startTime;
                expendGift.paid = 0;
                expendGift.rewards = {};
                this.markDirty('activity.expend_gift');
            }

            if (this.action.act != 'click_lucky_dragon') {
                expendGift.paid += cash;
                this.markDirty('activity.expend_gift.paid');
            }
        }

        if (isActivityStart(this, 'daily_cost')) {        // 每日消耗
            var today = getGameDate();
            var dailyCost = this.user.activity.daily_cost;
            if (dailyCost.day != today) {
                dailyCost.day = today;
                dailyCost.day_cost = 0;
                dailyCost.rewards = {};
                this.markDirty('activity.daily_cost');
            }

            if (this.action.act != 'click_lucky_dragon') {
                dailyCost.day_cost += cash;
                this.markDirty('activity.daily_cost.day_cost');
            }
        }
    },

    onBindCashCost: function (cash) {
        var user = this.user;
        if (!user.payment.cost_bindcash) {
            user.payment.cost_bindcash = 0;
        }

        user.payment.cost_bindcash += cash;
        this.markDirty('payment.cost_bindcash');

        if (isActivityStart(this, 'expend_gift')) {        // 消费有礼
            var expendGift = this.user.activity.expend_gift;
            if (expendGift.time != conf_mgr.gConfActivities['expend_gift'].startTime) {
                expendGift.time = conf_mgr.gConfActivities['expend_gift'].startTime;
                expendGift.paid = 0;
                expendGift.rewards = {};
                this.markDirty('activity.expend_gift');
            }

            if (this.action.act != 'click_lucky_dragon') {
                expendGift.paid += cash;
                this.markDirty('activity.expend_gift.paid');
            }
        }
    },

    addTip: function (type) {
        if (!this.user.tips[type]) {
            this.user.tips[type] = 1;
            this.markDirty('tips.' + type);
        }
        this.hasTip = true;
    },

    rmTip: function (type) {
        if (this.user.tips[type]) {
            delete this.user.tips[type];
            this.markDelete('tips.' + type)
        }
    },

    recordPlay: function (type, name, success) {
        var phpReq = {
            uid: this.uid,
            act: 'user_play',
            args: {
                sid: config.DistId,
                openid: this.user.info.account,
                level: this.user.status.level,
                type: type,
                name: name,
                success: success ? success : 1,
            },
        };
        LogCollect(phpReq.uid, phpReq.act, phpReq.args);
        // requestPHP(phpReq, {});
    },

    getBuildingParam: function (func_name) {
        var param = [0];
        return param;
    },

    getBuildingTotalLevel: function () {
        var totalLevel = 0;
        return totalLevel;
    },

    // isTerritoryWarOpen: function () {
    //     if (!this.user.territory_war.open){
    //         return false;
    //     }

    //     return true;
    // },

    checkLuckyDragon: function () {
        var conf = conf_mgr.gConfAvLuckyDragon[this.user.activity.lucky_dragon.use + 1];
        if (isActivityStart(this, 'lucky_dragon') && conf && this.user.status.cash >= conf.spend) {
            this.addTip('lucky_dragon');
        }
    },

    /** 刷新头像框的状态 */
    updateHeadFrameStatus: function (type, value) {
        var user = this.user;
        if (!user.head_frame_status) {
            user.head_frame_status = {};
            this.markDirty('head_frame_status');
        }

        var tempType = '';

        if (isNaN(+type)) {
            tempType = 'string';
        }
        else {
            tempType = 'number';
            type = +type;
        }

        if (tempType == "number") {
            var conf = conf_mgr.gConfHeadFrame[type];
            if (conf) {
                type = conf.condition;
                if (type == 'fight_force_rank' || type == 'arena_rank') {
                    if (value != 0 && value <= conf.value) {
                        if (!user.head_frame_status[conf.id]) {                            // 激活
                            user.head_frame_status[conf.id] = 1;
                            this.markDirty(util.format('head_frame_status.%d', conf.id));
                        }
                    } else {
                        if (user.head_frame_status[conf.id] == 1) {                            // 失活
                            user.head_frame_status[conf.id] = 0;
                            this.markDirty(util.format('head_frame_status.%d', conf.id));

                            if (user.info.headframe == conf.id) {
                                user.info.headframe = 30000 + this.getQuality();
                                this.markDirty('info.headframe');
                            }
                        }
                    }
                } else if (type == 'getHero' || type == 'player') {
                    if (value != 0 && value == conf.value) {
                        if (!user.head_frame_status[conf.id]) {                            // 激活
                            user.head_frame_status[conf.id] = 1;
                            this.markDirty(util.format('head_frame_status.%d', conf.id));
                        }
                    }
                } else {
                    if (value != 0 && value >= conf.value) {
                        if (!user.head_frame_status[conf.id]) {                            // 激活
                            user.head_frame_status[conf.id] = 1;
                            this.markDirty(util.format('head_frame_status.%d', conf.id));
                        }
                    } else {
                        if (user.head_frame_status[conf.id] == 1) {                            // 失活
                            user.head_frame_status[conf.id] = 0;
                            this.markDirty(util.format('head_frame_status.%d', conf.id));

                            if (user.info.headframe == conf.id) {
                                user.info.headframe = 30000 + this.getQuality();
                                this.markDirty('info.headframe');
                            }
                        }
                    }
                }
            }
        } else {
            if (type == 'fight_force_rank' || type == 'arena_rank') {                // 排行榜类型的
                for (var id in conf_mgr.gConfHeadFrame) {
                    var conf = conf_mgr.gConfHeadFrame[id];
                    if (!conf) { continue; }
                    if (conf.condition != type) { continue; }
                    if (value != 0 && value <= conf.value) {
                        if (!user.head_frame_status[+id]) {                                    // 激活
                            user.head_frame_status[+id] = 1;
                            this.markDirty(util.format('head_frame_status.%d', id));
                        }
                    } else {
                        if (user.head_frame_status[+id] == 1) {                                    // 失活
                            user.head_frame_status[+id] = 0;
                            this.markDirty(util.format('head_frame_status.%d', id));

                            if (user.info.headframe == id) {
                                user.info.headframe = 30000 + this.getQuality();
                                this.markDirty('info.headframe');
                            }
                        }
                    }
                }
            } else if (type == 'getHero' || type == 'player') {
                for (var id in conf_mgr.gConfHeadFrame) {
                    var conf = conf_mgr.gConfHeadFrame[id];
                    if (!conf) { continue; }
                    if (conf.condition != type) { continue; }
                    if (value == 0 || value != conf.value) { continue; }
                    if (!user.head_frame_status[+id]) {                                    // 激活
                        user.head_frame_status[+id] = 1;
                        this.markDirty(util.format('head_frame_status.%d', id));
                    }
                }
            } else {
                for (var id in conf_mgr.gConfHeadFrame) {
                    var conf = conf_mgr.gConfHeadFrame[id];
                    if (!conf) { continue; }
                    if (conf.condition != type) { continue; }
                    if (value != 0 && value >= conf.value) {
                        if (!user.head_frame_status[+id]) {                                    // 激活
                            user.head_frame_status[+id] = 1;
                            this.markDirty(util.format('head_frame_status.%d', id));
                        }
                    } else {
                        if (user.head_frame_status[+id] == 1) {                                    // 失活
                            user.head_frame_status[+id] = 0;
                            this.markDirty(util.format('head_frame_status.%d', id));

                            if (user.info.headframe == id) {
                                user.info.headframe = 30000 + this.getQuality();
                                this.markDirty('info.headframe');
                            }
                        }
                    }
                }
            }
        }
    },

    checkVersion: function () {
        var tNowVersion = this.user.mark.version || 0;
        if ((tNowVersion) >= Upgrade.get_version()) { return; }
        Upgrade.do(this, tNowVersion);
    },

    getCountrySalaryStartTime: function () {
        // 设置为当天的10点
        var timeStr = conf_mgr.gConfGlobal['countrySalaryTime'];
        var arr = timeStr.split('-');
        var beginHour = parseInt(arr[0]) - 1;

        var now = new Date();
        now.setHours(beginHour);
        now.setMinutes(0);
        now.setSeconds(0);

        return now.getTime() / 1000;
    },

    /** 计算皇城俸禄 */
    calcCountrySalary: function (oldPosition, newPosition) {
        if (!isModuleOpen_new(this, 'kingMe')) {
            return;
        }

        if (!conf_mgr.gConfPosition[oldPosition])
            return;

        var user = this.user;
        var salary = conf_mgr.gConfPosition[oldPosition].salary;

        if (newPosition) {
            user.info.position = newPosition;
            this.markDirty('info.position');
        }

        var curDate = new Date();
        var curTime = common.getTime();
        var curHour = curDate.getHours();
        var curDay = curDate.getDate();

        var startCalcTime = this.getCountrySalaryStartTime();
        var lastCalcTime = user.country.update_time;
        if (!lastCalcTime || lastCalcTime < startCalcTime) {
            lastCalcTime = startCalcTime;
            user.country.day_salary = 0;
            user.country.update_time = lastCalcTime;
            this.markDirty('country.day_salary');
            this.markDirty('country.update_time');
        }

        var lastDate = new Date(lastCalcTime * 1000);
        var lastCalcHour = lastDate.getHours();
        var lastCalcDay = lastDate.getDate();

        var timeStr = conf_mgr.gConfGlobal['countrySalaryTime'];
        var arr = timeStr.split('-');
        var beginHour = parseInt(arr[0]) - 1;
        var endHour = parseInt(arr[1]);

        // 如果上次计算的日期跟现在不是同一天，那今天的开始计算时间就从头开始
        if (lastCalcDay != curDay) {
            lastCalcHour = beginHour;
        }

        if (curHour != lastCalcHour) {            // 跨点了才需要重新计算
            if ((curHour >= beginHour && curHour < endHour) ||
                (lastCalcHour < endHour && curHour >= endHour)) {
                var calcEndHour = curHour;
                if (calcEndHour > endHour) {
                    calcEndHour = endHour;
                }

                var diffHour = calcEndHour - lastCalcHour;
                if (diffHour > 0) {
                    user.country.day_salary += (salary * diffHour);
                    user.country.update_time = curTime;
                    this.markDirty('country.day_salary');
                    this.markDirty('country.update_time');

                    var reqWorld = {
                        mod: 'user',
                        act: 'update_salary',
                        uid: this.uid,
                        args: {
                            day_salary: user.country.day_salary,
                            update_time: user.country.update_time,
                        },
                    };
                    requestWorld(reqWorld, {});
                }
            }
        }
    },

    /** 获取上阵武将数量 */
    getHeroCount: function () {
        var num = 0;
        var user = this.user;
        for (var p in user.pos) {
            if (user.pos[p].rid) {
                num++;
            }
        }

        return num;
    },

    /** 获取掉落间隔 */
    getAutoFightDropInterval: function () {
        var calcInterval = +conf_mgr.gConfExploreBase['accountInterval'].value;

        return calcInterval;
    },

    getAutoFightEquipDropInterval: function () {
        var calcInterval = +conf_mgr.gConfExploreBase['accountIntervalLoot'].value;
        return calcInterval;
    },

    /** 获取挂机最大掉落次数 */
    getAutoFightMaxDropCount: function () {
        var heroCount = this.getHeroCount();   // 上阵武将数量
        if (heroCount == 0) { return 0; }

        var storageMaxTime = conf_mgr.gConfExploreBase['StorageCubage'].value * 3600; // 仓库最大时间
        var calcInterval = this.getAutoFightDropInterval();// 服务器间隔
        var dropCount = Math.floor(storageMaxTime / calcInterval);
        return dropCount;
    },

    //open
    condtionSelect: function (type, value) {
        var user = this.user;
        //ERROR('=========type '+type+'  value0:'+value[0]);
        if (type == 'gameday') {
            var openDay = common.getDateDiff(getGameDate(), getGameDate(common.GLOBAL_SERVER_INFO_DICT.serverStartTime)) + 1;
            if (openDay >= +value[0]) {
                //ERROR('=====true===='+openDay+'  value:'+value[0]);
                return true;
            }
        } else if (type == 'level') {
            if (user.status.level >= +value[0]) {
                //ERROR('=====true==level=='+user.status.level+'  value:'+value[0]);
                return true;
            }
        } else if (type == 'vip') {
            if (user.status.vip >= +value[0]) {
                return true;
            }
        } else if (type == 'activity') {
            if (isActivityStart(this, value[0])) {
                return true;
            }
        } else if (type == 'custom') {
            if (+value[0] < user.battle.type) {
                return true;
            }

            if (+value[0] == user.battle.type && (+value[1] <= user.battle.progress)) {
                return true;
            }
        }

        return false;
    },

    /** 获取玩家武将信息 */
    getHero: function (hid) {
        var heros = this.user.hero_bag.heros;
        var heroMsg = heros[hid];
        if (!heroMsg) {
            return false;
        }

        return heroMsg;
    },

    getHeroStar: function (hid) {
        var heros = this.user.hero_bag.heros;
        var theHero = heros[hid];
        if (!theHero) { return 0; }

        var heroConf = conf_mgr.gConfHero[theHero.rid];
        if (!heroConf) { return 0; }

        var heroTemplateId = heroConf.heroTemplateId;     // hero模板id
        if (theHero.awake > 4) {
            heroTemplateId = heroConf.templatedIdUltimate;
        }
        var starBase = conf_mgr.gConfCombatHeroTemplate[heroTemplateId]['starBase'];        // 模板類型
        return (starBase + theHero.awake - 1);
    },

    /** 获得卡牌回调 */
    onCardGetOneCallback: function (id, newIndex) {
        if (!this.user.cardGetRecord) {
            this.user.cardGetRecord = {};
            this.markDirty("cardGetRecord");
        }

        var star = this.getHeroStar(newIndex);
        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_TASK, this, 'roleQuality', 1, star);
        // this.doOpenSeven('roleQuality', 1, star);
        // this.doOpenHoliday('roleQuality', 1, star);

        if (this.user.cardGetRecord[id] == null) {
            this.user.cardGetRecord[id] = 0;
        }

        this.user.cardGetRecord[id] += 1;
        this.markDirty(util.format("cardGetRecord.%d", id));

        this.updateHeadFrameStatus('getHero', id);
    },

    /** 获得装备回调 */
    onEquipGetCallback: function (id, num) {
        if (!this.user.equipGetRecord) {
            this.user.equipGetRecord = {};
            this.markDirty("equipGetRecord");
        }

        if (this.user.equipGetRecord[id] == null) {
            this.user.equipGetRecord[id] = 0;
        }

        this.user.equipGetRecord[id] += num;
        this.markDirty(util.format("equipGetRecord.%d", id));
    },

    onKeyGetCallback: function (id, num) {
        if (!this.user.keyGetRecord) {
            this.user.keyGetRecord = {};
            this.markDirty("keyGetRecord");
        }

        if (this.user.keyGetRecord[id] == null) {
            this.user.keyGetRecord[id] = 0;
        }

        this.user.keyGetRecord[id] += num;
        this.markDirty(util.format("keyGetRecord.%d", id));
    },

    hasGetKey: function (id) {
        if (!this.user.keyGetRecord) { return false; }
        if (this.user.keyGetRecord[id] == null) { return false; }
        if (this.user.keyGetRecord[id] == 0) { return false; }
        return true;
    },

    /** 登录回调 */
    onPlayerLogin: function () {
        var curTime = common.getTime();

        var user = this.user;
        this.updateVip();

        if (user.new_legion) {            // 初始化军团篝火特殊奖励
            if (user.new_legion.wood.special.length == 0) {
                var woodOpt = conf_mgr.gConfGlobal.legionBonfire_operate1.split('|');
                user.new_legion.wood.special = this.initBonFireSpecial(woodOpt);
                this.markDirty('new_legion.wood.special');
            }

            if (user.new_legion.fire.special.length == 0) {
                var fireOpt = conf_mgr.gConfGlobal.legionBonfire_operate2.split('|');
                user.new_legion.fire.special = this.initBonFireSpecial(fireOpt);
                this.markDirty('new_legion.fire.special');
            }
        }

        this.sendNewUserMail();        // 新手邮件

        user.custom_king = user.custom_king || { index: 0 };
        this.updateHeadFrameStatus('player', this.getQuality());

        if (user.status.headframe == 0) {
            user.status.headframe = 30000 + this.getQuality();
            this.markDirty('status.headframe');
        }

        // this.test_fight();
    },

    // /** 新版本战报 */
    // test_fight: function () {
    //     const { fight } = require('../../common/fight/fight.js');
    //     const fs = require('fs')
    //     var tAttcker = player_team.getFightTeam(this, TEAM_NAME.DEFAULT, 1, true);
    //     var tDefer = player_team.getFightTeam(this, TEAM_NAME.DEFAULT, 1, false);
    //     var tBattleReport = fight(tAttcker, tDefer);
    //     fs.writeFileSync('./test_report.run', JSON.stringify(tBattleReport), 'utf8');
    //     console.log(" 战报已经输出");
    // },

    /** 初始化山洞 */
    initCave: function () {
        if (!isModuleOpen_new(this, 'customcave')) { return; }

        var user = this.user;
        if (user.cave.level <= 0) {
            user.cave.level = user.status.level;
            this.markDirty('status.level');
        }

        // 初始化超级宝箱
        var keepTime = conf_mgr.gConfGlobal.customCaveSuperBoxLife * 60 * 60;    // 宝箱存在时间
        if (user.cave.put_shard_time && common.getTime() - user.cave.put_shard_time > keepTime) { // 宝箱开启时间到
            user.cave.put_shard_time = 0;
            user.cave.shard = { '1': 0, '2': 0, '3': 0, '4': 0 };
            user.cave.super_box_mar = 0;
            this.markDirty('cave.put_shard_time');
            this.markDirty('cave.super_box_mar');
            this.markDirty('cave.shard');
        }

        // 骰子恢复
        var judge = loginCommon.judgeStartTime(user.cave.start_reply_time);
        judge.newTime && (user.cave.start_reply_time = judge.newTime);

        var leftNum = user.cave.left_num;
        leftNum += judge.addDiceNum;
        if (leftNum >= conf_mgr.gConfGlobal.customCaveDiceNumLimit) {
            leftNum = conf_mgr.gConfGlobal.customCaveDiceNumLimit;
            user.cave.start_reply_time = 0;
        }

        user.cave.left_num = leftNum;
        this.markDirty('cave.left_num');
        this.markDirty('cave.start_reply_time');
    },

    /** 判断存在是否已经解救 */
    isVillageReleased: function (id) {
        var user = this.user;
        if (user.custom_village.indexOf(id) >= 0) {
            return true;
        }

        return false;
    },

    /** 初始化篝火特殊奖励 */
    initBonFireSpecial: function (arr) {
        var count = common.randRange(parseInt(arr[1]), parseInt(arr[2]));
        if (!count) {
            return "";
        }

        var dropArr = [];
        var maxCount = parseInt(arr[0]);
        for (var i = 0; i < maxCount; i++) {
            dropArr.push(i);
        }

        var specialArr = [];
        for (var i = 0; i < count; i++) {
            var randR = common.randRange(0, dropArr.length - 1);
            specialArr.push(dropArr[randR]);
            dropArr.remove(dropArr[randR]);
        }

        return specialArr;
    },

    /** 军团信息加入内存数据 */
    saveLegionMemData: function (req, legion) {
        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_TASK, this, 'legionMember', 1);
        this.doOpenSeven('legionMember', 1);
        this.doOpenHoliday('legionMember', 1);
        try {
            this.memData.legion_id = legion.lid || 0;
            this.memData.legion_name = legion.name || '';
            this.memData.legion_level = legion.level || 0;
            this.memData.legion_icon = legion.icon || [0, 0];
        } catch (e) {
            this.memData.legion_id = 0;
            this.memData.legion_name = '';
            this.memData.legion_level = 0;
            this.memData.legion_icon = [0, 0];
        }

        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_TASK, this, 'legionLevel', 1);

        req && updateWssData(req.uid, { lid: this.memData.legion_id });
    },

    getQuality: function () {
        var quality = 2;    // 一开始是绿色
        var user = this.user;
        if (user.custom_king.index > 0) {
            var maxId = +(this.user.custom_king.index);

            if (conf_mgr.gConfCustomPreview[maxId].showType == 'hero') {
                quality = conf_mgr.gConfCustomPreview[maxId].titleQuality;
            }
        }

        return quality;
    },

    /** 判断是否需要向村庄跨服服务器同步数据 */
    isNeedSyncToLandGrabber: function () {
        if (this.memData.village_id > 0 && isCrossVillage(this.memData.village_id)) {
            return true;
        }

        if (this.memData.village_land && this.memData.village_land[0] > 0 && isCrossVillage(this.memData.village_land[0])) {
            return true;
        }

        return false;
    },

    /** 根据玩家建号时间获取签到数据 */
    // checkAndResetSign: function () {
    //     var user = this.user;
    //     var sign = user.sign;
    //     var createDate = getGameDate(user.info.create);
    //     var today = getGameDate();
    //     var createDiffDay = common.getDateDiff(createDate, today);
    //     var signDiffDay = common.getDateDiff(sign.day, today);
    //     var resetDiffDay = common.getDateDiff(sign.last_reset_date, today);
    //     // 检查是否需要刷新本轮奖励(配置版本变化, 本轮签到结束都需要重置本轮签到奖励)
    //     if ((sign.version != conf_mgr.gConfVersion.signInReset) || (createDiffDay % 7 < resetDiffDay)) {            // 重置本轮签到奖励
    //         sign.round_rewards = [];
    //         var round2len = Object.keys(conf_mgr.gConfSign[2]).max();
    //         if (createDiffDay >= round2len) {                // 无限循环签到配置的第一波奖励
    //             for (var i = 1; i <= 7; i++) {
    //                 sign.round_rewards.push(conf_mgr.gConfSign[1][i]['reward']);
    //             }
    //         } else {                // 按签到配置的第2波奖励发放
    //             var startSortId = createDiffDay - createDiffDay % 7 + 1;
    //             var endSortId = startSortId + 7;
    //             for (var i = startSortId; i < endSortId; i++) {
    //                 sign.round_rewards.push(conf_mgr.gConfSign[2][i]['reward']);
    //             }
    //         }
    //         sign.last_reset_date = today;
    //         sign.version = conf_mgr.gConfVersion.signInReset;
    //         this.markDirty('sign.last_reset_date');
    //         this.markDirty('sign.round_rewards');
    //         this.markDirty('sign.version');
    //     }

    //     if (createDiffDay % 7 < signDiffDay) {            // 检查是否需要重置签到次数(距离上次签到已过7天，本轮签到结束都需要重置签到次数)
    //         sign.count = 0;
    //         this.markDirty('sign.count');
    //     }
    // },

    // ----------------------------  ↓↓↓ 礼包活动 ↓↓↓  ----------------------------------
    // updateGiftBags: function () {
    //     this.cleanInvalidGiftBags();
    //     this.checkTriggerGiftBags();
    // },

    /** 清理无效的礼包和过期的礼包 */
    // cleanInvalidGiftBags: function () {
    //     var user = this.user;
    //     var today = getGameDate();
    //     var gift_bag = user.activity.gift_bag;
    //     var giftBagIds = Object.keys(gift_bag);
    //     for (var i = 0; i < giftBagIds.length; i++) {            // 先清理掉被删掉的礼包数据和过期的礼包数据
    //         var id = giftBagIds[i];
    //         var conf = conf_mgr.gConfGiftBag[id];            // 删除废弃配置相关数据
    //         if (!conf) {
    //             delete gift_bag[id];

    //             if (user.mark.visit_gift_bag) {
    //                 var index = user.mark.visit_gift_bag.indexOf(+id);
    //                 if (index >= 0) {
    //                     user.mark.visit_gift_bag.splice(index, 1);
    //                     this.markDirty('mark.visit_gift_bag');
    //                 }
    //             }

    //             continue;
    //         }

    //         if (conf.lifeTime == 0) { continue; }                // 删除过期礼包

    //         var triggerDate = getGameDate(gift_bag[id].time);
    //         var passDay = common.getDateDiff(today, triggerDate);
    //         if (passDay < conf.lifeTime) { continue; }
    //         delete gift_bag[id];

    //         if (!user.mark.visit_gift_bag) { continue; }

    //         var index = user.mark.visit_gift_bag.indexOf(+id);
    //         if (index >= 0) {
    //             user.mark.visit_gift_bag.splice(index, 1);
    //             this.markDirty('mark.visit_gift_bag');
    //         }
    //     }
    //     this.markDirty('activity.gift_bag');
    // },

    /** 检测时间相关礼包的触发 */
    // checkTriggerGiftBags: function () {
    //     var user = this.user;
    //     var curTime = common.getTime();
    //     var today = getGameDate();
    //     for (var id in conf_mgr.gConfGiftBag) {
    //         var conf = conf_mgr.gConfGiftBag[id];
    //         if (conf.onoff <= 0) { continue; }
    //         var triggerValStr = String(conf.triggerVal);
    //         var triggerValArr = triggerValStr.split(':');
    //         var triggerTime = 0;
    //         if (conf.triggerCondition == 'fixedTime') {
    //             var triggerDate = new Date(triggerValArr[0], Number(triggerValArr[1]) - 1, triggerValArr[2]);
    //             triggerTime = triggerDate.getStamp() + conf_mgr.gConfGlobal.resetHour * 3600;
    //         } else if (conf.triggerCondition == 'gameDay') {
    //             var day = Number(triggerValArr[0]) || 1;
    //             var dayOffset = day > 0 ? day - 1 : 0;
    //             triggerTime = common.GLOBAL_SERVER_INFO_DICT.serverStartTime + dayOffset * 86400;
    //         } else if (conf.triggerCondition == 'loginDay') {
    //             var day = Number(triggerValArr[0]) || 1;
    //             var dayOffset = day > 0 ? day - 1 : 0;
    //             triggerTime = this.user.info.create + dayOffset * 86400;
    //         } else if (conf.triggerCondition == 'yearLoop') {
    //             var year = Math.floor(today / 10000);
    //             var triggerDate = new Date(year, Number(triggerValArr[0]) - 1, triggerValArr[1]);
    //             triggerTime = triggerDate.getStamp() + conf_mgr.gConfGlobal.resetHour * 3600;
    //         } else if (conf.triggerCondition == 'monthLoop') {
    //             var day = Number(triggerValArr[0]) || 1;
    //             var dayOffset = day > 0 ? day - 1 : 0;
    //             triggerTime = getMonthResetTime() + dayOffset * 86400;
    //         } else if (conf.triggerCondition == 'weekLoop') {
    //             var day = Number(triggerValArr[0]) || 1;
    //             var dayOffset = day > 0 ? day - 1 : 0;
    //             triggerTime = getWeekResetTime() + dayOffset * 86400;
    //         } else if (conf.triggerCondition == 'dayLoop') {
    //             triggerTime = common.getTime(today) + conf_mgr.gConfGlobal.resetHour * 3600;
    //         } else {                // 不支持的类型
    //             continue;
    //         }
    //         if (triggerTime <= 0) continue;

    //         var triggerGameDate = getGameDate(triggerTime);            // 没到触发日期
    //         if (triggerGameDate > today) continue;

    //         if (conf.lifeTime != 0) {                // 限时礼包检测是否过期
    //             var passDay = common.getDateDiff(today, triggerGameDate);
    //             if (passDay >= conf.lifeTime) continue;
    //         }

    //         var triggerLimit = conf.triggerLimit;
    //         if (triggerLimit && triggerLimit != 0) {
    //             var limitValArr = String(triggerLimit).split('.');
    //             if (limitValArr.length > 0) {
    //                 if (limitValArr[0] == 'gameday') {
    //                     var limitDay = parseInt(limitValArr[1]) || 0;
    //                     var today = getGameDate();
    //                     var passDay = common.getDateDiff(today, common.GLOBAL_SERVER_INFO_DICT.serverStartDate);
    //                     if ((limitDay - 1) > passDay) {
    //                         continue;
    //                     }
    //                 }
    //             }
    //         }

    //         var gift_bag = this.user.activity.gift_bag;
    //         if (gift_bag[id] && gift_bag[id].time == triggerTime) { continue; }            // 已经触发过了
    //         if (!gift_bag[id]) {                // 初始化礼包数据
    //             gift_bag[id] = {};
    //         }
    //         gift_bag[id].time = triggerTime;
    //         gift_bag[id].sell_out_time = 0;
    //         gift_bag[id].buy_count = 0;
    //         this.markDirty(util.format('activity.gift_bag.%d', id));
    //     }
    // },

    // reset_gift_bag: function () {
    //     this.user.activity.gift_bag = {};
    //     this.checkTriggerGiftBags();
    // },

    // ----------------------------   ↑↑↑ 礼包活动 ↑↑↑ ----------------------------------


    // 检测属性
    check_attrs: function (attrs) {
        return true;

        // todo
        if (!attrs) {
            return false
        }

        for (var i in this.user.pos) {

            var hero = this.user.pos[i];
            if (!hero.rid) {
                continue;
            }

            var client_attr = attrs[i - 1];
            if (!client_attr) {
                return false;
            }

            for (var x = 0; x < 29; x++) {
                DEBUG(`attr ${x} is:  ${hero.attr[x + 1]}, ${client_attr[x]}, ${hero.attr[x + 1] == client_attr[x]}`)
                if (client_attr[x] > (hero.attr[x + 1]) * 1.1) {
                    return false;
                }
            }
        }

        return true
    },

    wake_dragon: function (dragonId) {
        let dragon = this.user.dragon;

        if (dragonId < 0) {
            return;
        }

        if (dragon[dragonId]) {
            return;
        }

        dragon[dragonId] = {
            level: 1,
            slot: {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0,
            },
        };

        this.markDirty('dragon.' + dragonId);
        this.markFightForceChangedAll();
    },

    exit: function (callback) {
        for (var tKey in logic) {
            var tLogicMod = logic[tKey];
            if (!tLogicMod) { continue; }
            tLogicMod.player_exit && tLogicMod.player_exit(this);
        }
        player.save(true, callback);
    }
};

exports.Player = Player;