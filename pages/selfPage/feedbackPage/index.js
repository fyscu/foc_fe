// index.js
import Toast from "@vant/weapp/toast/toast";
import {
  userLogin,
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
    }, // textfeild最低高度100
  },
  onShow() {
    this.reloadData();
    // login if havn't
    if (!app.globalData.isloggedin) {
      this.onLogin();
    }
  },  
  onShowPopup() {
    if (this.data.rawText === "") {
      Toast("请先填写反馈内容!");
    } else if (this.data.rawText.trim() === "chat") {
      wx.navigateTo({
        url: "/pages/chatPage/index",
      });
    } else {
      Toast("感谢您的反馈!");
    }
  },
  onLogin() {
    userLogin().then((returnCode) => {
      console.log("returnCode:", returnCode);
      if (returnCode === 300) {
        Toast("您尚未注册");
        // 跳转到注册页
        wx.navigateTo({
          url: './registerPage/index',
        });
      } else if (returnCode === 200) {
        // 成功登录
        if (!checkUserInfo(this.data.userInfo)) {
          // 如果没有完善 userInfo
          // 跳转到用户信息设置页面
          wx.navigateTo({
            url: './settingsPage/index?toast=登录成功！请完善个人信息',
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