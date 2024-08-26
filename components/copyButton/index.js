Component({
  properties: {
    textToCopy: {
      type: String,
      value: ''
    }
  },
  data: {
    isCopied: false
  },
  methods: {
    copyText() {
      wx.setClipboardData({
        data: this.properties.textToCopy,
        success: () => {
          this.setData({ isCopied: true });
          setTimeout(() => {
            this.setData({ isCopied: false });
          }, 2000);
        }
      });
    }
  }
});
