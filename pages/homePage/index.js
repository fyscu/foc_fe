import Dialog from "@vant/weapp/dialog/dialog";
import Toast from "@vant/weapp/toast/toast";
import {
  getTicket, getConfig
} from "../../utils/req"
import {
  findDataByName
} from "../../utils/util"

var app = getApp();

Page({
  data: {
    // 显示骨架屏
    loading: true,
    statusList: {
      Pending: "待分配",
      Repairing: "维修中",
      Done: "已完成",
    },
    campusList: {
      ja: "江安",
      wj: "望江",
      hx: "华西",
    },
    userInfo: app.globalData.userInfo,
    ticketList: app.globalData.ticketList,
    isloggedin: app.globalData.isloggedin,
    sysConfig: app.globalData.sysConfig,
    repairFlag: true, // 全局报修开关（是否可以报修）
  },
  // 显示页面时更新数据
  onShow() {
    // 登录 [TODO]
    // 初始化数据
    this.initialize();
    // 加载完成
    setTimeout(() => {
      this.setData({
        loading: false
      })
    }, 500);
  },
  initialize() {
    this.reloadData(); // 刷新数据
    if (this.data.isloggedin) {
      // 获取全局配置
      getConfig().then((returnCode) => {
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          // 获取全局配置成功
          this.reloadData(); // 刷新数据
          this.setData({
            repairFlag: findDataByName(
              app.globalData.sysConfig,
              'Global_Flag'
            )
          })
        } else if (returnCode === 403) {
          Toast("获取全局配置失败");
        } else {
          Toast("未知错误");
        }
      });
      // 获取用户配置
      if (this.data.userInfo.role === "user") {
        getTicket({
          uid: this.data.userInfo.uid,
        }).then((returnCode) => {
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
      }
    }
  },
  reloadData() {
    this.setData({
      userInfo: app.globalData.userInfo,
      ticketList: app.globalData.ticketList,
      isloggedin: app.globalData.isloggedin,
      sysConfig: app.globalData.sysConfig,
    });
  },
  onNavigateToTechOptions() {
    wx.navigateTo({
      url: "/pages/homePage/techOptions/index",
      success(res) {
        // console.log("success:", res);
      },
    });
  },
  navigateToSubmitTicketPage() {
    Dialog.confirm({
      title: "维修须知",
      messageAlign: "left",
      confirmButtonText: "我已仔细阅读",
      message: findDataByName(this.data.sysConfig, 'Global_Tips'),
    }).then(() => {
      // on confirm
      wx.navigateTo({
        url: "/pages/homePage/submitTicket/index",
      });
    }).catch(() => {
      // on cancel
      console.log("用户已取消报修");
    });
  },
});
