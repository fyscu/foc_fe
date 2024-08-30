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
    loading: false,
    statusList: {
      Pending: "待分配",
      Repairing: "维修中",
      Done: "已完成",
      Closed: "已关闭",
      Canceled: "已取消",
    },
    isloggedin: app.globalData.isloggedin,
    userInfo: app.globalData.userInfo,
    ticketList: app.globalData.ticketList,
    isloggedin: app.globalData.isloggedin,
  },
  // 显示页面时更新数据
  onShow() {
    // 初始化数据
    this.reloadData(); // 刷新数据
    if (this.data.isloggedin) { // 登录了
      this.initialize();
    }
  },
  initialize() {
    this.setData({ loading: true });
    if (!checkUserInfo(this.data.userInfo)) {
      // 如果没有完善 userInfo，跳转到用户信息设置页面
      wx.navigateTo({
        url: '/pages/selfPage/settingsPage/index?toast=登录成功！请完善个人信息',
      });
    } else if (this.data.userInfo.role === "user") {
      // 获取用户的工单
      getTicket({
        uid: this.data.userInfo.uid,
      }).then((returnCode) => {
        this.setData({ loading: false });
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          // 成功获取用户的所有工单
          this.reloadData(); // 刷新数据
        } else if (returnCode === 403) {
          Toast("工单获取失败，权限不足");
        } else {
          Toast("未知错误");
        }
      });
    } else if (this.data.userInfo.role === "technician") {
      // 获取技术员的工单
      getTicket({
        tid: this.data.userInfo.uid,
      }).then((returnCode) => {
        this.setData({ loading: false });
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          // 成功获取用户的所有工单
          this.reloadData(); // 刷新数据
        } else if (returnCode === 403) {
          Toast("工单获取失败，权限不足");
        } else {
          Toast("未知错误");
        }
      });
    } else {
      this.setData({ loading: false });
    }
  },
  reloadData() {
    this.setData({
      isloggedin: app.globalData.isloggedin,
      userInfo: app.globalData.userInfo,
      ticketList: app.globalData.ticketList,
    });
  },
});
