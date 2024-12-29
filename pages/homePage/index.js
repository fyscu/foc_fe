import Dialog from "@vant/weapp/dialog/dialog";
import Toast from "@vant/weapp/toast/toast";
import { findDataByName } from "../../utils/util"
import {
  getTicket,
  giveTicket,
  setConfig,
  getTopTech,
  userLogin,
  getRootApi,
  getConfig
} from "../../utils/req"

var app = getApp();
let sysConfigOriginal = null;
let map = {
    "总榜": "总榜",
    "江安榜": "江安",
    "望江榜": "望江",
    "华西榜": "华西",
    "磨子桥榜": "望江",
}

Page({
  data: {
    // [toxml] 显示在dialog中的维修条款及隐私协议
    article: {},
    showDialog: false,
    announcementAgreed: false,
    // 技术员榜 Tab
    activeTab: "总榜",
    // 显示骨架屏
    loading: false,
    statusList: {
      Pending: "待分配",
      Repairing: "维修中",
      UserConfirming: "等待用户确认",
      TechConfirming: "等待技工确认",
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
    // 技术员排行
    topTech: [],
  },
  onLoad(options) {
    if (options.operator === "give") {
      if (options.order_id && options.tvcode) {
        Dialog.confirm({
          title: '接单确认',
          message: '确定接单吗？单号：' + options.order_id,
        }).then(() => {
          wx.showLoading({ title: "接单中", mask: true });
          giveTicket({
            order_id: options.order_id,
            tvcode: options.tvcode
          }).then((returnCode) => {
            wx.hideLoading();
            if (returnCode === 401) {
              Toast("鉴权失败，请刷新重试");
            } else if (returnCode === 200) {
              Toast("接单成功");
              this.initialize();
            } else if (returnCode === 403) {
              Toast("抱歉，你来晚了。工单已经被接走了！");
            } else if (returnCode === 300) {
              Toast("工单已关闭");
            } else if (returnCode === 404) {
              Toast("找不到工单");
            } else {
              Toast("接单失败，未知错误");
            }
          });
        }).catch(() => {
          console.log("取消接单");
        });
      }
    }
  },
  // 显示页面时更新数据
  onShow() {
    // 初始化数据
    this.reloadData(); // 刷新数据
    if (this.data.isloggedin) {
      if (this.data.sysConfig === null) {
        this.setData({ loading: true });
      }
      this.initialize();
    } else {
      // 获取 rootApiUrl
      getRootApi().then((returnCode) => {
        if (returnCode === 200) {
          this.onLogin();
        }
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
        this.initialize();
      } else {
        console.log("未知错误", returnCode);
      }
    }).catch((error) => {
      Toast("登录失败！" + error);
    });
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
  onTabChange(event) {
    this.setData({ activeTab: event.detail.name });
    getTopTech(map[this.data.activeTab]).then((res) => {
      if (res === 401) {
        Toast("鉴权失败，请刷新重试");
      } else if (res === 500) {
        Toast("获取技术员排行榜失败");
      } else {
        // 按照item.rank排序
        res.sort((a, b) => a.rank - b.rank);
        this.setData({ topTech: res });
      }
    });
  },
  initialize() {
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
          ),
          restMsg: findDataByName(
            app.globalData.sysConfig,
            'Rest_Msg'
          )
        })
      } else if (returnCode === 403) {
        Toast("获取全局配置失败");
      } else {
        Toast("未知错误");
      }
    });
    // 获取技术员排行榜
    getTopTech(map[this.data.activeTab]).then((res) => {
      if (res === 401) {
        Toast("鉴权失败，请刷新重试");
      } else if (res === 500) {
        Toast("获取技术员排行榜失败");
      } else {
        console.log("获取技术员排行榜成功", res);
        // 按照item.rank排序
        res.sort((a, b) => a.rank - b.rank);
        this.setData({ topTech: res });
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
          Toast("工单获取失败");
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
          Toast("工单获取失败");
        } else {
          Toast("未知错误");
        }
      });
    } else { // admin
      this.setData({ loading: false });
    }
  },
  onScanCode() {
    let that = this;
    wx.scanCode({
      success(res) {
        let parsed = res.result.split(";");
        if (parsed[0] === "[give]") {
          Dialog.confirm({
            title: '接单确认',
            message: '确定接单吗？单号：' + parsed[1],
          }).then(() => {
            wx.showLoading({ title: "接单中", mask: true });
            giveTicket({
              order_id: parsed[1],
              order_hash: parsed[2]
            }).then((returnCode) => {
              wx.hideLoading();
              if (returnCode === 401) {
                Toast("鉴权失败，请刷新重试");
              } else if (returnCode === 200) {
                Toast("接单成功");
                that.initialize();
              } else if (returnCode === 403) {
                Toast("接单失败，权限不足");
              } else if (returnCode === 300) {
                Toast("工单已关闭");
              } else if (returnCode === 404) {
                Toast("找不到工单");
              } else {
                Toast("接单失败，未知错误");
              }
            });
          }).catch(() => {
            console.log("取消接单");
          });
        } else {
          Toast("扫码成功");
        }
      },
      fail(err) {
        console.log("err:", err);
      },
    });
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
  navigateToGiveOrderPage() {
    wx.navigateTo({
      url: "/pages/homePage/giveOrder/index",
    });
  },
  navigateToAnnualSumPage() {
    wx.navigateTo({
      url: "/pages/homePage/annualSum/index",
    });
  },
  navigateToSubmitTicketPage() {
    wx.navigateTo({
      url: "/pages/homePage/submitTicket/index",
    });
  },
  // 维修条款及隐私协议弹窗
  onShowDialog() {
    let result = app.towxml(
      findDataByName(this.data.sysConfig, 'Global_Tips'),
      'markdown',
      { theme: app.systemInfo.theme }
    );
    // 显示确认弹窗
    this.setData({
      showDialog: true,
      article: result,
    });
  },
  onCloseDialog() {
    this.setData({ showDialog: false });
  },
  onAgreeChange(event) {
    this.setData({ announcementAgreed: event.detail });
  }
});
