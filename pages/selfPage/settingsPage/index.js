// index.js
import Toast from "@vant/weapp/toast/toast";

var app = getApp();

Page({
  data: {
    userInfo: app.globalData.userInfo,
  },
  // 显示页面时更新数据
  onShow() {
    this.reloadData();
  },
  // Do something when page ready.
  onReady() {
    // login if havn't
    if (!app.globalData.isloggedin) {
      this.userLogin();
    }
  },
  // 页面卸载时触发。如wx.redirectTo或wx.navigateBack到其他页面时。
  onUnload() {
    // 关闭页面时更新数据
    app.globalData.userInfo = this.data.userInfo;
    // TODO: Save Data
    wx.request({
      url: 'url',
    })
  },
  // 在输入框不为focused时更新数据
  onNicknameBlur(e) {
    this.setData({ ["userInfo.nickname"]: e.detail.value });
  },
  onPhoneBlur(e) {
    this.setData({ ["userInfo.phone"]: e.detail.value });
  },
  onQQBlur(e) {
    this.setData({ ["userInfo.qq"]: e.detail.value });
  },
  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    // console.log("get avatar url:", e.detail);
    this.setData({ ["userInfo.avatarUrl"]: avatarUrl });
  },
  // 调用app.userLogin()
  async userLogin() {
    try {
      app
        .userLogin()
        .then((returnCode) => {
          Toast("登录成功！请完善个人信息");
          this.reloadData();
        })
        .catch((error) => {
          Toast("登录失败！" + error);
        });
    } catch (error) {
      console.log(error); // 输出错误信息
    }
  },
  reloadData() {
    this.setData({
      userInfo: app.globalData.userInfo,
    });
  },
  onLogout() {
    const emptyUserInfo = {
      is_tech: false,
      qq: "",
      phone: "",
      nickname: "",
      avatarUrl: "/image/momo.png",
    };
    this.setData({
      userInfo: emptyUserInfo,
    })
    app.globalData.orderList = [];
    app.globalData.isloggedin = false;
    app.globalData.code = null;
    app.globalData.openid = null;
    // console.log(app.globalData);
    wx.navigateBack();
  },
  techCertify() {
    if (this.data.userInfo.phone.trim() == "") {
      Toast("请先填写手机号！");
    } else {
      // TODO: 进行认证逻辑
      Toast(`认证成功！已将您与技术员「${"南瓜瓜"}」绑定`);
      this.setData({
        ["userInfo.is_tech"]: true
      });
    }
  }
});
