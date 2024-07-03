Page({
  data: {
    share_url: "",
  },
  onLoad: function (options) {
    //这边可以取到转发后需要打开的url
    if (options && options.shareUrl) {
      this.setData({
        share_url: options.shareUrl,
      });
    }
  },
});