// index.js
import Toast from "@vant/weapp/toast/toast";

var app = getApp();

Page({
  data: {
    isloggedin: app.globalData.isloggedin,
    hasUserInfo: app.globalData.hasUserInfo,
    userInfo: app.globalData.userInfo,
    showPopup: false,
  },
  // 显示页面时更新数据
  onShow: function () {
    this.reloadData();
  },
  // 在输入框不为focused时更新数据
  onNicknameBlur(e) {
    // console.log(e.detail);
    this.setData({ ["userInfo.nickname"]: e.detail.value });
  },
  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    // console.log("get avatar url:", e.detail);
    this.setData({ ["userInfo.avatarUrl"]: avatarUrl });
  },
  // 关闭popup弹窗 并更新数据
  onClosePopup() {
    let nickname_trim = this.data.userInfo.nickname.trim();
    // 用户没有填写昵称 >> 使用默认昵称momo
    if (nickname_trim == "") {
      nickname_trim = "momo";
    }
    // TODO: Save Data
    this.setData({
      showPopup: false,
      ['userInfo.nickname']: nickname_trim,
      // 用户填写了昵称 >> 获取到了用户昵称
      hasUserInfo: nickname_trim != "momo",
    });
    app.globalData.hasUserInfo = this.data.hasUserInfo;
    app.globalData.userInfo = this.data.userInfo;
  },
  onShowPopup() {
    this.setData({ showPopup: true });
  },
  async userLogin() {
    try {
      app
        .userLogin()
        .then((returnCode) => {
          if (!this.data.hasUserInfo) {
            // 如果没有设置userInfo
            Toast("登录成功！请完善昵称");
            // 弹出个人信息填写页
            this.setData({ showPopup: true });
          } else {
            Toast("登录成功！");
          }
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
