// index.js
// Markdown转WXML页面
const app = getApp();
Page({
  data: {
    rawText: "",
    article: {},
  },
  onFeedbackMsgChange(e) {
    // console.log(e);
    // console.log(this.data)
    let obj = app.towxml(this.data.rawText, "markdown");
    this.setData({ article: obj });
  }
});
