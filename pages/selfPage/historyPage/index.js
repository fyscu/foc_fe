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
  },
  reloadData() {
    this.setData({
      userInfo: app.globalData.userInfo,
      orderList: app.globalData.orderList,
    });
  },
});