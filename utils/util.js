function formatNumber(n) {
  n = n.toString();
  return n[1] ? n : `0${n}`;
}

function formatTime(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':');
}

function formatDate(_date) {
  const date = new Date(_date);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  // yy-mm-dd
  return `${year}-${month}-${day}`;
}

function getUUid() {
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(
      Math.floor(Math.random() * 0x10), 1
    );
  }
  s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = "-";
  var uuid = s.join("");
  return uuid;
}

function checkUserInfo(userInfo) {
  // 检查用户信息是否填写完整
  console.log(userInfo);
  // if (userInfo.qq === "") { return false; }
  // if (userInfo.uid === "") { return false; }
  // if (userInfo.role === "") { return false; }
  if (userInfo.email === "") {
    return false;
  }
  if (userInfo.phone === "") {
    return false;
  }
  if (userInfo.campus === "") {
    return false;
  }
  if (userInfo.nickname === "") {
    return false;
  }
  if (userInfo.avatarUrl === "") {
    return false;
  }
  return true;
}

// 查找特定 name 的数据
function findDataByName(config, name) {
  const foundItem = config.find(item => item.name === name);
  return foundItem ? foundItem.data : null; // 如果找到，返回 data；否则返回 null
}

// 验证邮箱格式
function isValidEmail(email) {
  // 正则表达式用于验证邮箱格式
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
}

module.exports = {
  formatTime,
  formatDate,
  getUUid,
  checkUserInfo,
  findDataByName,
  isValidEmail,
};
