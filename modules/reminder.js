const schedule = require("node-schedule");
const db = require("./firebase.js");
const { sendTextMessage } = require("./lineMessenger.js");

/**
 * 設定排程任務
 * @param {string} groupId - LINE群組ID
 * @param {Date} time - 提醒時間
 * @param {string} message - 提醒訊息
 * @param {Object} recurrence - 循環設定，格式為 {type: 'weekly'|'monthly', count?: number}
 * @returns {void}
 */
async function setSchedule(groupId, time, message, recurrence = null) {
  const maxCount = recurrence ? recurrence.count || 12 : 0;

  // 如果有設定循環且次數大於0
  if (recurrence && maxCount > 0) {
    const rule = new schedule.RecurrenceRule();
    rule.hour = time.getHours();
    rule.minute = time.getMinutes();
    rule.second = time.getSeconds();

    // 設定每週或每月循環
    if (recurrence.type === "weekly") {
      rule.dayOfWeek = time.getDay();
    } else if (recurrence.type === "monthly") {
      rule.date = time.getDate();
    }

    const job = schedule.scheduleJob(rule, async function () {
      // 使用 job 物件來儲存計數器
      this.count = (this.count || 0) + 1;

      await sendTextMessage(
        groupId,
        `第${this.count}次${
          recurrence.type === "weekly" ? "週" : "月"
        }循環提醒：${message}`
      );

      // 達到最大次數時
      if (this.count >= maxCount) {
        await sendTextMessage(
          groupId,
          `已完成${maxCount}次循環提醒，若要繼續提醒請重新設定`
        );
        await db.deleteReminder(groupId, time.toISOString());
        this.cancel();
      }
    });
    // 初始化計數器
    job.count = 0;
  } else {
    schedule.scheduleJob(time, async () => {
      await sendTextMessage(groupId, `提醒：${message}`);
      await db.deleteReminder(groupId, time.toISOString());
    });
  }
}

/**
 * 新增提醒
 * @param {string} groupId - LINE群組ID
 * @param {Date} time - 提醒時間
 * @param {string} message - 提醒訊息
 * @param {Object} recurrence - 循環設定，格式為 {type: 'weekly'|'monthly', count?: number}
 * @returns {void}
 */
async function addReminder(groupId, time, message, recurrence = null) {
  // // 使用 Firebase 儲存提醒
  await db.addReminder(groupId, time, message);

  // // 設定排程
  setSchedule(groupId, time, message, recurrence);
}

module.exports = addReminder;
