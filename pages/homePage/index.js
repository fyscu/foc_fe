import Toast from '@vant/weapp/toast/toast';

Page({
  data: {
    time: (new Date()).toString(),
    showPopup: false
  },
  onClick() {
    this.setData({
      showPopup: true
    })
  },
  onClose() {
    this.setData({
      showPopup: false
    })
  }
})
