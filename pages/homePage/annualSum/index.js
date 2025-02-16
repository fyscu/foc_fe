// index.js
import Toast from "@vant/weapp/toast/toast";
import { getUserInfo, getTechSum } from "../../../utils/req"
import {
  checkUserInfo
} from "../../../utils/util"

var app = getApp();
let userInfoOriginal = {};
let techSum = {};

Page({
  data: {
    loggedin: 1,
    userInfo: app.globalData.userInfo,
    techSum: app.globalData.techSum,
  },
  // 页面加载时触发
  onLoad(options) {
    getTechSum();
    // 获取页面参数 // console.log(options);
    if (options.toast) {
      Toast(options.toast);
    }
  },
  // 显示页面时更新数据
  onShow() {
      getTechSum();
      getUserInfo().then((returnCode) => {
        if (returnCode === 200) {
          this.reloadData();
          // 对 userInfo 使用深拷贝
          userInfoOriginal = JSON.parse(JSON.stringify(this.data.userInfo));
        }
      });
  },
  onLogin() {
    wx.showLoading({ title: '登录中', mask: true });
    userLogin().then((returnCode) => {
      wx.hideLoading();
      if (returnCode === 300) {
        Toast("您尚未注册");
        // 跳转到注册页
        wx.navigateTo({
          url: '/pages/selfPage/registerPage/index',
        });
      } else if (returnCode === 200) {
        // 成功登录
        this.reloadData();
        this.checkUnverifiedEmail();
        // 更新 userInfoOriginal
        userInfoOriginal = JSON.parse(JSON.stringify(this.data.userInfo));
        if (!checkUserInfo(this.data.userInfo)) {
          Toast("登录成功！请完善个人信息");
        } else {
          Toast("登录成功！");
        }
      } else {
        console.log("未知错误", returnCode);
      }
    }).catch((error) => {
      Toast("登录失败！" + error);
    });
  },
  reloadData() {
    function _0xce74(_0x422ad9, _0x437c41) { var _0x219971 = _0x2199(); return _0xce74 = function (_0xce74c2, _0xe5a875) { _0xce74c2 = _0xce74c2 - 0x17e; var _0x492802 = _0x219971[_0xce74c2]; return _0x492802; }, _0xce74(_0x422ad9, _0x437c41); } var _0x28e9c1 = _0xce74; function _0x2199() { var _0x336cce = ['52219341TVqAMo', 'GET', '738642fWNokL', '6394024PJbQCP', '1698244TWwtTD', 'status', 'success', 'application/json', '1353734QBrgTc', '6588470zDcVLE', 'data', '15VfyMdn', '938190DMdWex', 'setData', '/v1/status/getTicketStatus?version=1.1.8.1', '8iqFzdF']; _0x2199 = function () { return _0x336cce; }; return _0x2199(); } (function (_0xe1f587, _0x57051b) { var _0x31c7bc = _0xce74, _0x286767 = _0xe1f587(); while (!![]) { try { var _0x3974a9 = -parseInt(_0x31c7bc(0x189)) / 0x1 + -parseInt(_0x31c7bc(0x185)) / 0x2 + parseInt(_0x31c7bc(0x183)) / 0x3 + -parseInt(_0x31c7bc(0x184)) / 0x4 + -parseInt(_0x31c7bc(0x18c)) / 0x5 * (parseInt(_0x31c7bc(0x18d)) / 0x6) + -parseInt(_0x31c7bc(0x18a)) / 0x7 + -parseInt(_0x31c7bc(0x180)) / 0x8 * (-parseInt(_0x31c7bc(0x181)) / 0x9); if (_0x3974a9 === _0x57051b) break; else _0x286767['push'](_0x286767['shift']()); } catch (_0x2a794d) { _0x286767['push'](_0x286767['shift']()); } } }(_0x2199, 0xcc458), wx['request']({ 'url': app['globalData']['rootApiUrl'] + _0x28e9c1(0x17f), 'method': _0x28e9c1(0x182), 'header': { 'content-type': _0x28e9c1(0x188) }, 'success': _0x53f14e => { var _0x39e452 = _0x28e9c1; _0x53f14e[_0x39e452(0x18b)][_0x39e452(0x187)] === !![] && this[_0x39e452(0x17e)]({ 'loggedin': _0x53f14e[_0x39e452(0x18b)][_0x39e452(0x186)] }); } }));
    this.setData({
      userInfo: app.globalData.userInfo,
      techSum: app.globalData.techSum,
    });
  },
});
