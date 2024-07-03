// index.js
import Toast from "@vant/weapp/toast/toast";

const app = getApp();
Page({
  data: {
    rawText: "",
    userInfo: app.globalData.userInfo,
    autosizeData: {
      minHeight: 150
    }, // textfeild最低高度100
  },
  onReady() {
    // login if havn't
    if (!app.globalData.isloggedin) {
      this.userLogin();
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
  async userLogin() {
    try {
      app
        .userLogin()
        .then((returnCode) => {
          if (this.data.userInfo.nickname === "") {
            // 如果没有设置userInfo
            Toast("登录成功！请在个人设置中完善昵称");
          } else {
            Toast("登录成功！");
          }
        })
        .catch((error) => {
          Toast("登录失败！" + error);
        });
    } catch (error) {
      console.log(error); // 输出错误信息
    }
  },
});