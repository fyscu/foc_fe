// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    // const logs = wx.getStorageSync("logs") || [];
    // logs.unshift(Date.now());
    // wx.setStorageSync("logs", logs);
  },
  // 定义全局变量
  globalData: {
    rootApiUrl: 'https://fyapi2.wjlo.cc',
    orderList: [], // 订单列表
    isloggedin: false, // 是否登录
    userInfo: {
      // is_tech: false, // 是否为技术员
      qq: "", // 用户QQ号
      uid: "", // 用户id
      role: "", // 用role替代is_tech
      email: "", // 用户邮箱
      phone: "", // 用户手机号
      campus: "", // 所在校区
      nickname: "", // 用户昵称
      avatarUrl: "/image/momo.jpg", // 用户头像地址
    },
    code: null,
    openid: null, // 唯一用户标识
    accessToken: null, // 关于 AT: https://fyapidocs.wjlo.cc/get_started/prepare
  },
  // // 引入`towxml3.0`解析方法 (解析markdown和html)
  // towxml: require("/towxml/index"),
});