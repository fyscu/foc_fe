// index.js
import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";
import {
  userLogin,
  putFeedback
} from "../../../utils/req"
import {
  checkUserInfo
} from "../../../utils/util"

const app = getApp();

Page({
  data: {
    rawText: "",
    userInfo: app.globalData.userInfo,
    autosizeData: {
      minHeight: 150
    }, // textfield最低高度100
  },
  onShow() {
    this.reloadData();
  },
  onReady() {
    // login if havn't
    if (!app.globalData.isloggedin) {
      this.onLogin();
    }
  },
  onFeedBack() {
    if (this.data.rawText === "") {
      Toast("请先填写反馈内容!");
    } else if (this.data.rawText.trim() === "forum") {
      wx.redirectTo({
        url: "/pages/forumPage/index",
      });
    } else if (this.data.rawText.trim() === "chat") {
      wx.redirectTo({
        url: "/pages/chatPage/index",
      });
    } else {
      Dialog.confirm({
        title: "提交反馈",
        message: "确认提交吗？",
      }).then(() => {
        putFeedback(this.data.rawText).then((returnCode) => {
          if (returnCode === 401) {
            Toast("鉴权失败，请刷新重试");
          } else if (returnCode === 200) {
            Toast("反馈成功！谢谢你的反馈");
            this.setData({
              rawText: "",
            });
          } else {
            Toast("反馈失败！" + returnCode);
          }
        });
      }).catch((error) => {
        Toast("反馈失败！" + error);
      });
    }
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
  reloadData() {
    this.setData({
      userInfo: app.globalData.userInfo,
    });
  },
});
