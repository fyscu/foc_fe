import Dialog from "@vant/weapp/dialog/dialog";
import Toast from "@vant/weapp/toast/toast";
import { findDataByName } from "../../utils/util"
import {
  getTicket,
  setConfig,
  getConfig
} from "../../utils/req"

var app = getApp();
let sysConfigOriginal = null;

Page({
  data: {
    // 显示骨架屏
    loading: false,
    statusList: {
      Pending: "待分配",
      Repairing: "维修中",
      Done: "已完成",
      Closed: "已关闭",
      Canceled: "已取消",
    },
    hasUnfinishedStatus: false,
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
    this.reloadData(); // 刷新数据
    if (this.data.isloggedin) {
      this.initialize();
    }
  },
  onSysConfigChange(event) {
    let sysConfigName = event.currentTarget.dataset.name;
    // find name=name in sysConfig
    const updatedConfig = this.data.sysConfig.map(item => {
      if (item.name === sysConfigName) {
        return { ...item, data: event.detail }; // 更新 item
      }
      return item; // 保持其他项不变
    });
    this.setData({ sysConfig: updatedConfig });
    // console.log("sysConfig changed:", this.data.sysConfig);
  },
  onSaveSysConfig() {
    let hasChange = false;
    this.data.sysConfig.forEach((config, index) => {
      if (sysConfigOriginal[index].data !== config.data) {
        console.log("changed fields:", config.name, config.data);
        hasChange = true;
        setConfig({
          name: config.name,
          data: config.data,
        }).then((returnCode) => {
          if (returnCode === 401) {
            Toast("鉴权失败，请刷新重试");
          } else if (returnCode === 200) {
            Toast("保存成功");
            // 更新 sysConfig
            sysConfigOriginal = JSON.parse(JSON.stringify(this.data.sysConfig));
          } else if (returnCode === 403) {
            Toast("保存失败，权限不足");
          } else {
            Toast("保存失败，未知错误");
          }
        });
      }
    });
    if (!hasChange) { // 没有修改
      Toast("保存成功");
    }
  },
  initialize() {
    this.setData({ loading: true });
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
    if (this.data.userInfo.role === "user") {
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
    } else { // admin
      this.setData({ loading: false });
    }
  },
  reloadData() {
    this.setData({
      userInfo: app.globalData.userInfo,
      ticketList: app.globalData.ticketList,
      isloggedin: app.globalData.isloggedin,
      sysConfig: app.globalData.sysConfig,
      hasUnfinishedStatus: app.globalData.ticketList.some(ticket =>
        ticket.repair_status !== 'Done' &&
        ticket.repair_status !== 'Canceled' &&
        ticket.repair_status !== 'Closed'
      )
    });
    // 更新 sysConfig
    sysConfigOriginal = JSON.parse(JSON.stringify(this.data.sysConfig));
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
