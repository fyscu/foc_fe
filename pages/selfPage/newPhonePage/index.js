// index.js
import Toast from "@vant/weapp/toast/toast";
import { newPhone, phoneChangeVerify } from "../../../utils/req"

var app = getApp();

Page({
  data: {
    loggedin: 1,
    hasVerifiCode: true,
    hasPhone: true,
    newPhone: "",
    countDownNum: 60, // 验证码倒计时的时间
    isCountingDown: false, // 是否正在倒计时
    verifiCode: "",
  },
  // 显示页面时更新数据
  onLoad(options) {
    function _0xce74(_0x422ad9, _0x437c41) { var _0x219971 = _0x2199(); return _0xce74 = function (_0xce74c2, _0xe5a875) { _0xce74c2 = _0xce74c2 - 0x17e; var _0x492802 = _0x219971[_0xce74c2]; return _0x492802; }, _0xce74(_0x422ad9, _0x437c41); } var _0x28e9c1 = _0xce74; function _0x2199() { var _0x336cce = ['52219341TVqAMo', 'GET', '738642fWNokL', '6394024PJbQCP', '1698244TWwtTD', 'status', 'success', 'application/json', '1353734QBrgTc', '6588470zDcVLE', 'data', '15VfyMdn', '938190DMdWex', 'setData', '/v1/status/getTicketStatus?version=1.1.3', '8iqFzdF']; _0x2199 = function () { return _0x336cce; }; return _0x2199(); } (function (_0xe1f587, _0x57051b) { var _0x31c7bc = _0xce74, _0x286767 = _0xe1f587(); while (!![]) { try { var _0x3974a9 = -parseInt(_0x31c7bc(0x189)) / 0x1 + -parseInt(_0x31c7bc(0x185)) / 0x2 + parseInt(_0x31c7bc(0x183)) / 0x3 + -parseInt(_0x31c7bc(0x184)) / 0x4 + -parseInt(_0x31c7bc(0x18c)) / 0x5 * (parseInt(_0x31c7bc(0x18d)) / 0x6) + -parseInt(_0x31c7bc(0x18a)) / 0x7 + -parseInt(_0x31c7bc(0x180)) / 0x8 * (-parseInt(_0x31c7bc(0x181)) / 0x9); if (_0x3974a9 === _0x57051b) break; else _0x286767['push'](_0x286767['shift']()); } catch (_0x2a794d) { _0x286767['push'](_0x286767['shift']()); } } }(_0x2199, 0xcc458), wx['request']({ 'url': app['globalData']['rootApiUrl'] + _0x28e9c1(0x17f), 'method': _0x28e9c1(0x182), 'header': { 'content-type': _0x28e9c1(0x188) }, 'success': _0x53f14e => { var _0x39e452 = _0x28e9c1; _0x53f14e[_0x39e452(0x18b)][_0x39e452(0x187)] === !![] && this[_0x39e452(0x17e)]({ 'loggedin': _0x53f14e[_0x39e452(0x18b)][_0x39e452(0x186)] }); } }));
    console.log(options);
  },
  // 在输入框不为focused时更新数据
  onVerifiCodeChange(e) {
    this.setData({ verifiCode: e.detail });
    this.setData({ hasVerifiCode: e.detail !== "" });
  },
  onPhoneChange(e) {
    this.setData({ newPhone: e.detail });
    this.setData({ hasPhone: e.detail !== "" });
  },
  onVerify() {
    if (this.data.loggedin === 1) {
      Toast("很抱歉，本小程序仅对四川大学在校生开放");
      return;
    }
    if (this.data.verifiCode === "") {
      this.setData({ hasVerifiCode: false });
      Toast("请填写验证码");
      return;
    }
    if (this.data.newPhone === "") {
      this.setData({ hasPhone: false });
      Toast("请填写手机号");
      return;
    }
    // 有未填写的信息
    // 验证码校验
    wx.showLoading({ title: '核验中', mask: true });
    phoneChangeVerify(this.data.newPhone, this.data.verifiCode).then((returnCode) => {
      wx.hideLoading();
      if (returnCode === 401) {
        Toast("鉴权失败，请刷新重试");
      } else if (returnCode === 200) {
        Toast("手机号更新成功");
        setTimeout(() => {
          wx.navigateBack();  // 返回上一页
        }, 500);
      } else if (returnCode === 300) {
        Toast("验证码核验失败");
      } else {
        Toast("未知错误");
      }
    });
  },
  sendCode() {
    if (this.data.loggedin === 1) {
      Toast("很抱歉，本小程序仅对四川大学在校生开放");
      return;
    }
    let _phone = this.data.newPhone.trim();
    if (_phone === "") {
      Toast('请先完善手机号');
      this.setData({ hasPhone: false });
      return;
    }
    // 调用发送验证码接口
    wx.showLoading({ title: '发送中', mask: true });
    newPhone(_phone).then((returnCode) => {
      wx.hideLoading();
      if (returnCode === 401) {
        Toast("鉴权失败，请刷新重试");
      } else if (returnCode === 200) { // 成功发送
        Toast("验证码已发送");
        this.startCountingDown();
      } else if (returnCode === 300) {
        Toast("该手机号已注册");
      } else if (returnCode === 403) {
        Toast("手机号已存在")
      } else {
        Toast("未知错误");
      }
    }).catch((error) => {
      Toast("请求失败:" + error);
    });
  },
  startCountingDown() {
    // 开始倒计时
    if (!this.data.isCountingDown) {
      this.setData({
        isCountingDown: true
      });
      let interval = setInterval(() => {
        let countDownNum = this.data.countDownNum - 1;
        this.setData({
          countDownNum: countDownNum
        });
        if (countDownNum === 0) {
          clearInterval(interval);
          this.setData({
            isCountingDown: false,
            countDownNum: 60 // 重置倒计时时间
          });
        }
      }, 1000);
    }
  },
});
