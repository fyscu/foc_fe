// index.js
import Toast from "@vant/weapp/toast/toast";

var app = getApp();

Page({
  data: {
    isloggedin: app.globalData.isloggedin,
    hasUserInfo: app.globalData.hasUserInfo,
    userInfo: app.globalData.userInfo,
  },
  // 显示页面时更新数据
  onShow: function () {
    this.reloadData();
  },
  // Do something when page ready.
  onReady: function () {
    // login if havn't
    if (!app.globalData.isloggedin) {
      this.userLogin();
    }
  },
  // 页面卸载时触发。如wx.redirectTo或wx.navigateBack到其他页面时。
  onUnload: function () {
    // 关闭页面时更新数据
    let nickname_trim = this.data.userInfo.nickname.trim();
    // 用户没有填写昵称 >> 使用默认昵称momo
    if (nickname_trim == "") {
      nickname_trim = "momo";
    }
    // TODO: Save Data
    this.setData({
      showPopup: false,
      ["userInfo.nickname"]: nickname_trim,
      // 用户填写了昵称 >> 获取到了用户昵称
      hasUserInfo: nickname_trim != "momo",
    });
    app.globalData.hasUserInfo = this.data.hasUserInfo;
    app.globalData.userInfo = this.data.userInfo;
  },
  // 在输入框不为focused时更新数据
  onNicknameBlur(e) {
    this.setData({ ["userInfo.nickname"]: e.detail.value });
  },
  onPhoneBlur(e) {
    this.setData({ ["userInfo.phone"]: e.detail.value });
  },
  onMailBlur(e) {
    this.setData({ ["userInfo.mail"]: e.detail.value });
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
      isloggedin: app.globalData.isloggedin,
      hasUserInfo: app.globalData.hasUserInfo,
      userInfo: app.globalData.userInfo,
    });
  },
});
