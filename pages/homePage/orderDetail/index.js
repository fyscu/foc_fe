import Toast from '@vant/weapp/toast/toast';
import Dialog from '@vant/weapp/dialog/dialog';

var app = getApp();

Page({
  data: {
    active: 0,
    order: {},
    steps: [
      {
        text: '电脑报修',
      },
      {
        text: '技术员接单',
      },
      {
        text: '维修完成',
      },
      {
        text: '订单关闭',
      },
    ],
  },
  onLoad(options) {
    console.log(); // 输出'value'
    this.setData({
      order: app.globalData.orderList.find(item => item.id === parseInt(options.id)),
    });
    this.setData({
      active: this.data.order.status,
    });
  },
  closeTheOrder() {
    Dialog.confirm({
      title: '关闭订单',
      message: '确认关闭订单吗？',
    }).then(() => {
      // on confirm
      this.setData({
        active: 3,
      });
      Toast("订单已关闭");
      // TODO: 完善订单关闭的逻辑
    }).catch(() => {
      // on cancel
    });
  }
})
