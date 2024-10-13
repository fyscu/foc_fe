// Markdown转WXML页面
import { findDataByName } from "../../../utils/util"
import { getConfig } from "../../../utils/req"

const app = getApp();

Page({
  data: {
    article: {},
    isLoading: true,
    sysConfig: app.globalData.sysConfig,
  },
  onLoad() {
    if (this.data.sysConfig === null) {
      getConfig().then((returnCode) => {
        if (returnCode === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (returnCode === 200) {
          // 获取全局配置成功
          this.setData({
            sysConfig: app.globalData.sysConfig,
          })
          this.parseArticle();
        } else if (returnCode === 403) {
          Toast("获取全局配置失败");
        } else {
          Toast("未知错误");
        }
      });
    } else {
      this.parseArticle();
    }
  },
  parseArticle() {
    let result = app.towxml(
      findDataByName(this.data.sysConfig, 'Global_Tips'),
      'markdown',
      { theme: app.systemInfo.theme }
    );
    // 更新解析数据
    this.setData({
      article: result,
      isLoading: false
    });
  }
});
