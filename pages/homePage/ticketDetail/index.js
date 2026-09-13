import Toast from "@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";
import {
  uploadQiniuImgRaw,
  completeTicket,
  setTicketStatus,
  setCompleteImage,
  getTicketDetail,
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
    detailsRefreshing: false,
    detailUnavailable: false,
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
    this._unloaded = false;
    this._ticketId = options.id === undefined || options.id === null ? '' : String(options.id);
    this._routeRole = options.role;
    const list = Array.isArray(app.globalData.ticketList) ? app.globalData.ticketList : [];
    const cached = list.find(item => item && String(item.id) === this._ticketId);
    this.setData({ role: (app.globalData.userInfo || {}).role || options.role || 'user' });
    if (cached) this.applyTicket(cached);
    // 首次由 onShow 发起一次读取，缓存仅用于尽快显示。
  },
  onShow() {
    if (this._mutationPending || this._choosingMedia) return Promise.resolve(200);
    return this.refreshTicket();
  },
  onUnload() {
    this._unloaded = true;
  },
  refreshTicket() {
    if (this._refreshPromise) return this._refreshPromise;
    this.setData({ detailsRefreshing: true });
    this._refreshPromise = getTicketDetail(this._ticketId).then(result => {
      if (this._unloaded) return result.code;
      this.setData({ detailUnavailable: result.code !== 200 });
      if (result.code === 200) {
        this.applyTicket(result.ticket);
      } else {
        const messages = {
          401: '登录已失效，请返回首页重新登录后再试',
          403: '暂无查看此工单的权限',
          404: '未找到此工单，请返回首页刷新后再试',
        };
        Toast(messages[result.code] || '工单刷新失败，请检查网络后重新进入');
      }
      return result.code;
    }).catch(() => {
      if (!this._unloaded) {
        this.setData({ detailUnavailable: true });
        Toast('工单刷新失败，请检查网络后重新进入');
      }
      return 500;
    }).then(code => {
      this._refreshPromise = null;
      if (!this._unloaded) this.setData({ detailsRefreshing: false });
      return code;
    });
    return this._refreshPromise;
  },
  applyTicket(ticket) {
    if (!ticket) return;
    const contact = ticket.qq_number === null || ticket.qq_number === undefined ? '' : String(ticket.qq_number);
    const separator = contact.indexOf('|');
    this.setData({
      ticket: Object.assign({}, ticket),
      role: (app.globalData.userInfo || {}).role || this._routeRole || this.data.role,
      needCompleteImage: !ticket.complete_image_url,
      contactValue: separator === -1 ? 'QQ/微信号' : contact.slice(0, separator),
      contactNumber: separator === -1 ? contact : contact.slice(separator + 1),
    });
    this.calcSteps(ticket.repair_status);
  },
  ticketReady() {
    if (!this.data.ticket || this.data.detailUnavailable) {
      Toast('工单尚未加载，请返回首页刷新后再试');
      return false;
    }
    if (this.data.detailsRefreshing || this._mutationPending) {
      Toast('工单正在更新，请稍候');
      return false;
    }
    return true;
  },
  applyFinalStatus(fallback) {
    const current = (app.globalData.ticketList || []).find(
      item => item && String(item.id) === String(this.data.ticket.id)
    );
    this.applyTicket(Object.assign({}, this.data.ticket, current || {}, {
      repair_status: current && current.repair_status || fallback,
    }));
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
    this.setData({
      activeColor: '#38f',
      steps: [{ text: '电脑报修' }, { text: '技术员接单' }, { text: '维修完成' }, { text: '工单关闭' }],
    });
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
      active: statusMap[repair_status] === undefined ? 0 : statusMap[repair_status],
    });
  },
  // 关闭、弹出索要图片框
  closeDialog() {
    this.setData({ showDialog: false });
  },
  completeImage() {
    if (!this.ticketReady()) return;
    let that = this;
    this._choosingMedia = true;
    wx.chooseMedia({
      count: 1, // 可选择的图片数量
      mediaType: ["image"],
      sourceType: ["album", "camera"], // 来源：相册或相机
      camera: "back",
      success(res) {
        that._choosingMedia = false;
        if (that._unloaded || !res.tempFiles || !res.tempFiles.length) return;
        // 从相册返回也会触发 onShow，避免旧读取覆盖刚上传的图片状态。
        that._mutationPending = true;
        wx.showLoading({ title: "上传图片中", mask: true });
        let tempFilePath = res.tempFiles[0].tempFilePath;
        uploadQiniuImgRaw(tempFilePath).then((url) => {
          return setCompleteImage(that.data.ticket.id, url).then(returnCode => {
            if (that._unloaded) return;
            if (returnCode === 401) {
              Toast("鉴权失败，请刷新重试");
            } else if (returnCode === 200) {
              Toast("上传图片成功，请再次点击维修完成");
              that.setData({ showDialog: false });
              that.applyTicket(Object.assign({}, that.data.ticket, { complete_image_url: url }));
            } else {
              Toast("上传图片失败，请重试");
              that.setData({ showDialog: true });
              that.setData({ needCompleteImage: true });
            }
          });
        }).catch(() => {
          if (!that._unloaded) Toast('上传图片失败，请重试');
        }).then(() => {
          that._mutationPending = false;
          wx.hideLoading();
        });
      },
      fail() { that._choosingMedia = false; },
    });
  },
  completeTheTicket() {
    if (!this.ticketReady()) return;
    // console.log(this.data.role);
    if (this.data.role === "technician" && this.data.needCompleteImage) {
      // 如果是技术员且未上传结束图片
      this.setData({ showDialog: true });
      return;
    } else {
      wx.showLoading({ title: "结束工单中", mask: true });
      this._mutationPending = true;
      completeTicket(this.data.ticket.id).then((returnCode) => {
        this._mutationPending = false;
        wx.hideLoading();
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("结束工单成功");
          this.applyFinalStatus('Done');
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
    if (!this.ticketReady()) return;
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
      if (!this.ticketReady()) return;
      wx.showLoading({ title: "确认工单", mask: true });
      this._mutationPending = true;
      setTicketStatus(this.data.ticket.id, confirmStatus).then((returnCode) => {
        this._mutationPending = false;
        wx.hideLoading();
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("确认工单成功");
          this.applyFinalStatus(confirmStatus);
        } else {
          Toast("确认工单失败");
        }
      });
    }).catch((err) => {
      console.log("取消确认工单", err);
    });
  },
  cancelTheTicket() {
    if (!this.ticketReady()) return;
    Dialog.confirm({
      title: "取消工单",
      message: "确认取消工单吗？",
    }).then(() => {
      if (!this.ticketReady()) return;
      wx.showLoading({ title: "取消工单", mask: true });
      this._mutationPending = true;
      setTicketStatus(this.data.ticket.id, "Canceled").then((returnCode) => {
        this._mutationPending = false;
        wx.hideLoading();
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("取消工单成功");
          this.applyFinalStatus('Canceled');
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
    if (!this.ticketReady()) return;
    Dialog.confirm({
      title: "强制关闭工单",
      message: "确认强制关闭工单吗？该功能仅在异常情况下使用。",
    }).then(() => {
      if (!this.ticketReady()) return;
      wx.showLoading({ title: "强制关闭工单", mask: true });
      this._mutationPending = true;
      setTicketStatus(this.data.ticket.id, "Closed").then((returnCode) => {
        this._mutationPending = false;
        wx.hideLoading();
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          Toast("强制关闭成功");
          this.applyFinalStatus('Closed');
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
    if (!this.data.ticket) return { title: '飞扬报修', path: '/pages/homePage/index' };
    return {
      title: '我能把这个工单托付给你吗？',
      path: `/pages/homePage/index?operator=give&order_id=${this.data.ticket.id}&tvcode=${this.data.ticket.transcode}`,
      imageUrl: this.data.ticket.repair_image_url,
    }
  }
});
