"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** BUF的替换方式 */
var BufReplace = /** @class */ (function () {
    function BufReplace() {
    }
    /**  默认(新BUF直接替换旧BUF) */
    BufReplace.DEFAULT = 0;
    /**  最大值值替换最小新 */
    BufReplace.MAX = 1;
    /**  BUF的值累加，回合数更新 */
    BufReplace.ACC = 2;
    return BufReplace;
}());
exports.BufReplace = BufReplace;
/** 所有BUF的定义 */
// export class SkillBufs {
//     public static Skill_Buffs: { [index: string]: SkillBuffInfo } = {
//         //BUFF名称: {status:影响状态, cover:[可选]覆盖的BUFF, replace:替换方式(0/1直接/比值), limit:[可选]最大值}
//         //acc   前缀一般是可累加的BUF
//         //dec   前缀一般是不可累加的DEBUFF
//         //add   前缀一般是不可累加的BUF
//         //前缀后面跟字母 e/r/c 的一般表示 长期的/百分比/有条件的
//         /** 反伤 */
//         rehurt: new SkillBuffInfo(0, [], BufReplace.ACC, 0),
//         /** 沉睡 */
//         sleep: new SkillBuffInfo(roleStatusMap.SLEEP, ['confuse'], BufReplace.DEFAULT, 0),
//         /** 沉睡 */
//         confuse: new SkillBuffInfo(roleStatusMap.CONFUSE, ['sleep'], BufReplace.DEFAULT, 0),
//         /** 提升攻击力 */
//         improveatk: new SkillBuffInfo(0, [], BufReplace.DEFAULT, 0),
//         /** 武力转化为物防，降低攻击力 */
//         dectransatk: new SkillBuffInfo(0, [], BufReplace.DEFAULT, 0),
//         /** 武力转化为物防，增加防御力 */
//         addtransdef: new SkillBuffInfo(0, [], BufReplace.DEFAULT, 0),
//         /** (禁怒)士气无法增加 */
//         nopower: new SkillBuffInfo(roleStatusMap.NOPOWER, [], BufReplace.DEFAULT, 0),
//         /** (沉默)无法施放技能，若士气超过400不会增加士气 */
//         noskill: new SkillBuffInfo(roleStatusMap.NOSKILL, [], BufReplace.DEFAULT, 0),
//         /** (缴械)降低攻击力降低百分比 */
//         decrattack: new SkillBuffInfo(roleStatusMap.DECRATTACK, [], BufReplace.MAX, 0),
//         /** (破甲)防御值降低百分比 */
//         decrdefence: new SkillBuffInfo(roleStatusMap.DECRDEFENCE, [], BufReplace.MAX, 0),
//         /** (蓄力)攻击力提升百分比(可累加) */
//         accrattack: new SkillBuffInfo(roleStatusMap.ACCRATTACK, [], BufReplace.ACC, 0),
//         /** 攻击力提升百分比 */
//         addrattack: new SkillBuffInfo(roleStatusMap.ADDRATTACK, [], BufReplace.MAX, 0),
//         /** 闪避率提升百分比 */
//         addrmiss: new SkillBuffInfo(roleStatusMap.ADDRMISS, [], BufReplace.MAX, 0),
//         /** 格挡率提升百分比 */
//         addrblock: new SkillBuffInfo(roleStatusMap.ADDRBLOCK, [], BufReplace.MAX, 0),
//         /** 暴击率提升百分比 */
//         addrcrit: new SkillBuffInfo(roleStatusMap.ADDRCRIT, [], BufReplace.MAX, 0),
//         /** 长期提升攻击力百分比 */
//         accerattack: new SkillBuffInfo(0, [], BufReplace.ACC, 0),
//         /** 攻击伤害增加百分比(群攻技能为1/3) */
//         addrcdamage: new SkillBuffInfo(0, [], BufReplace.DEFAULT, 100),
//         /** 增加攻击力 */
//         addattack: new SkillBuffInfo(0, [], BufReplace.DEFAULT, 0),
//     }
// }
// export class SkillBufs {
//     [index: string]: SkillBuffInfo;
//     //BUFF名称: {status:影响状态, cover:[可选]覆盖的BUFF, replace:替换方式(0/1直接/比值), limit:[可选]最大值}
//     //acc   前缀一般是可累加的BUF
//     //dec   前缀一般是不可累加的DEBUFF
//     //add   前缀一般是不可累加的BUF
//     //前缀后面跟字母 e/r/c 的一般表示 长期的/百分比/有条件的
//     /** 反伤 */
//     static rehurt: SkillBuffInfo = new SkillBuffInfo(0, [], BufReplace.ACC, 0);
//     /** 沉睡 */
//     static sleep: SkillBuffInfo = new SkillBuffInfo(roleStatusMap.SLEEP, ['confuse'], BufReplace.DEFAULT, 0);
//     /** 沉睡 */
//     static confuse: SkillBuffInfo = new SkillBuffInfo(roleStatusMap.CONFUSE, ['sleep'], BufReplace.DEFAULT, 0);
//     /** 提升攻击力 */
//     static improveatk: SkillBuffInfo = new SkillBuffInfo(0, [], BufReplace.DEFAULT, 0);
//     /** 武力转化为物防，降低攻击力 */
//     static dectransatk: SkillBuffInfo = new SkillBuffInfo(0, [], BufReplace.DEFAULT, 0);
//     /** 武力转化为物防，增加防御力 */
//     static addtransdef: SkillBuffInfo = new SkillBuffInfo(0, [], BufReplace.DEFAULT, 0);
//     /** (禁怒)士气无法增加 */
//     static nopower: SkillBuffInfo = new SkillBuffInfo(roleStatusMap.NOPOWER, [], BufReplace.DEFAULT, 0);
//     /** (沉默)无法施放技能，若士气超过400不会增加士气 */
//     static noskill: SkillBuffInfo = new SkillBuffInfo(roleStatusMap.NOSKILL, [], BufReplace.DEFAULT, 0);
//     /** (缴械)降低攻击力降低百分比 */
//     static decrattack: SkillBuffInfo = new SkillBuffInfo(roleStatusMap.DECRATTACK, [], BufReplace.MAX, 0);
//     /** (破甲)防御值降低百分比 */
//     static decrdefence: SkillBuffInfo = new SkillBuffInfo(roleStatusMap.DECRDEFENCE, [], BufReplace.MAX, 0);
//     /** (蓄力)攻击力提升百分比(可累加) */
//     static accrattack: SkillBuffInfo = new SkillBuffInfo(roleStatusMap.ACCRATTACK, [], BufReplace.ACC, 0);
//     /** 攻击力提升百分比 */
//     static addrattack: SkillBuffInfo = new SkillBuffInfo(roleStatusMap.ADDRATTACK, [], BufReplace.MAX, 0);
//     /** 闪避率提升百分比 */
//     static addrmiss: SkillBuffInfo = new SkillBuffInfo(roleStatusMap.ADDRMISS, [], BufReplace.MAX, 0);
//     /** 格挡率提升百分比 */
//     static addrblock: SkillBuffInfo = new SkillBuffInfo(roleStatusMap.ADDRBLOCK, [], BufReplace.MAX, 0);
//     /** 暴击率提升百分比 */
//     static addrcrit: SkillBuffInfo = new SkillBuffInfo(roleStatusMap.ADDRCRIT, [], BufReplace.MAX, 0);
//     /** 长期提升攻击力百分比 */
//     static accerattack: SkillBuffInfo = new SkillBuffInfo(0, [], BufReplace.ACC, 0);
//     /** 攻击伤害增加百分比(群攻技能为1/3) */
//     static addrcdamage: SkillBuffInfo = new SkillBuffInfo(0, [], BufReplace.DEFAULT, 100);
//     /** 增加攻击力 */
//     static addattack: SkillBuffInfo = new SkillBuffInfo(0, [], BufReplace.DEFAULT, 0);
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlnaHRfYnVmZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2NvZGUvZmlnaHQvZmlnaHRfYnVmZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLGVBQWU7QUFDZjtJQUFBO0lBT0EsQ0FBQztJQU5HLHdCQUF3QjtJQUNqQixrQkFBTyxHQUFXLENBQUMsQ0FBQztJQUMzQixpQkFBaUI7SUFDVixjQUFHLEdBQVcsQ0FBQyxDQUFDO0lBQ3ZCLHFCQUFxQjtJQUNkLGNBQUcsR0FBVyxDQUFDLENBQUM7SUFDM0IsaUJBQUM7Q0FBQSxBQVBELElBT0M7QUFQWSxnQ0FBVTtBQVN2QixlQUFlO0FBQ2YsMkJBQTJCO0FBQzNCLHdFQUF3RTtBQUN4RSw0RkFBNEY7QUFDNUYsK0JBQStCO0FBQy9CLG1DQUFtQztBQUNuQyxnQ0FBZ0M7QUFDaEMsNkNBQTZDO0FBQzdDLG9CQUFvQjtBQUNwQiwrREFBK0Q7QUFDL0Qsb0JBQW9CO0FBQ3BCLDZGQUE2RjtBQUM3RixvQkFBb0I7QUFDcEIsK0ZBQStGO0FBQy9GLHVCQUF1QjtBQUN2Qix1RUFBdUU7QUFDdkUsK0JBQStCO0FBQy9CLHdFQUF3RTtBQUN4RSwrQkFBK0I7QUFDL0Isd0VBQXdFO0FBRXhFLDRCQUE0QjtBQUM1Qix3RkFBd0Y7QUFDeEYsMkNBQTJDO0FBQzNDLHdGQUF3RjtBQUN4RixnQ0FBZ0M7QUFDaEMsMEZBQTBGO0FBQzFGLDhCQUE4QjtBQUM5Qiw0RkFBNEY7QUFDNUYsbUNBQW1DO0FBQ25DLDBGQUEwRjtBQUMxRiwwQkFBMEI7QUFDMUIsMEZBQTBGO0FBQzFGLDBCQUEwQjtBQUMxQixzRkFBc0Y7QUFDdEYsMEJBQTBCO0FBQzFCLHdGQUF3RjtBQUN4RiwwQkFBMEI7QUFDMUIsc0ZBQXNGO0FBRXRGLDRCQUE0QjtBQUM1QixvRUFBb0U7QUFDcEUscUNBQXFDO0FBQ3JDLDBFQUEwRTtBQUMxRSx1QkFBdUI7QUFDdkIsc0VBQXNFO0FBQ3RFLFFBQVE7QUFDUixJQUFJO0FBQ0osMkJBQTJCO0FBQzNCLHNDQUFzQztBQUN0Qyx3RkFBd0Y7QUFDeEYsMkJBQTJCO0FBQzNCLCtCQUErQjtBQUMvQiw0QkFBNEI7QUFDNUIseUNBQXlDO0FBQ3pDLGdCQUFnQjtBQUNoQixrRkFBa0Y7QUFDbEYsZ0JBQWdCO0FBQ2hCLGdIQUFnSDtBQUNoSCxnQkFBZ0I7QUFDaEIsa0hBQWtIO0FBQ2xILG1CQUFtQjtBQUNuQiwwRkFBMEY7QUFDMUYsMkJBQTJCO0FBQzNCLDJGQUEyRjtBQUMzRiwyQkFBMkI7QUFDM0IsMkZBQTJGO0FBRTNGLHdCQUF3QjtBQUN4QiwyR0FBMkc7QUFDM0csdUNBQXVDO0FBQ3ZDLDJHQUEyRztBQUMzRyw0QkFBNEI7QUFDNUIsNkdBQTZHO0FBQzdHLDBCQUEwQjtBQUMxQiwrR0FBK0c7QUFDL0csK0JBQStCO0FBQy9CLDZHQUE2RztBQUM3RyxzQkFBc0I7QUFDdEIsNkdBQTZHO0FBQzdHLHNCQUFzQjtBQUN0Qix5R0FBeUc7QUFDekcsc0JBQXNCO0FBQ3RCLDJHQUEyRztBQUMzRyxzQkFBc0I7QUFDdEIseUdBQXlHO0FBRXpHLHdCQUF3QjtBQUN4Qix1RkFBdUY7QUFDdkYsaUNBQWlDO0FBQ2pDLDZGQUE2RjtBQUM3RixtQkFBbUI7QUFDbkIseUZBQXlGO0FBQ3pGLElBQUkifQ==