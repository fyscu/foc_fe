import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";
import { completeTicket, setTicketStatus } from "../../../utils/req";

var app = getApp();

Page({
  data: {
    active: 0,
    role: "user",
    activeColor: "#38f",
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
    console.log("ticketDetail options:", options);
    this.setData({
      role: options.role,
      ticket: app.globalData.ticketList.find(
        (item) => item.id === options.id
      ),
    });
    this.calcSteps(this.data.ticket.repair_status);
  },
  calcSteps(repair_status) {
    let statusMap = {
      Pending: 0,
      Repairing: 1,
      UserConfirming: 2,
      TechConfirming: 2,
      Done: 3,
      Closed: 3,
      Canceled: 3,
    };
    if (repair_status === "UserConfirming") {
      this.setData({
        ["steps[2].text"]: "技术员确认"
      });
    } else if (repair_status === "TechConfirming") {
      this.setData({
        ["steps[2].text"]: "用户确认"
      });
    } else if (repair_status === "Canceled") {
      this.setData({
        activeColor: "#ff0000",
        ["steps[3]"]: { text: "用户取消", activeIcon: 'close' }
      });
    } else if (repair_status === "Closed") {
      this.setData({
        activeColor: "#ff0000",
        ["steps[3]"]: { text: "强制关闭", activeIcon: 'warning-o' }
      });
    }
    this.setData({
      ["ticket.repair_status"]: repair_status,
      active: statusMap[repair_status],
    });
  },
  previewQRcode() {
    wx.previewImage({
      current: this.data.ticket.qrcode_url,
      urls: [this.data.ticket.qrcode_url],
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
          this.calcSteps('Done');
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
  confirmTheTicket() {
    let confirmStatus;
    if (this.data.role === "technician") {
      confirmStatus = "UserConfirming";
    } else if (this.data.role === "user") {
      confirmStatus = "TechConfirming";
    } else {
      Toast("管理员请用强制关闭功能");
      return;
    }
    Dialog.confirm({
      title: "确认工单完成",
      message: "确认工单完成吗？只有用户和技术员双向确认，工单才会关闭",
    }).then(() => {
      wx.showLoading({ title: "确认工单", mask: true });
      setTicketStatus(this.data.ticket.id, confirmStatus).then((returnCode) => {
        wx.hideLoading();
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("确认工单成功");
          this.calcSteps(confirmStatus);
        } else {
          Toast("确认工单失败");
        }
      });
    }).catch((err) => {
      console.log("取消确认工单", err);
    });
  },
  cancelTheTicket() {
    Dialog.confirm({
      title: "取消工单",
      message: "确认取消工单吗？",
    }).then(() => {
      wx.showLoading({ title: "取消工单", mask: true });
      setTicketStatus(this.data.ticket.id, "Canceled").then((returnCode) => {
        wx.hideLoading();
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("取消工单成功");
          this.calcSteps("Canceled");
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
          this.calcSteps('Closed');
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
