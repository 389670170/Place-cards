"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fight_utils_1 = require("./fight_utils");
var fight_conf_1 = require("./fight_conf");
var clone_1 = __importDefault(require("clone"));
/** 角色位置信息 */
var FightPos = /** @class */ (function () {
    function FightPos() {
        /** 队伍id */
        this.team_id = "";
        /** 队伍中的位置 */
        this.team_pos = 0;
    }
    return FightPos;
}());
exports.FightPos = FightPos;
/** 战斗角色信息 */
var FightRole = /** @class */ (function () {
    /**
     * 战斗成员信息
     * @param attr
     */
    function FightRole(team_id, team_pos, attr) {
        /**  英雄模板ID */
        this.id = 0;
        /** 队伍id */
        this.team_id = "";
        /** 角色在队伍中位置 */
        this.team_pos = -1;
        /**  英雄等级 */
        this.level = 0;
        /**  战斗力 */
        this.fightForce = 0;
        /** 进入战斗时的属性 */
        this.base_attr = new fight_conf_1.AttrDict();
        /** BUFF当前增加属性 */
        this._buff_attr = new fight_conf_1.AttrDict();
        /** 当前生命 */
        this._now_hp = 0;
        /** 当前怒气 */
        this._now_mp = 0;
        /** 角色已经行动过的轮数 */
        this._round = 0;
        /** 当前buff列表  {[buff_id:buff的id]:{round:剩余回合数 ,count:叠加层数}}*/
        this.buff_list = {};
        /**  技能组信息 */
        this.skill_group = null;
        /** 技能对应等级 */
        this.skill_level_dict = {};
        /** 重生信息 */
        this.reborn = null;
        // /** 战斗状态 */
        // public statusArr: {
        //     /** 英雄的状态（32个状态位）：1<<0：死亡、1<<1：魅惑、1<<2：睡眠、 */
        //     0: number,
        //     /** 防守方击退位置(-1为不变，其他为具体位置) */
        //     1: number,
        //     /** 防守方本次被攻击后剩余血量 */
        //     2: number,
        //     /** 防守方本次被攻击后所受伤害 */
        //     3: number,
        //     /** 防守方本次被攻击后剩余士气 */
        //     4: number,
        //     /** 防守方的状态：2：闪避、 3：暴击、 4：格挡、 5：反弹  6、免疫  7、直接斩杀   */
        //     5: number,
        //     /** 本次防守方实际变化的血量(扣血为负数。比如最后一击，扣多少血就死掉。这个跟前端血条显示相关) */
        //     6: number,
        //     /** 攻击方吸血  0，为不吸血，非0为吸血（如果受到伤害 先 -50 在 吸血20 最后受30伤） */
        //     7: number,
        // } = {
        //         0: 0,
        //         1: 0,
        //         2: 0,
        //         3: 0,
        //         4: 0,
        //         5: 0,
        //         6: 0,
        //         7: 0
        //     };
        // public copyStatusArr() {
        //     return {
        //         1: this.statusArr[1],
        //         2: this.statusArr[2],
        //         3: this.statusArr[3],
        //         4: this.statusArr[4],
        //         5: this.statusArr[5],
        //         6: this.statusArr[6],
        //         7: this.statusArr[7],
        //     }
        // }
        /** 觉醒等级 */
        this.awake = 0;
        // /** 阵营 */
        // public camp: number = Camp.Default;
        /** 死亡次数 */
        this.deadTimes = 0;
        /** 技能释放次数 */
        this.skillTimes = 0;
        /** 等待添加的BUFF */
        this.pendBufs = [];
        this._temp_now_attr = null;
        this.team_id = team_id;
        this.team_pos = team_pos; // 角色在队伍中位置
        this._round = 0; // 当前回合数
        this.deadTimes = 0; // 死亡次数
        this.skillTimes = 0; // 技能释放次数
        this.pendBufs = []; // 等待添加的BUFF
        this.deadTimes = 0;
        this.skillTimes = 0;
        this.base_attr = attr;
        this._now_hp = this.now_attr[fight_utils_1.AttributeType.HP];
    }
    Object.defineProperty(FightRole.prototype, "fight_pos", {
        /** 获取在战报中应该处于的位置 */
        get: function () {
            return { team_id: this.team_id, team_pos: this.team_pos };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FightRole.prototype, "round", {
        /** 获取角色当前经过的回合数 */
        get: function () {
            var tDelBuffIDList = [];
            for (var tKey in this.buff_list) {
                var tBuffID = Number(tKey);
                var tBriefBuffInfo = this.buff_list[tKey];
                if (tBriefBuffInfo) { // 回合数增加 buff的剩余回合数减1
                    tBriefBuffInfo.count = tBriefBuffInfo.count - 1;
                }
                if (!tBriefBuffInfo || tBriefBuffInfo.count <= 0) {
                    tDelBuffIDList.push(tBuffID);
                }
            }
            for (var i = 0; i < tDelBuffIDList.length; i++) {
                delete this.buff_list[tDelBuffIDList[i]];
            }
            this.refBuffAttr();
            return this._round;
        },
        set: function (value) {
            this._round = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FightRole.prototype, "now_hp", {
        /** 当前生命值 */
        get: function () {
            return this._now_hp;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FightRole.prototype, "max_hp", {
        /** 最大生命值 */
        get: function () {
            this._buff_attr = this._buff_attr || {};
            return (this.base_attr[fight_utils_1.AttributeType.HP]) + (this._buff_attr[fight_utils_1.AttributeType.HP] || 0);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FightRole.prototype, "now_mp", {
        /** 当前怒气值 */
        get: function () {
            return this._now_mp;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FightRole.prototype, "max_mp", {
        /** 最大怒气值 */
        get: function () {
            this._buff_attr = this._buff_attr || {};
            return (this.base_attr[fight_utils_1.AttributeType.ANGRY]) + (this._buff_attr[fight_utils_1.AttributeType.ANGRY] || 0);
        },
        enumerable: true,
        configurable: true
    });
    /** 重置当前属性 */
    FightRole.prototype.resetTempNowAttr = function () {
        this._temp_now_attr = null;
        return true;
    };
    Object.defineProperty(FightRole.prototype, "now_attr", {
        /** 当前的buff与基本属性的总和 */
        get: function () {
            if (this._temp_now_attr) {
                return this._temp_now_attr;
            }
            this._buff_attr = this._buff_attr || {};
            this._temp_now_attr = new fight_conf_1.AttrDict();
            var tAttrTypeObj = fight_utils_1.AttributeType;
            for (var tKey in fight_utils_1.AttributeType) {
                var tAttributeID = tAttrTypeObj[tKey];
                this._temp_now_attr[tAttributeID] = (this.base_attr[tAttributeID] || 0) + (this._buff_attr[tAttributeID] || 0);
            }
            return this._temp_now_attr;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * 从玩家信息获取战斗成员信息
     * @param team_id       队伍id
     * @param team_pos           站位
     * @param role          角色信息
     * @param roleConf      角色配置
     * @param attr          各功能提供属性（不包含技能的)
     * @param fight_force   角色战斗力
     */
    FightRole.initFromRole = function (team_id, team_pos, role, roleConf, attr, fight_force) {
        var tRoleData = new FightRole(team_id, team_pos, attr);
        var power = attr.power || 0;
        tRoleData.id = role.rid; // 英雄ID
        tRoleData.level = role.level; // 英雄等级
        tRoleData.fightForce = fight_force; // 战斗力
        tRoleData.buff_list = {}; // 技能buff列表
        tRoleData.awake = role.awake; // 觉醒等级
        var tSkillGroup = fight_conf_1.FightConf.get_skill_group(roleConf.skillGroupId);
        if (tSkillGroup) {
            tRoleData.skill_group = clone_1.default(tSkillGroup);
            tRoleData.skill_level_dict = {};
        }
        return tRoleData;
    };
    ;
    // function initFromMonster (pos, confMonster, attr) {
    //     objectForEach(gRoleAttrNameMap, function (attrName, confName) {
    //         if (!attr.hasOwnProperty(attrName)) {
    //             attr[attrName] = confMonster[confName] || 0;
    //         }
    //     });
    //     let health = Math.max(1, attr.health);
    //     let power = (attr.hasOwnProperty("attr") ? attr.power : confMonster.Power) || 0;
    //     let soldierKind = confMonster.Soldier;
    //     let camp = confMonster.Camp || 0;
    //     let skill = attr.skill || confMonster.Skill;
    //     let skillLevel = attr.skill_levels ? attr.skill_levels[skill] : confMonster.SkillLevel;
    //     id = confMonster.Id;                       //英雄ID
    //     xp = 0;                                     // 经验
    //     level = attr.level || confMonster.Level;  // 英雄等级
    //     soldierLevel = attr.soldier_level || confMonster.SoldierLevel;       // 兵种等级
    //     fightForce = attr.fight_force || confMonster.FightForce;            // 战斗力
    //     attack = attr.attack;                   // 攻击/谋略
    //     defence = attr.defence;                 // 武防
    //     mdefence = attr.mdefence;               // 魔防
    //     baseAttack = attr.attack;                    // 基础攻击
    //     baseDefence = attr.defence;             // 基础武防
    //     baseMdefence = attr.mdefence;           // 基础魔防
    //     block = attr.block;                     // 格挡
    //     fortitude = attr.fortitude;             // 刚毅
    //     hit = attr.hit;                         // 命中
    //     unblock = attr.unblock;                 // 破招
    //     critDamage = attr.critdamage;           // 暴击
    //     miss = attr.miss;                       // 闪避
    //     health = health;                        // 血量
    //     initHealth = health;                    // 未开战血量
    //     skill = skill;                          // 主动技能ID
    //     skillLevels = {};                       // 技能等级对象{id:level}
    //     pos = pos;                              // 英雄位置
    //     soldierKind = soldierKind;             // 兵种
    //     round = 0;                              // 当前回合数
    //     statusArr = [0, -1, health, 0, power, 0, 0]; // 战斗状态
    //     bufs = {};                            // 英雄战斗时的技能buf
    //     skills = {};                            // 英雄初始化时的技能
    //     initHit = 0;                               // 初始命中几率
    //     initMiss = 0;                              // 初始闪避几率
    //     initBlock = 0;                            // 初始格挡几率
    //     initUnblock = 0;                           // 初始破招几率
    //     initCritDamage = 0;                       // 初始暴击几率
    //     initFortitude = 0;                        // 初始刚毅
    //     godblock = 0;                            // 下面都是神器属性，怪物全是0为了在战斗中好计算
    //     godcritvalue = 0;
    //     godmdefence = 0;
    //     goddefence = 0;
    //     godblockpower = 0;
    //     godrehurt = confMonster.GodRehurt;              // 加入怪物反伤属性
    //     godsuckblood = 0;
    //     passiveSkills = []; //被动技能对象数组
    //     exBufs = {}; //额外的BUFF属性(需要展示)
    //     camp = camp; //阵营
    //     deadTimes = 0; //死亡次数
    //     skillTimes = 0; //技能释放次数
    //     pendBufs = []; //等待添加的BUFF
    //     canBeKilled = confMonster.CanBeKilled || 0;
    //     let skillEffect = gConfSkillEffect[soldierKind][skill][skillLevel];
    //     skillLevels[skill] = skillLevel;
    //     skills[skillEffect['Effect']] = {
    //         'param': skillEffect['Param'],
    //         'damage': skillEffect['Damage'],
    //         'round': skillEffect['Round'],
    //         'isSelf': skillEffect['IsSelf'],
    //         'isActive': (skillEffect['Type'] == 1 ? 1 : 0), //是否主动技能
    //     };
    //     initPassiveSkills(confMonster.PassiveSkills);
    // };
    /** 是否反转目标 */
    FightRole.prototype.isTargetReversal = function () {
        return false;
    };
    Object.defineProperty(FightRole.prototype, "is_dead", {
        /** 是否死亡 */
        get: function () {
            return (this.now_hp <= 0);
        },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(FightRole.prototype, "can_action", {
        /** 是否可行动 */
        get: function () {
            for (var tKey in this.buff_list) {
                var tBuffID = Number(tKey);
                // let tBuffInfo: { round: number, count: number } = this.buff_list[tBuffID];
                var tBuffInfo = fight_conf_1.FightConf.get_buff_info(tBuffID);
                if (!tBuffInfo) {
                    continue;
                }
                if (tBuffInfo.banMove) {
                    continue;
                }
                return false;
            }
            return true;
        },
        enumerable: true,
        configurable: true
    });
    /** 通过类型驱散buff */
    FightRole.prototype.dispelBuffByType = function (type) {
        var tRemoveBuffList = [];
        for (var tKey in this.buff_list) {
            var tBuffID = Number(tKey);
            // let tBuffInfo: { round: number, count: number } = this.buff_list[tBuffID];
            var tBuffInfo = fight_conf_1.FightConf.get_buff_info(tBuffID);
            if (!tBuffInfo) {
                continue;
            }
            if (tBuffInfo.cannotDispel) {
                continue;
            }
            if (tBuffInfo.dirType == type || type == fight_utils_1.DispelType.ALL) {
                tRemoveBuffList.push(tBuffID);
            }
        }
    };
    /** 添加buff列表 */
    FightRole.prototype.addBuffList = function (buff_list) {
        if (this.is_dead) {
            return;
        }
        for (var i = 0; i < buff_list.length; i++) {
            var tBriefBuffInfo = buff_list[i];
            this.buff_list[tBriefBuffInfo.buff_id] = {
                round: tBriefBuffInfo.round,
                count: 1
            };
        }
        this.refBuffAttr();
    };
    /** 移除buff列表 */
    FightRole.prototype.delBuffList = function (buff_list) {
        for (var i = 0; i < buff_list.length; i++) {
            var tBuffID = buff_list[i];
            delete this.buff_list[tBuffID];
        }
        this.refBuffAttr();
    };
    /** 刷新buff属性效果 */
    FightRole.prototype.refBuffAttr = function () {
        this._buff_attr = new fight_conf_1.AttrDict();
        for (var tKey in this.buff_list) {
            var tBuffID = Number(tKey);
            var tBuffInfo = fight_conf_1.FightConf.get_buff_info(tBuffID);
            if (!tBuffInfo) {
                continue;
            }
            for (var i = 0; i < tBuffInfo.attributeId.length; i++) {
                this._buff_attr[tBuffInfo.attributeId[i]] = (this._buff_attr[tBuffInfo.attributeId[i]] || 0) + (tBuffInfo.attributeValue[i] || 0);
            }
        }
    };
    /**
     * 增加/减少士气
     * @param value
     * @returns {value:传入值 ,now:变化后剩余值 ,damage:实际变化值}
     */
    FightRole.prototype.addMP = function (value) {
        if (this.is_dead) {
            return { value: 0, now: 0, damage: 0 };
        }
        if (!value) {
            return { value: 0, now: 0, damage: 0 };
        }
        var damage = this._now_mp;
        this._now_mp = this._now_mp + value;
        if (this._now_mp > this.max_mp) { // 超过最大值
            damage = this.max_mp - damage;
            this._now_mp = this.max_mp;
        }
        else if (this._now_mp < 0) { // 低于最小值
            this._now_mp = 0;
        }
        else { // 中间值
            damage = value;
        }
        return { value: value, now: this._now_mp, damage: damage };
    };
    ;
    /**
     * 增加/减少武将血量
     * @param value
     * @returns {value:传入值 ,now:变化后剩余值 ,damage:实际变化值}
     */
    FightRole.prototype.addHP = function (value) {
        if (this.is_dead) {
            return { value: 0, now: 0, damage: 0 };
        }
        if (!value) {
            return { value: 0, now: 0, damage: 0 };
        }
        var damage = this._now_hp;
        this._now_hp = this._now_hp + value;
        if (this._now_hp > this.max_hp) { // 超过最大值
            damage = this.max_hp - damage;
            this._now_hp = this.max_hp;
        }
        else if (this._now_hp < 0) { // 低于最小值
            this._now_hp = 0;
        }
        else { // 中间值
            damage = value;
        }
        return { value: value, now: this._now_hp, damage: damage };
    };
    ;
    return FightRole;
}());
exports.FightRole = FightRole;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlnaHRfcm9sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2NvZGUvZmlnaHQvZmlnaHRfcm9sZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDZDQUErRjtBQUUvRiwyQ0FBMkc7QUFDM0csZ0RBQTBCO0FBRTFCLGFBQWE7QUFDYjtJQUFBO1FBQ0ksV0FBVztRQUNKLFlBQU8sR0FBVyxFQUFFLENBQUM7UUFDNUIsYUFBYTtRQUNOLGFBQVEsR0FBVyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUFELGVBQUM7QUFBRCxDQUFDLEFBTEQsSUFLQztBQUxZLDRCQUFRO0FBT3JCLGFBQWE7QUFDYjtJQTJGSTs7O09BR0c7SUFDSCxtQkFBWSxPQUFlLEVBQUUsUUFBZ0IsRUFBRSxJQUFjO1FBOUY3RCxjQUFjO1FBQ1AsT0FBRSxHQUFXLENBQUMsQ0FBQztRQUN0QixXQUFXO1FBQ0osWUFBTyxHQUFXLEVBQUUsQ0FBQztRQUM1QixlQUFlO1FBQ1IsYUFBUSxHQUFXLENBQUMsQ0FBQyxDQUFDO1FBQzdCLFlBQVk7UUFDTCxVQUFLLEdBQVcsQ0FBQyxDQUFDO1FBQ3pCLFdBQVc7UUFDSixlQUFVLEdBQVcsQ0FBQyxDQUFDO1FBQzlCLGVBQWU7UUFDTixjQUFTLEdBQWEsSUFBSSxxQkFBUSxFQUFFLENBQUM7UUFDOUMsaUJBQWlCO1FBQ1QsZUFBVSxHQUFhLElBQUkscUJBQVEsRUFBRSxDQUFDO1FBRTlDLFdBQVc7UUFDSCxZQUFPLEdBQVcsQ0FBQyxDQUFDO1FBQzVCLFdBQVc7UUFDSCxZQUFPLEdBQVcsQ0FBQyxDQUFDO1FBRTVCLGlCQUFpQjtRQUNULFdBQU0sR0FBVyxDQUFDLENBQUM7UUFFM0IsNkRBQTZEO1FBQ3RELGNBQVMsR0FBNEQsRUFBRSxDQUFDO1FBQy9FLGFBQWE7UUFDTixnQkFBVyxHQUFzQixJQUFJLENBQUM7UUFDN0MsYUFBYTtRQUNOLHFCQUFnQixHQUFtQyxFQUFFLENBQUM7UUFFN0QsV0FBVztRQUNKLFdBQU0sR0FBNkMsSUFBSSxDQUFDO1FBRS9ELGNBQWM7UUFDZCxzQkFBc0I7UUFDdEIsb0RBQW9EO1FBQ3BELGlCQUFpQjtRQUNqQixvQ0FBb0M7UUFDcEMsaUJBQWlCO1FBQ2pCLDJCQUEyQjtRQUMzQixpQkFBaUI7UUFDakIsMkJBQTJCO1FBQzNCLGlCQUFpQjtRQUNqQiwyQkFBMkI7UUFDM0IsaUJBQWlCO1FBQ2pCLDJEQUEyRDtRQUMzRCxpQkFBaUI7UUFDakIsNERBQTREO1FBQzVELGlCQUFpQjtRQUNqQiw2REFBNkQ7UUFDN0QsaUJBQWlCO1FBQ2pCLFFBQVE7UUFDUixnQkFBZ0I7UUFDaEIsZ0JBQWdCO1FBQ2hCLGdCQUFnQjtRQUNoQixnQkFBZ0I7UUFDaEIsZ0JBQWdCO1FBQ2hCLGdCQUFnQjtRQUNoQixnQkFBZ0I7UUFDaEIsZUFBZTtRQUNmLFNBQVM7UUFDVCwyQkFBMkI7UUFDM0IsZUFBZTtRQUNmLGdDQUFnQztRQUNoQyxnQ0FBZ0M7UUFDaEMsZ0NBQWdDO1FBQ2hDLGdDQUFnQztRQUNoQyxnQ0FBZ0M7UUFDaEMsZ0NBQWdDO1FBQ2hDLGdDQUFnQztRQUNoQyxRQUFRO1FBQ1IsSUFBSTtRQUVKLFdBQVc7UUFDSixVQUFLLEdBQVcsQ0FBQyxDQUFDO1FBRXpCLFlBQVk7UUFDWixzQ0FBc0M7UUFDdEMsV0FBVztRQUNKLGNBQVMsR0FBVyxDQUFDLENBQUM7UUFDN0IsYUFBYTtRQUNOLGVBQVUsR0FBVyxDQUFDLENBQUM7UUFDOUIsZ0JBQWdCO1FBQ1QsYUFBUSxHQUFrQyxFQUFFLENBQUM7UUF5RTVDLG1CQUFjLEdBQW9CLElBQUksQ0FBQztRQTdEM0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsQ0FBOEIsV0FBVztRQUNsRSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUF3QyxRQUFRO1FBQ2hFLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQW9DLE9BQU87UUFDOUQsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBbUMsU0FBUztRQUNoRSxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQyxDQUFvQyxZQUFZO1FBQ25FLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBRXRCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQywyQkFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFwQkQsc0JBQVcsZ0NBQVM7UUFEcEIsb0JBQW9CO2FBQ3BCO1lBQ0ksT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDOUQsQ0FBQzs7O09BQUE7SUFvQkQsc0JBQVcsNEJBQUs7UUFJaEIsbUJBQW1CO2FBQ25CO1lBQ0ksSUFBSSxjQUFjLEdBQWtCLEVBQUUsQ0FBQztZQUN2QyxLQUFLLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7Z0JBQzdCLElBQUksT0FBTyxHQUFXLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDbkMsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxjQUFjLEVBQUUsRUFBd0MscUJBQXFCO29CQUM3RSxjQUFjLENBQUMsS0FBSyxHQUFHLGNBQWMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO2lCQUNuRDtnQkFDRCxJQUFJLENBQUMsY0FBYyxJQUFJLGNBQWMsQ0FBQyxLQUFLLElBQUksQ0FBQyxFQUFFO29CQUM5QyxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUNoQzthQUNKO1lBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzVDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUM1QztZQUVELElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUVuQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDdkIsQ0FBQzthQXhCRCxVQUFpQixLQUFhO1lBQzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ3hCLENBQUM7OztPQUFBO0lBeUJELHNCQUFXLDZCQUFNO1FBRGpCLFlBQVk7YUFDWjtZQUNJLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN4QixDQUFDOzs7T0FBQTtJQUdELHNCQUFXLDZCQUFNO1FBRGpCLFlBQVk7YUFDWjtZQUNJLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsSUFBSSxFQUFFLENBQUM7WUFDeEMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsMkJBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQywyQkFBYSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3pGLENBQUM7OztPQUFBO0lBR0Qsc0JBQVcsNkJBQU07UUFEakIsWUFBWTthQUNaO1lBQ0ksT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3hCLENBQUM7OztPQUFBO0lBR0Qsc0JBQVcsNkJBQU07UUFEakIsWUFBWTthQUNaO1lBQ0ksSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQztZQUN4QyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQywyQkFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLDJCQUFhLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDL0YsQ0FBQzs7O09BQUE7SUFHRCxhQUFhO0lBQ04sb0NBQWdCLEdBQXZCO1FBQ0ksSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFDM0IsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELHNCQUFXLCtCQUFRO1FBRG5CLHNCQUFzQjthQUN0QjtZQUNJLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtnQkFBRSxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7YUFBRTtZQUV4RCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLElBQUksRUFBRSxDQUFDO1lBRXhDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxxQkFBUSxFQUFFLENBQUM7WUFDckMsSUFBSSxZQUFZLEdBQVEsMkJBQWEsQ0FBQTtZQUNyQyxLQUFLLElBQUksSUFBSSxJQUFJLDJCQUFhLEVBQUU7Z0JBQzVCLElBQUksWUFBWSxHQUFXLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ2xIO1lBQ0QsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQy9CLENBQUM7OztPQUFBO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDVyxzQkFBWSxHQUExQixVQUEyQixPQUFlLEVBQUUsUUFBZ0IsRUFBRSxJQUFpQixFQUFFLFFBQWtCLEVBQUUsSUFBYyxFQUFFLFdBQW1CO1FBQ3BJLElBQUksU0FBUyxHQUFHLElBQUksU0FBUyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdkQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUM7UUFFNUIsU0FBUyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQW9DLE9BQU87UUFDbkUsU0FBUyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQStCLE9BQU87UUFFbkUsU0FBUyxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUMsQ0FBeUIsTUFBTTtRQUNsRSxTQUFTLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxDQUFtQyxXQUFXO1FBQ3ZFLFNBQVMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUErQixPQUFPO1FBRW5FLElBQUksV0FBVyxHQUFHLHNCQUFTLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNuRSxJQUFJLFdBQVcsRUFBRTtZQUNiLFNBQVMsQ0FBQyxXQUFXLEdBQUcsZUFBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzNDLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7U0FDbkM7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNyQixDQUFDO0lBQUEsQ0FBQztJQUVGLHNEQUFzRDtJQUN0RCxzRUFBc0U7SUFDdEUsZ0RBQWdEO0lBQ2hELDJEQUEyRDtJQUMzRCxZQUFZO0lBQ1osVUFBVTtJQUVWLDZDQUE2QztJQUM3Qyx1RkFBdUY7SUFFdkYsNkNBQTZDO0lBQzdDLHdDQUF3QztJQUN4QyxtREFBbUQ7SUFDbkQsOEZBQThGO0lBRTlGLHdEQUF3RDtJQUN4RCx3REFBd0Q7SUFDeEQsd0RBQXdEO0lBQ3hELG1GQUFtRjtJQUNuRixpRkFBaUY7SUFDakYsdURBQXVEO0lBQ3ZELG9EQUFvRDtJQUNwRCxvREFBb0Q7SUFDcEQsMkRBQTJEO0lBQzNELHNEQUFzRDtJQUN0RCxzREFBc0Q7SUFDdEQsb0RBQW9EO0lBQ3BELG9EQUFvRDtJQUNwRCxvREFBb0Q7SUFDcEQsb0RBQW9EO0lBQ3BELG9EQUFvRDtJQUNwRCxvREFBb0Q7SUFDcEQsb0RBQW9EO0lBQ3BELHVEQUF1RDtJQUN2RCx3REFBd0Q7SUFDeEQsa0VBQWtFO0lBQ2xFLHNEQUFzRDtJQUN0RCxtREFBbUQ7SUFDbkQsdURBQXVEO0lBQ3ZELDJEQUEyRDtJQUMzRCwyREFBMkQ7SUFDM0QsMkRBQTJEO0lBQzNELDJEQUEyRDtJQUMzRCwyREFBMkQ7SUFDM0QsMERBQTBEO0lBQzFELDJEQUEyRDtJQUMzRCwwREFBMEQ7SUFDMUQsd0RBQXdEO0lBQ3hELDBFQUEwRTtJQUMxRSx3QkFBd0I7SUFDeEIsdUJBQXVCO0lBQ3ZCLHNCQUFzQjtJQUN0Qix5QkFBeUI7SUFDekIsa0VBQWtFO0lBQ2xFLHdCQUF3QjtJQUN4QixxQ0FBcUM7SUFDckMscUNBQXFDO0lBQ3JDLHdCQUF3QjtJQUN4Qiw0QkFBNEI7SUFDNUIsK0JBQStCO0lBQy9CLGlDQUFpQztJQUNqQyxrREFBa0Q7SUFFbEQsMEVBQTBFO0lBQzFFLHVDQUF1QztJQUN2Qyx3Q0FBd0M7SUFDeEMseUNBQXlDO0lBQ3pDLDJDQUEyQztJQUMzQyx5Q0FBeUM7SUFDekMsMkNBQTJDO0lBQzNDLG1FQUFtRTtJQUNuRSxTQUFTO0lBRVQsb0RBQW9EO0lBQ3BELEtBQUs7SUFFTCxhQUFhO0lBQ04sb0NBQWdCLEdBQXZCO1FBQ0ksT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUdELHNCQUFXLDhCQUFPO1FBRGxCLFdBQVc7YUFDWDtZQUNJLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzlCLENBQUM7OztPQUFBO0lBQUEsQ0FBQztJQUdGLHNCQUFXLGlDQUFVO1FBRHJCLFlBQVk7YUFDWjtZQUNJLEtBQUssSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtnQkFDN0IsSUFBSSxPQUFPLEdBQVcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNuQyw2RUFBNkU7Z0JBQzdFLElBQUksU0FBUyxHQUFvQixzQkFBUyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbEUsSUFBSSxDQUFDLFNBQVMsRUFBRTtvQkFBRSxTQUFTO2lCQUFFO2dCQUM3QixJQUFJLFNBQVMsQ0FBQyxPQUFPLEVBQUU7b0JBQUUsU0FBUztpQkFBRTtnQkFDcEMsT0FBTyxLQUFLLENBQUM7YUFDaEI7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDOzs7T0FBQTtJQUVELGlCQUFpQjtJQUNWLG9DQUFnQixHQUF2QixVQUF3QixJQUFZO1FBQ2hDLElBQUksZUFBZSxHQUFrQixFQUFFLENBQUM7UUFDeEMsS0FBSyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQzdCLElBQUksT0FBTyxHQUFXLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuQyw2RUFBNkU7WUFDN0UsSUFBSSxTQUFTLEdBQW9CLHNCQUFTLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xFLElBQUksQ0FBQyxTQUFTLEVBQUU7Z0JBQUUsU0FBUzthQUFFO1lBQzdCLElBQUksU0FBUyxDQUFDLFlBQVksRUFBRTtnQkFBRSxTQUFTO2FBQUU7WUFDekMsSUFBSSxTQUFTLENBQUMsT0FBTyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksd0JBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3JELGVBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDakM7U0FDSjtJQUNMLENBQUM7SUFFRCxlQUFlO0lBQ1IsK0JBQVcsR0FBbEIsVUFBbUIsU0FBb0Q7UUFDbkUsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQUUsT0FBTztTQUFFO1FBRTdCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3ZDLElBQUksY0FBYyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsR0FBRztnQkFDckMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxLQUFLO2dCQUMzQixLQUFLLEVBQUUsQ0FBQzthQUNYLENBQUE7U0FDSjtRQUVELElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUN2QixDQUFDO0lBRUQsZUFBZTtJQUNSLCtCQUFXLEdBQWxCLFVBQW1CLFNBQXdCO1FBQ3ZDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3ZDLElBQUksT0FBTyxHQUFXLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDbEM7UUFFRCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUVELGlCQUFpQjtJQUNULCtCQUFXLEdBQW5CO1FBQ0ksSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLHFCQUFRLEVBQUUsQ0FBQztRQUNqQyxLQUFLLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDN0IsSUFBSSxPQUFPLEdBQVcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25DLElBQUksU0FBUyxHQUFvQixzQkFBUyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNsRSxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUFFLFNBQVM7YUFBRTtZQUU3QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ25ELElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ3JJO1NBQ0o7SUFDTCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLHlCQUFLLEdBQVosVUFBYSxLQUFhO1FBQ3RCLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO1NBQUU7UUFDN0QsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO1NBQUU7UUFFdkQsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUMxQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBRXBDLElBQUksSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQWdELFFBQVE7WUFDcEYsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQzlCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztTQUM5QjthQUNJLElBQUksSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLEVBQUUsRUFBcUQsUUFBUTtZQUNwRixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztTQUNwQjthQUNJLEVBQTJFLE1BQU07WUFDbEYsTUFBTSxHQUFHLEtBQUssQ0FBQztTQUNsQjtRQUVELE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQztJQUMvRCxDQUFDO0lBQUEsQ0FBQztJQUVGOzs7O09BSUc7SUFDSSx5QkFBSyxHQUFaLFVBQWEsS0FBYTtRQUN0QixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQztTQUFFO1FBQzdELElBQUksQ0FBQyxLQUFLLEVBQUU7WUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQztTQUFFO1FBRXZELElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDMUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUVwQyxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFnRCxRQUFRO1lBQ3BGLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUM5QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7U0FDOUI7YUFDSSxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxFQUFFLEVBQXFELFFBQVE7WUFDcEYsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7U0FDcEI7YUFDSSxFQUEyRSxNQUFNO1lBQ2xGLE1BQU0sR0FBRyxLQUFLLENBQUM7U0FDbEI7UUFFRCxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUM7SUFDL0QsQ0FBQztJQUFBLENBQUM7SUFDTixnQkFBQztBQUFELENBQUMsQUEzWkQsSUEyWkM7QUEzWlksOEJBQVMifQ==