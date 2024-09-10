import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";
import { setTicketStatus } from "../../../utils/req";
import QRCode from "../../../utils/weapp_qrcode.js";

var app = getApp();

Page({
  data: {
    active: 0,
    ticket: null,
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
  },
  loadQRcode() {
    const theme = app.systemInfo.theme;
    const qrcode = new QRCode('canvas', {
      // usingIn: this,
      text: "https://www.feiyang.ac.cn",
      padding: 12,
      width: 150,
      height: 150,
      colorDark: theme === "dark" ? "#1CA4FC" : "black",
      colorLight: theme === "dark" ? "#2e2e2e" : "white",
      correctLevel: QRCode.CorrectLevel.H,
      callback: (res) => {
        // 生成二维码的临时文件
        console.log(res.path)
      }
    });
  },
  cancelTheTicket() {
    Dialog.confirm({
      title: "取消工单",
      message: "确认取消工单吗？",
    }).then(() => {
      setTicketStatus(this.data.ticket.id, "Canceled").then((returnCode) => {
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("取消工单成功");
          this.setData({ active: 0 });
          setTimeout(() => {
            wx.navigateBack();
          }, 1000);
        } else {
          Toast("取消工单失败");
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
