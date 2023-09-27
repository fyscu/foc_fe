// app.js
// API参考
// 获取APP的access Token
// curl "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxb5a591e0d3ca8424&secret=51c420e7a08c53678805d4c7576ca25d"

// 七牛云
// AK：oy4G0esTXRfyaC_2B4wpYoKRnopDGOHX9hBLJTWq
// SK：okhmMELQySOef8T6WMslKPAvcVO3k3fz8aqTRLfP

// 上传图片
// curl -F media=@/Users/huzongyao/Downloads/fyAvatar.jpg "https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=xxxx-xxxx-xxxx&upload_type=0&resp_type=0&height=108&width=108"

// https://mmbiz.qpic.cn/mmbiz_jpg/pmSwicTp2A07emlgRHWNXICya7vyfGSaAeoS9zE0fUW7Lxvt0F5Xwz3rAtwmazRbib1V8zJsqdxlq3d8iar5SPcQA/0

// curl -d "{\"img_url\":\"https://lab.fyscu.com/favicon.ico\"}" "https://api.weixin.qq.com/product/img/upload?access_token=72_nWKUBJOl7ANbdcKJK6TEgICTUR4Y6AlnCeCzu5_g0MpPGHNKszF8AQKIZBsG9tmv4hfxv2nMP-uLAI6xgB3EQVrGglJuRd-ObRk6UvldA0Sui5rjWuFlxAuJkGUZGIdAHAELN&upload_type=1&resp_type=1"

// 获取登录session_key和openid
// curl "https://api.weixin.qq.com/sns/jscode2session?appid=wxb5a591e0d3ca8424&secret=51c420e7a08c53678805d4c7576ca25d&js_code=0d3ftx0w3zgCj13aOy2w3Fr98o3ftx0b&grant_type=authorization_code"

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
    orderList: [
    ],
    isloggedin: false,
    userInfo: {
      is_tech: false,
      qq: "",
      phone: "",
      nickname: "",
      avatarUrl: "/image/momo.png",
    },
    code: null,
    openid: null,
  },
  // 引入`towxml3.0`解析方法 (解析markdown和html)
  // towxml: require("/towxml/index"),
  // 微信登陆（待完善）
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
      url: 'url',
    })
  }
});
