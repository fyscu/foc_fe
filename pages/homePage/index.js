import Dialog from "@vant/weapp/dialog/dialog";

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
    isloggedin: app.globalData.isloggedin,
  },
  // 显示页面时更新数据
  onShow() {
    this.reloadData();
  },
  reloadData() {
    this.setData({
      userInfo: app.globalData.userInfo,
      orderList: app.globalData.orderList,
      isloggedin: app.globalData.isloggedin,
    });
  },
  onNavigateToSubmitOrderPage() {
    Dialog.confirm({
        title: "维修须知",
        messageAlign: "left",
        confirmButtonText: "我已仔细阅读",
        message: `
        1. 登录后请先修改自己的个人信息以方便后续送修、维修处理。
        2. 送修前请移除电源外其余外设配件，包括鼠标、接收器、U盘、内存卡等。
        3. 如要更换配件，清提前购买准备好；如需重装系统，请确保电脑电量充足。
        4. 送修前请备份好数据，我们不对数据丢失负责。
        5. 请将问题尽量描述清楚或提前与维修人员联系说明清楚情况。
        6. 我们也不是万能的，不保证一定能修好，还请理解。
      `,
      })
      .then(() => {
        // on confirm
        wx.navigateTo({
          url: "/pages/homePage/submitOrder/index",
          success(res) {
            console.log("success:", res);
          },
        });
      })
      .catch(() => {
        // on cancel
        console.log("用户已取消报修");
      });
  },
});