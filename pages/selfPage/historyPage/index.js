import Toast from "@vant/weapp/toast/toast";
import {
  userLogin,
} from "../../../utils/req"
import {
  checkUserInfo
} from "../../../utils/util"

var app = getApp();

Page({
  data: {
    loading: true,
    statusList: {
      Pending: "待分配",
      Repairing: "维修中",
      Done: "已完成",
      Closed: "已关闭",
      Canceled: "已取消",
    },
    userInfo: app.globalData.userInfo,
    ticketList: app.globalData.ticketList,
    isloggedin: app.globalData.isloggedin,
  },
  // 显示页面时更新数据
  onShow() {
    // 初始化数据
    this.initialize();
  },
  initialize() {
    this.reloadData(); // 刷新数据
    if (!this.data.isloggedin) { // 如果未登录
      userLogin().then((returnCode) => {
        if (returnCode === 300) {
          Toast("您尚未注册");
          // 跳转到注册页
          wx.navigateTo({
            url: '/pages/selfPage/registerPage/index',
          });
        } else if (returnCode === 200) {
          // 成功登录
          Toast("成功登录");
          if (!checkUserInfo(this.data.userInfo)) {
            // 如果没有完善 userInfo，跳转到用户信息设置页面
            wx.navigateTo({
              url: '/pages/selfPage/settingsPage/index?toast=登录成功！请完善个人信息',
            });
          } else {
            if (this.data.userInfo.role === "user") {
              // 获取用户的工单
              getTicket({
                uid: this.data.userInfo.uid,
              }).then((returnCode) => {
                if (returnCode === 401) {
                  Toast("鉴权失败，请刷新重试");
                } else if (returnCode === 200) {
                  // 成功获取用户的所有工单
                  this.reloadData(); // 刷新数据
                  this.setData({ loading: false });
                } else if (returnCode === 403) {
                  Toast("工单获取失败，权限不足");
                } else {
                  Toast("未知错误");
                }
              });
            } else if (this.data.userInfo.role === "technician") {
              // 获取技术员的工单
              getTicket({
                tid: this.data.userInfo.tid,
              }).then((returnCode) => {
                if (returnCode === 401) {
                  Toast("鉴权失败，请刷新重试");
                } else if (returnCode === 200) {
                  // 成功获取用户的所有工单
                  this.reloadData(); // 刷新数据
                  this.setData({ loading: false });
                } else if (returnCode === 403) {
                  Toast("工单获取失败，权限不足");
                } else {
                  Toast("未知错误");
                }
              });
            }
          }
        }
      });
    } else { // 如果已登录
      this.setData({ loading: false });
    }
  },
  reloadData() {
    this.setData({
      userInfo: app.globalData.userInfo,
      ticketList: app.globalData.ticketList,
    });
  },
});
