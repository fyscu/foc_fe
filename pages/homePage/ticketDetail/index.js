import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";
import { completeTicket, setTicketStatus } from "../../../utils/req";
import QRCode from "../../../utils/weapp_qrcode.js";

var app = getApp();
var qrcode;

Page({
  data: {
    active: 0,
    ticket: null,
    qrcodePath: null,
    warrantyMap: {
      "expired": "过保",
      "under": "在保",
      "unknown": "未知",
    },
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
      Done: 3,
      Closed: 3,
      Canceled: 3,
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
    this.loadQRcode();
    let that = this;
    setTimeout(() => {
      qrcode.exportImage(function (path) {
        console.log("qrcode path:", path);
        if (that.data.qrcodePath === null) {
          that.setData({ qrcodePath: path });
        }
      });
    }, 200);
  },
  loadQRcode() {
    const theme = app.systemInfo.theme;
    qrcode = new QRCode('canvas', {
      text: `[give];${this.data.ticket.id};${this.data.ticket.order_hash}`,
      padding: 12,
      width: 150,
      height: 150,
      colorDark: theme === "dark" ? "#1CA4FC" : "black",
      colorLight: theme === "dark" ? "#2e2e2e" : "white",
      correctLevel: QRCode.CorrectLevel.H
    });
  },
  previewQRcode() {
    wx.previewImage({
      current: this.data.qrcodePath,
      urls: [this.data.qrcodePath],
    });
  },
  completeTheTicket() {
    Dialog.confirm({
      title: "结束工单",
      message: "确认结束工单吗？",
    }).then(() => {
      wx.showLoading({ title: "结束工单中", mask: true });
      completeTicket(this.data.ticket.id).then((returnCode) => {
        wx.hideLoading();
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("结束工单成功");
          this.setData({ active: 3 });
          setTimeout(() => {
            wx.navigateBack();
          }, 1000);
        } else if (returnCode === 404) {
          Toast("你不可以结束此工单");
        } else {
          Toast("工单结束失败");
        }
      });
    }).catch((err) => {
      console.log("取消结束工单", err);
    });
  },
  closeTheTicket() {
    Dialog.confirm({
      title: "强制关闭工单",
      message: "确认强制关闭工单吗？该功能仅在异常情况下使用。",
    }).then(() => {
      wx.showLoading({ title: "强制关闭工单", mask: true });
      setTicketStatus(this.data.ticket.id, "Closed").then((returnCode) => {
        wx.hideLoading();
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("强制关闭成功");
          this.setData({ active: 0 });
          setTimeout(() => {
            wx.navigateBack();
          }, 1000);
        } else {
          Toast("强制关闭失败");
        }
      });
    }).catch((err) => {
      console.log("取消强制关闭", err);
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
