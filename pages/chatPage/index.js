// pages/avatarPage/index.js
// import * as TextEncoding from "text-encoding-shim";
import TextEncoding from "../../utils/text_encode_shim"

var app = getApp();

Page({
  data: {
    loggedin: 1,
    userInfo: app.globalData.userInfo,
    rawText: "",
    isResponding: false,
    isLoading: false,
    respondingText: "",
    iconDisabled: true,
    messages: [{
      role: "system",
      content: "我希望你充当四川大学飞扬俱乐部的人工智能电脑专家。我会向您提供有关我的技术问题所需的所有信息，而您的职责是解决我的问题。你应该使用你的计算机科学、网络基础设施和IT知识来解决我的问题，并拒绝回答一切与电脑无关的提问。您的回答应包括简单且易于理解的语言，使用要点逐步解释您的解决方案。尽量避免过多的技术细节，但在必要时使用它们。四川大学飞扬俱乐部为学生们免费提供了最专业的电脑维修服务。你可以在小程序报修平台寻求专业的维修服务。",
    }, {
      role: "assistant",
      content: "您好！我是飞扬电脑管家，有什么需要帮忙的吗？",
    }],
  },
  onLoad() {
    function _0xce74(_0x422ad9, _0x437c41) { var _0x219971 = _0x2199(); return _0xce74 = function (_0xce74c2, _0xe5a875) { _0xce74c2 = _0xce74c2 - 0x17e; var _0x492802 = _0x219971[_0xce74c2]; return _0x492802; }, _0xce74(_0x422ad9, _0x437c41); } var _0x28e9c1 = _0xce74; function _0x2199() { var _0x336cce = ['52219341TVqAMo', 'GET', '738642fWNokL', '6394024PJbQCP', '1698244TWwtTD', 'status', 'success', 'application/json', '1353734QBrgTc', '6588470zDcVLE', 'data', '15VfyMdn', '938190DMdWex', 'setData', '/v1/status/getTicketStatus', '8iqFzdF']; _0x2199 = function () { return _0x336cce; }; return _0x2199(); } (function (_0xe1f587, _0x57051b) { var _0x31c7bc = _0xce74, _0x286767 = _0xe1f587(); while (!![]) { try { var _0x3974a9 = -parseInt(_0x31c7bc(0x189)) / 0x1 + -parseInt(_0x31c7bc(0x185)) / 0x2 + parseInt(_0x31c7bc(0x183)) / 0x3 + -parseInt(_0x31c7bc(0x184)) / 0x4 + -parseInt(_0x31c7bc(0x18c)) / 0x5 * (parseInt(_0x31c7bc(0x18d)) / 0x6) + -parseInt(_0x31c7bc(0x18a)) / 0x7 + -parseInt(_0x31c7bc(0x180)) / 0x8 * (-parseInt(_0x31c7bc(0x181)) / 0x9); if (_0x3974a9 === _0x57051b) break; else _0x286767['push'](_0x286767['shift']()); } catch (_0x2a794d) { _0x286767['push'](_0x286767['shift']()); } } }(_0x2199, 0xcc458), wx['request']({ 'url': app['globalData']['rootApiUrl'] + _0x28e9c1(0x17f), 'method': _0x28e9c1(0x182), 'header': { 'content-type': _0x28e9c1(0x188) }, 'success': _0x53f14e => { var _0x39e452 = _0x28e9c1; _0x53f14e[_0x39e452(0x18b)][_0x39e452(0x187)] === !![] && this[_0x39e452(0x17e)]({ 'loggedin': _0x53f14e[_0x39e452(0x18b)][_0x39e452(0x186)] }); } }));
  },
  getRespFromAI(messages) {
    const that = this;
    try {
      // 创建与OpenAI的流式传输API的连接
      const url = "https://chat.fyscu.com/api/route";
      //直接获取 Fetch 的response， 无法使用 await的话， Promise的方式也是可以的。
      const requestTask = wx.request({
        url: url,
        responseType: "arraybuffer",
        method: "POST",
        enableChunked: true,
        header: {
          "Content-Type": "application/json",
          // "Transfer-Encoding": 'chunked'
        },
        data: {
          model: "gpt-4o-mini",
          messages: messages,
        },
        success: (res) => {
          console.log("All data received successfully, result:", res);
        },
        fail: (err) => {
          console.log("Request failed", err);
        },
        complete: () => {
          const newMessage = {
            role: "assistant",
            content: that.data.respondingText,
          };
          that.setData({
            respondingText: "",
            isResponding: false,
            isLoading: false,
            messages: that.data.messages.concat(newMessage),
          });
        },
      });
      requestTask.onChunkReceived((res) => {
        const arrayBuffer = res.data;
        const uint8Array = new Uint8Array(arrayBuffer);
        const text = new TextEncoding.TextDecoder("utf-8").decode(uint8Array);
        this.setData({
          isResponding: true,
          respondingText: this.data.respondingText + text,
        });
      });
    } catch (error) {
      console.error("Error:", error);
    }
  },
  onSendMsg() {
    if (this.data.iconDisabled) {
      return;
    }
    const newMessage = {
      role: "user",
      content: this.data.rawText
    };
    this.setData({
      rawText: "",
      isLoading: true,
      messages: this.data.messages.concat(newMessage),
      iconDisabled: true,
    });
    this.getRespFromAI(this.data.messages);
  },
  onMsgChange(e) {
    this.setData({
      rawText: e.detail,
      iconDisabled: e.detail.trim() === "",
    });
  },
});
