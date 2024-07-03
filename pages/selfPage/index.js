// index.js
import Toast from "@vant/weapp/toast/toast";

var app = getApp();

Page({
  data: {
    isloggedin: app.globalData.isloggedin,
    userInfo: app.globalData.userInfo,
    showPopup: false,
  },
  // 显示页面时更新数据
  onShow() {
    // console.log(app.globalData);
    this.reloadData();
  },
  // 在输入框不为focused时更新数据
  onNicknameBlur(e) {
    // console.log(e.detail);
    this.setData({
      ["userInfo.nickname"]: e.detail.value
    });
  },
  onPhoneBlur(e) {
    this.setData({
      ["userInfo.phone"]: e.detail.value
    });
  },
  onQQBlur(e) {
    this.setData({
      ["userInfo.qq"]: e.detail.value
    });
  },
  // 选择头像
  onChooseAvatar(e) {
    const {
      avatarUrl
    } = e.detail;
    // console.log("get avatar url:", e.detail);
    this.setData({
      ["userInfo.avatarUrl"]: avatarUrl
    });
  },
  // 关闭popup弹窗 并更新数据
  onClosePopup() {
    let nickname_trim = this.data.userInfo.nickname.trim();
    // TODO: Save Data
    this.setData({
      showPopup: false,
    });
    app.globalData.userInfo = this.data.userInfo;
  },
  onShowPopup() {
    this.setData({
      showPopup: true
    });
  },
  navigateToRegister() {
    wx.navigateTo({
      url: './registerPage/index',
    })
  },
  async userLogin() {
    try {
      app
        .userLogin()
        .then((returnCode) => {
          if (this.data.userInfo.nickname === "") {
            // 如果没有设置userInfo
            Toast("登录成功！请完善昵称");
            // 弹出个人信息填写页
            this.setData({
              showPopup: true
            });
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
      userInfo: app.globalData.userInfo,
    });
  },
  techCertify() {
    if (this.data.userInfo.phone.trim() == "") {
      Toast("请先填写手机号！");
    } else {
      // TODO: 进行认证逻辑
      Toast(`认证成功！已将您与技术员「${"南瓜瓜"}」绑定`);
      this.setData({
        ["userInfo.is_tech"]: true,
      });
    }
  },
});