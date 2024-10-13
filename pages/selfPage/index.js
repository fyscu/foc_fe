// index.js
import Toast from "@vant/weapp/toast/toast";
import { userLogin, getRootApi } from "../../utils/req"
import { checkUserInfo } from "../../utils/util";

var app = getApp();

Page({
  data: {
    isloggedin: app.globalData.isloggedin,
    userInfo: app.globalData.userInfo,
  },
  // 显示页面时更新数据
  onShow() {
    // console.log(app.globalData);
    this.reloadData();
    app.globalData.userInfo = this.data.userInfo;
    if (this.data.isloggedin) { // 如果已经登录
      if (!checkUserInfo(this.data.userInfo)) {
        console.log("信息不完善");
        wx.navigateTo({
          url: '/pages/selfPage/settingsPage/index?toast=必须完善所有信息',
        })
      }
    } else {
      // 获取 rootApiUrl
      getRootApi().then((returnCode) => {
        if (returnCode === 200) {
          this.onLogin();
        }
      });
    }
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
