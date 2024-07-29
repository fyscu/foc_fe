import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";

var app = getApp();

Page({
  data: {
    userInfo: app.globalData.userInfo,
    daysList: [1, 2, 3, 4, 5, 6, 7],
    restDays: 3, // 默认休息天数是 3
    hasQQ: true, // 是否使用QQ
    showPopup: 0,
  },
  onLoad(options) {},
  // 弹出和关闭底部的popups
  showPopup(event) {
    // console.log(event);
    this.setData({
      showPopup: parseInt(event.target.dataset.index),
    });
  },
  closePopup() {
    this.setData({
      showPopup: 0,
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
  }
});