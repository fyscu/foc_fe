const app = getApp();

Page({
  data: {
    url: "https://bbs.fyscu.com/",
    shareData: {},
  },
  onShareAppMessage(options) {
    return this.shareData;
  },
  message(e) {
    var that = this;
    that.shareData = {
      title: e.detail.data[e.detail.data.length - 1].title,
      path: "sharePage/index?shareUrl=" +
        e.detail.data[e.detail.data.length - 1].path,
    };
  },
});