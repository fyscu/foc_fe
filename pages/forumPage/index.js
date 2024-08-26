const app = getApp();

Page({
  data: {
    url: "https://bbs.feiyang.ac.cn/",
    shareData: {},
  },
  onShareAppMessage(options) {
    return this.data.shareData;
  },
  message(e) {
    let temp = {
      title: e.detail.data[e.detail.data.length - 1].title,
      path: "sharePage/index?shareUrl=" +
        e.detail.data[e.detail.data.length - 1].path,
    };
    this.setData({
      shareData: temp,
    });
  },
});
