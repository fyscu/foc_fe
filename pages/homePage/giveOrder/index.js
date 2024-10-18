// Markdown转WXML页面
import Toast from "@vant/weapp/toast/toast";
import { giveTicket } from "../../../utils/req";

Page({
  data: {
    transcode: "",
    hasTranscode: true,
  },
  onLoad() { },
  onTranscodeChange(e) {
    this.setData({ transcode: e.detail });
    this.setData({ hasTranscode: e.detail !== "" });
  },
  onTransfer() {
    if (this.data.transcode === "") {
      this.setData({ hasTranscode: false });
      Toast("请填写转单码");
      return;
    }
    // 转单，启动
    wx.showLoading({ title: '接单中', mask: true });
    giveTicket({
      order_id: this.data.transcode.slice(0, -6),
      tvcode: this.data.transcode.slice(-6)
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
      } else if (returnCode === 300) {
          Toast("工单已关闭");
      } else if (returnCode === 404) {
          Toast("找不到工单");
      } else {
        Toast("接单失败，未知错误");
      }
    });
  },
});
