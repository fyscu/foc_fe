import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";
import { setTechInfo } from "../../../utils/req";

var app = getApp();

Page({
  data: {
    userInfo: app.globalData.userInfo,
    daysList: [1, 2, 3, 4, 5, 6, 7],
    hasQQ: false, // 是否使用QQ
    restDays: 3, // 默认休息天数是 3
    showPopup: 0,
  },
  onLoad(options) {
    console.log(options);
    this.reLoadData();
  },
  // 弹出和关闭底部的popups
  showPopup(event) {
    this.setData({
      showPopup: parseInt(event.target.dataset.index),
    });
  },
  closePopup() {
    this.setData({
      showPopup: 0,
    });
  },
  onQQChange(event) {
    this.setData({
      ["userInfo.qq"]: event.detail,
    });
  },
  // 技术员选择暂停接机的天数
  onConfirmDays(event) {
    const {
      value
    } = event.detail;
    this.setData({
      restDays: value, // 休息几天
      showPopup: 0,
    });
  },
  // 技术员选择是否展示QQ
  onToggleQQ(event) {
    this.setData({
      hasQQ: event.detail,
    });
  },
  onToggleAvalable(event) {
    this.setData({
      ["userInfo.available"]: event.detail,
    });
  },
  reLoadData() {
    this.setData({
      userInfo: app.globalData.userInfo,
    });
    // 如果没有设置过是否接单，默认为 true
    if (!this.data.userInfo.available) {
      this.setData({
        ["userInfo.available"]: true,
      });
    }
  },
  saveOptions() {
    setTechInfo(this.data.userInfo.available).then((returnCode) => {
      if (returnCode === 401) {
        Toast("鉴权失败，请刷新重试");
      } else if (returnCode === 200) {
        Toast("保存成功");
        setTimeout(() => {
          wx.navigateBack();
        }, 500);
      } else {
        Toast("保存失败");
      }
    });
  }
});
