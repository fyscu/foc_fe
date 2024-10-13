// Markdown转WXML页面
import Toast from "@vant/weapp/toast/toast";
import { giveTicket } from "../../../utils/req";

Page({
  data: {
    orderID: "",
    transcode: "",
    hasOrderID: true,
    hasTranscode: true,
  },
  onLoad() { },
  onTranscodeChange(e) {
    this.setData({ transcode: e.detail });
    this.setData({ hasTranscode: e.detail !== "" });
  },
  onOrderIDChange(e) {
    this.setData({ orderID: e.detail });
    this.setData({ hasOrderID: e.detail !== "" });
  },
  onTransfer() {
    if (this.data.orderID === "") {
      this.setData({ hasOrderID: false });
      Toast("请填写工单号");
      return;
    }
    if (this.data.transcode === "") {
      this.setData({ hasTranscode: false });
      Toast("请填写验证码");
      return;
    }
    // 转单，启动
    wx.showLoading({ title: '接单中', mask: true });
    giveTicket({
      order_id: this.data.orderID,
      tvcode: this.data.transcode
    }).then((returnCode) => {
      wx.hideLoading();
      if (returnCode === 401) {
        Toast("鉴权失败，请刷新重试");
      } else if (returnCode === 200) {
        Toast("接单成功");
        setTimeout(() => {
          wx.navigateBack();
        }, 500);
      } else if (returnCode === 403) {
        Toast("抱歉，你来晚了。工单已经被接走了！");
      } else {
        Toast("接单失败，未知错误");
      }
    });
  },
});
