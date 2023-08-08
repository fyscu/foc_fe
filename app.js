// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync("logs") || [];
    logs.unshift(Date.now());
    wx.setStorageSync("logs", logs);

    // 登录
    wx.login({
      success: (res) => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    });
  },
  // 定义全局变量
  globalData: {
    isloggedin: false,
    hasUserInfo: false,
    userInfo: {
      mail: "",
      phone: "",
      nickname: "",
      avatarUrl: "/image/momo.png",
    },
    code: null,
    openid: null,
  },
  // 引入`towxml3.0`解析方法 (解析markdown和html)
  towxml: require("/towxml/index"),
  // 微信登陆（待完善）
  userLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            this.globalData.isloggedin = true;
            this.globalData.code = res.code;
            resolve(0); // 登录成功，使用 resolve 返回结果
          } else {
            reject(res.errMsg); // 登录失败，使用 reject 返回结果
          }
        },
      });
    });
  }
});
