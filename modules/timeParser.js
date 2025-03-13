const chrono = require('chrono-node');
const logger = require('./logger.js');

/**
 * 將繁體中文時間字串轉換為 chrono-node 可接受的英文格式
 * @param {string} chineseStr - 繁體中文時間字串，例如「明天上午10點」或「下週五」
 * @returns {string} - 轉換後的英文時間字串，例如 "tomorrow 10 AM" 或 "next Friday"
 */
function convertChineseToChrono(chineseStr, refDate = new Date()) {
  const weekdayMap = {
    一: 'Monday',
    二: 'Tuesday',
    三: 'Wednesday',
    四: 'Thursday',
    五: 'Friday',
    六: 'Saturday',
    日: 'Sunday',
  };

  const timeMap = {
    今天: 'today',
    明天: 'tomorrow',
    昨天: 'yesterday',
    下: 'next',
    上: 'last',
    上午: 'AM',
    下午: 'PM',
    點: ':00', // 將「X點」轉為「X:00」
    分: '', // 「分」通常不需轉換，直接拼接數字
    點半: ':30', // 「半」轉為「:30」
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
  const month = refDate.getMonth() + 1;
  const date = refDate.getDate();
  const time = refDate.getHours();

  // 處理字串的正則表達式模式
  let result = chineseStr;
  let prefix = '';

  // 處理包含「今天/明天/上午/下午」的字串，將其轉成 prefix
  if (/^(今天|明天)/.test(result)) {
    prefix = timeMap[result.substring(0, 2)] + ' ';
    result = result.substring(2);
  }

  // 處理星期（支援「下星期X」或「下週X」）
  if (/^(下)?(星期|週)([一二三四五六日])/.test(result)) {
    prefix += result.replace(
      /([下])?(星期|週)([一二三四五六日])/g,
      (match, prefix, week, day) => {
        return `${timeMap[prefix] || ''} ${weekdayMap[day]}`;
      }
    );

    result = result.replace(/^(下)?(星期|週)([一二三四五六日])/, '').trim();
    console.log('處理星期: ', result, prefix);
  }

  if (/^(上午|下午)/.test(result)) {
    prefix += timeMap[result.substring(0, 2)] + ' ';
    result = result.substring(2);
  }

  // 處理日期格式「XXXX年XX月XX日」
  if (/(\d{4})年(\d{1,2})月(\d{1,2})日/.test(result)) {
    result = result.replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/, '$1-$2-$3'); // 轉為 "YYYY-MM-DD"
  }

  // 處理「X月X日」
  if (/(\d{1,2})月(\d{1,2})日/.test(result)) {
    result = result.replace(/(\d{1,2})月(\d{1,2})日/, `${year}-$1-$2`); // 轉為 "YYYY-MM-DD"
  }

  // 處理相對時間」「X天後」
  if (/(\d+)(天後)/.test(result)) {
    result = result.replace(/(\d+)(天後)/, 'in $1 days');
  }

  // 8. 處理具體時間「X點」「X點Y分」
  if (/([\d])點(\d*)分?/.test(result)) {
    result = result.replace(/([\d])點(\d*)分?/, (match, hour, minute) => {
      const minuteStr = minute ? `:${minute.padStart(2, '0')}` : ':00';
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
        return `${chineseToNumber[hour]}:30`.trim();
      }
    );
  }

  // 10. 清理多餘空格並返回
  return (prefix + result).trim().replace(/\s+/g, ' ');
}

// 測試範例;
const testCases = [
  '今天',
  '明天上午10點',
  '星期五',
  '下週五',
  '下週三下午兩點',
  '2025年3月11日',
  '3月11日',
  '下午3點30分',
  '2天後',
  '下午五點半',
  //   不支援過去時間
  '昨天',
  '1天前',
  '上週三十點',
  '上星期三',
];

testCases.forEach((test) => {
  const converted = convertChineseToChrono(test);
  console.log(`中文: ${test} -> 英文: ${converted}`);
  const parsed = chrono.parseDate(converted, new Date());
  console.log(`解析結果: ${parsed}`);
  console.log('---');
});

function parseTime(input, referenceDate = new Date()) {
  const chronoString = convertChineseToChrono(input, referenceDate);
  console.log('chronoString: ', chronoString);
  const parsedTime = chrono.parseDate(chronoString, referenceDate);
  if (!parsedTime) {
    return null;
  }

  return parsedTime;
}

module.exports = parseTime;
