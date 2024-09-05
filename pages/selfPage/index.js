// index.js
import Toast from "@vant/weapp/toast/toast";
import {
  userLogin,
  getConfig
} from "../../utils/req"
import {
  checkUserInfo
} from "../../utils/util";

var app = getApp();

wx.login({
  success: (res) => {
    console.log("Here is a test code:", res.code);
  }
});

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
  onNicknameChange(e) {
    this.setData({
      ["userInfo.nickname"]: e.detail
    });
  },
  onPhoneChange(e) {
    this.setData({
      ["userInfo.phone"]: e.detail
    });
  },
  onEmailChange(e) {
    this.setData({
      ["userInfo.email"]: e.detail
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
  onLogin() {
    wx.showLoading({ title: '登录中', mask: true });
    userLogin().then((returnCode) => {
      wx.hideLoading();
      if (returnCode === 300) {
        Toast("您尚未注册");
        // 跳转到注册页
        wx.navigateTo({
          url: '/pages/selfPage/registerPage/index',
        });
      } else if (returnCode === 200) {
        // 成功登录
        this.reloadData();
        if (!checkUserInfo(this.data.userInfo)) {
          // 如果没有完善 userInfo
          // 跳转到用户信息设置页面
          wx.navigateTo({
            url: '/pages/selfPage/settingsPage/index?toast=登录成功！请完善个人信息',
          });
          // 弹出个人信息填写页 (弃用)
          // this.setData({
          //   showPopup: true
          // });
        }
      } else {
        console.log("未知错误", returnCode);
      }
    }).catch((error) => {
      Toast("登录失败！" + error);
    });
  },
  // 刷新 this.data 数据
  reloadData() {
    this.setData({
      isloggedin: app.globalData.isloggedin,
      userInfo: app.globalData.userInfo,
    });
  },
});
