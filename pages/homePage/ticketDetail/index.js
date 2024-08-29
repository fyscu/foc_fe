import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";
import { completeTicket } from "../../../utils/req";

var app = getApp();

Page({
  data: {
    active: 0,
    ticket: null,
    steps: [{
      text: "电脑报修"
    }, {
      text: "技术员接单"
    }, {
      text: "维修完成"
    }, {
      text: "工单关闭"
    }],
  },
  onLoad(options) {
    let map = {
      Pending: 0,
      Repairing: 1,
      Done: 2,
      Closed: 2,
      Canceled: 2,
    };
    this.setData({
      ticket: app.globalData.ticketList.find(
        (item) => item.id === options.id
      ),
    });
    console.log(this.data.ticket);
    this.setData({
      active: map[this.data.ticket.repair_status],
    });
  },
  closeTheTicket() {
    Dialog.confirm({
      title: "关闭工单",
      message: "确认关闭工单吗？",
    }).then(() => {
      completeTicket(this.data.ticket.id).then((returnCode) => {
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("关闭工单成功");
          this.setData({ active: 3 });
          setTimeout(() => {
            wx.navigateBack();
          }, 1000);
        } else if (returnCode === 404) {
          Toast("你不可以关闭此工单");
        } else {
          Toast("工单关闭失败");
        }
      });
    }).catch((err) => {
      console.log("取消关闭工单", err);
    });
  },
  previewImage(event) {
    console.log("previewImage:", event);
    wx.previewImage({
      current: event.target.dataset.src,
      urls: [this.data.ticket.repair_image_url],
    });
  }
});
