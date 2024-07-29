import {
  userLogin,
} from "../../../utils/req"
import {
  checkUserInfo
} from "../../../utils/util"

var app = getApp();

Page({
  data: {
    statusMap: ["待分配", "维修中", "已完成"],
    campusMap: {
      ja: "江安",
      wj: "望江",
      hx: "华西",
    },
    userInfo: app.globalData.userInfo,
    orderList: app.globalData.orderList,
  },
  // 显示页面时更新数据
  onShow() {
    this.reloadData();
    if (!app.globalData.isloggedin) {
      this.onLogin();
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
      orderList: app.globalData.orderList,
    });
  },
});