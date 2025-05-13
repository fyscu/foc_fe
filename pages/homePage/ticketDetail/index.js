import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";
import {
  uploadQiniuImgRaw,
  completeTicket,
  setTicketStatus,
  setCompleteImage,
} from "../../../utils/req";

var app = getApp();

Page({
  data: {
    active: 0,
    role: "user",
    showDialog: false, // 是否显示结束工单确认框
    needCompleteImage: true, // 是否未上传图片
    activeColor: "#38f",
    ticket: null,
    contactValue: "",
    contactNumber: "",
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
    this.setData({
      needCompleteImage: !this.data.ticket.complete_image_url
    });
    console.log(this.data.ticket.complete_image_url);
    let qq_number = this.data.ticket.qq_number;
    if (qq_number.includes("|")) {
      this.setData({
        contactValue: qq_number.split("|")[0],
        contactNumber: qq_number.split("|")[1]
      });
    } else {
      this.setData({
        contactValue: "QQ/微信号",
        contactNumber: qq_number
      });
    }
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
  // 关闭、弹出索要图片框
  closeDialog() {
    this.setData({ showDialog: false });
  },
  completeImage() {
    let that = this;
    wx.chooseMedia({
      count: 1, // 可选择的图片数量
      mediaType: ["image"],
      sourceType: ["album", "camera"], // 来源：相册或相机
      camera: "back",
      success(res) {
        wx.showLoading({ title: "上传图片中", mask: true });
        let tempFilePath = res.tempFiles[0].tempFilePath;
        uploadQiniuImgRaw(tempFilePath).then((url) => {
          setCompleteImage(that.data.ticket.id, url).then(returnCode => {
            wx.hideLoading();
            if (returnCode === 401) {
              Toast("鉴权失败，请刷新重试");
            } else if (returnCode === 200) {
              Toast("上传图片成功，请再次点击维修完成");
              that.setData({ showDialog: false });
              that.setData({ needCompleteImage: false });
            } else {
              Toast("上传图片失败，请重试");
              that.setData({ showDialog: true });
              that.setData({ needCompleteImage: true });
            }
          });
        });
      },
    });
  },
  completeTheTicket() {
    // console.log(this.data.role);
    if (this.data.role === "technician" && this.data.needCompleteImage) {
      // 如果是技术员且未上传结束图片
      this.setData({ showDialog: true });
      return;
    } else {
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
    }
  },
  confirmTheTicket() {
    let confirmStatus;
    // console.log(this.data.needCompleteImage);
    if (this.data.role === "technician" && this.data.needCompleteImage) {
      // 如果是技术员且未上传结束图片
      this.setData({ showDialog: true });
      return;
    } else if (this.data.role === "technician") {
      confirmStatus = "UserConfirming";
    } else if (this.data.role === "user") {
      confirmStatus = "TechConfirming";
    } else {
      Toast("管理员请用强制关闭功能");
      return;
    }
    wx.requestSubscribeMessage({
      tmplIds: ['KMe-rYXD_Js_X3oE9_t6qMoa6DMm07Dfzeq94bsMvxg','E6dwts_XeUZ8QGprGRpI-nTWPVagF9QHJ5fdh-wmot8'],
      success(res) {
        console.log('授权结果', res);
      },
      fail(err) {
        console.error('订阅失败', err);
        wx.showToast({ title: '授权失败', icon: 'none' });
      }
    });
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
    wx.previewImage({
      current: event.target.dataset.src,
      urls: [event.target.dataset.src],
    });
  },
  onShareAppMessage() {
    return {
      title: '我能把这个工单托付给你吗？',
      path: `/pages/homePage/index?operator=give&order_id=${this.data.ticket.id}&tvcode=${this.data.ticket.transcode}`,
      imageUrl: this.data.ticket.repair_image_url,
    }
  }
});
