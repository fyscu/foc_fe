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
    orderList: [],
    isloggedin: false,
    userInfo: {
      is_tech: false,
      qq: "", // 用户QQ号
      uid: "", // 用户id
      role: "", // 用role替代is_tech
      email: "", // 用户邮箱
      phone: "", // 用户手机号
      nickname: "", // 用户昵称
      avatarUrl: "/image/momo.jpg", // 用户头像地址
    },
    code: null,
    openid: null, // 唯一用户标识
  },
  // 引入`towxml3.0`解析方法 (解析markdown和html)
  // towxml: require("/towxml/index"),
  // 微信登陆 https://fyapidocs.wjlo.cc/admin/login
  userLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            this.globalData.isloggedin = true;
            this.globalData.code = res.code;
            console.log("code:", res.code);
            resolve(0); // 登录成功，使用 resolve 返回结果
          } else {
            reject(res.errMsg); // 登录失败，使用 reject 返回结果
          }
        },
      });
    });
  },
  // 获取accessToken
  getAccessToken() {
    wx.request({
      url: "url",
    });
  },
});