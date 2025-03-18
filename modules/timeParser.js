const chrono = require("chrono-node");
const logger = require("./logger.js");

/**
 * 解析週期性時間字串
 * @param {string} input - 輸入的中文時間字串
 * @returns {Object|null} - 解析結果，包含 type 和 value，如果無法解析則返回 null
 */
function parseRecurrence(input) {
  // 解析每週/每星期
  const weeklyPattern = /每(週|星期)(一|二|三|四|五|六|日)/;
  const weeklyMatch = input.match(weeklyPattern);

  if (weeklyMatch) {
    const weekdayMap = {
      一: 1,
      二: 2,
      三: 3,
      四: 4,
      五: 5,
      六: 6,
      日: 0,
    };
    return {
      type: "weekly",
      value: weekdayMap[weeklyMatch[2]],
    };
  }

  // 解析每月
  const monthlyPattern = /每月(\d{1,2})[號|日]/;
  const monthlyMatch = input.match(monthlyPattern);
  if (monthlyMatch) {
    const day = parseInt(monthlyMatch[1]);
    if (day >= 1 && day <= 31) {
      return {
        type: "monthly",
        value: day,
      };
    }
  }

  return null;
}

/**
 * 將繁體中文時間字串轉換為 chrono-node 可接受的英文格式
 * @param {string} chineseStr - 繁體中文時間字串，例如「明天上午10點」或「下週五」
 * @returns {string} - 轉換後的英文時間字串，例如 "tomorrow 10 AM" 或 "next Friday"
 */
function convertChineseToChrono(chineseStr, refDate = new Date()) {
  const weekdayMap = {
    一: "Monday",
    二: "Tuesday",
    三: "Wednesday",
    四: "Thursday",
    五: "Friday",
    六: "Saturday",
    日: "Sunday",
  };

  const timeMap = {
    今天: "today",
    明天: "tomorrow",
    昨天: "yesterday",
    下: "next",
    上: "last",
    早上: "AM",
    上午: "AM",
    下午: "PM",
    晚上: "PM",
    點: ":00", // 將「X點」轉為「X:00」
    分: "", // 「分」通常不需轉換，直接拼接數字
    點半: ":30", // 「半」轉為「:30」
  };

  const chineseToNumber = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
    十一: 11,
    十二: 12,
    十三: 13,
    十四: 14,
    十五: 15,
    十六: 16,
    十七: 17,
    十八: 18,
    十九: 19,
  };

  const year = refDate.getFullYear();

  // 處理字串的正則表達式模式
  let result = chineseStr;
  let prefix = "";
  let suffix = "";

  // 處理包含「今天/明天/上午/下午」的字串，將其轉成 prefix
  if (/^(今天|明天)/.test(result)) {
    prefix = timeMap[result.substring(0, 2)] + " ";
    result = result.substring(2);
  }

  // 處理星期（支援「下星期X」或「下週X」）
  if (/^(下)?(星期|週)([一二三四五六日])/.test(result)) {
    const weekPattern = /^(下)?(星期|週)([一二三四五六日])/;
    const weekMatch = result.match(weekPattern);

    prefix += ` ${timeMap[weekMatch[1]] || ""} ${weekdayMap[weekMatch[3]]}`;
    result = result.replace(/^(下)?(星期|週)([一二三四五六日])/, "").trim();
  }

  if (/^(上午|下午|早上|晚上)/.test(result)) {
    suffix = timeMap[result.substring(0, 2)];
    result = result.substring(2);
  }

  // 處理日期格式「XXXX年XX月XX日」
  if (/(\d{4})年(\d{1,2})月(\d{1,2})日/.test(result)) {
    result = result.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/, "$1-$2-$3"); // 轉為 "YYYY-MM-DD"
  }

  // 處理「X月X日」
  if (/(\d{1,2})月(\d{1,2})日/.test(result)) {
    result = result.replace(/(\d{1,2})月(\d{1,2})日/, `${year}-$1-$2`); // 轉為 "YYYY-MM-DD"
  }

  // 處理相對時間」「X天後」
  if (/(\d+)(天後)/.test(result)) {
    result = result.replace(/(\d+)(天後)/, "in $1 days");
  }

  // 8. 處理具體時間「X點」「X點Y分」
  if (/([\d])點(\d*)分?/.test(result)) {
    result = result.replace(/([\d])點(\d*)分?/, (match, hour, minute) => {
      const minuteStr = minute ? `:${minute.padStart(2, "0")}` : ":00";
      return `${hour}${minuteStr}`.trim();
    });
  }

  if (
    /\s*(一|二|三|四|五|六|七|八|九|十|十一|十二|十三|十四|十五|十六|十七|十八|十九)點(半)?/.test(
      result
    )
  ) {
    result = result.replace(
      /\s*(一|二|三|四|五|六|七|八|九|十|十一|十二|十三|十四|十五|十六|十七|十八|十九)點(半)?/,
      (match, hour, minute) => {
        return `${chineseToNumber[hour]}:${minute ? ":30" : ":00"}`.trim();
      }
    );
  }

  // 10. 清理多餘空格並返回
  return (prefix + " " + result + " " + suffix).trim().replace(/\s+/g, " ");
}

/**
 * 解析時間字串
 * @param {string} input - 輸入的中文時間字串
 * @param {Date} referenceDate - 參考日期，預設為當前時間
 * @returns {Object} - 解析結果
 * @returns {Object} result.type - 時間類型 ('once' | 'weekly' | 'monthly')
 * @returns {Date|number} result.value - 若為一次性提醒則為 Date 物件，若為週期性提醒則為數字（星期幾或月份日期）
 * @returns {string} result.originalInput - 原始輸入字串
 * @returns {string} result.displayText - 顯示用文字
 */
function parseTime(input, referenceDate = new Date()) {
  // 檢查是否為週期性時間
  const recurrence = parseRecurrence(input);
  if (recurrence) {
    const weekDayNames = ["日", "一", "二", "三", "四", "五", "六"];
    let displayText = "";

    if (recurrence.type === "weekly") {
      displayText = `每週${weekDayNames[recurrence.value]}`;
    } else if (recurrence.type === "monthly") {
      displayText = `每月${recurrence.value}日`;
    }

    return {
      type: recurrence.type,
      value: recurrence.value,
      originalInput: input,
      displayText: displayText,
    };
  }

  // 解析一次性時間
  const chronoString = convertChineseToChrono(input, referenceDate);
  const parsedTime = chrono.parseDate(chronoString, referenceDate);

  if (!parsedTime) {
    return null;
  }

  // 格式化顯示文字
  const displayText = formatDate(parsedTime);

  return {
    type: "once",
    value: parsedTime,
    originalInput: input,
    displayText: displayText,
  };
}

/**
 * 格式化日期為顯示用文字
 * @param {Date} date - 日期物件
 * @returns {string} - 格式化後的文字
 */
function formatDate(date) {
  const weekDayNames = ["日", "一", "二", "三", "四", "五", "六"];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDay = weekDayNames[date.getDay()];
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // 如果是今年，就不顯示年份
  const isThisYear = new Date().getFullYear() === year;
  const dateStr = isThisYear
    ? `${month}月${day}日`
    : `${year}年${month}月${day}日`;

  return `${dateStr}（週${weekDay}）${hours}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

// 測試案例
// const testCases = [
//   "今天晚上6點",
//   "每週一",
//   "每星期二",
//   "每月10號",
//   "每月3日",
//   "明天下午3點",
//   "下週五晚上8點",
// ];

// testCases.forEach((test) => {
//   const result = parseTime(test);
//   console.log(`輸入: ${test}`);
//   console.log("解析結果:", result);
//   console.log("---");
// });

module.exports = parseTime;
