// pages/avatarPage/index.js
import * as TextEncoding from "text-encoding-shim";

var app = getApp();

Page({
  data: {
    userInfo: app.globalData.userInfo,
    rawText: "",
    isResponding: false,
    isLoading: false,
    respondingText: "",
    iconDisabled: true,
    messages: [{
        role: "system",
        content: "我希望你充当四川大学飞扬俱乐部的人工智能电脑专家。我会向您提供有关我的技术问题所需的所有信息，而您的职责是解决我的问题。你应该使用你的计算机科学、网络基础设施和IT知识来解决我的问题，并拒绝回答一切与电脑无关的提问。您的回答应包括简单且易于理解的语言，使用要点逐步解释您的解决方案。尽量避免过多的技术细节，但在必要时使用它们。四川大学飞扬俱乐部为学生们免费提供了最专业的电脑维修服务。你可以在小程序报修平台寻求专业的维修服务。",
      },
      {
        role: "assistant",
        content: "您好！我是飞扬电脑管家，有什么需要帮忙的吗？",
      },
    ],
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
          model: "gpt-3.5-turbo",
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
        // 方法1
        const arrayBuffer = res.data;
        const uint8Array = new Uint8Array(arrayBuffer);
        const text = new TextEncoding.TextDecoder("utf-8").decode(uint8Array);

        // 方法2
        // const arrayBuffer = res.data;
        // const uint8Array = new Uint8Array(arrayBuffer);
        // let text = String.fromCharCode.apply(null, uint8Array);

        // 方法3
        // const data16 = that.buf2hex(res.data);
        // const text = that.hexToStr(data16);
        this.setData({
          isResponding: true,
          respondingText: this.data.respondingText + text,
        });
        // console.log(this.data.respondingText);
      });
    } catch (error) {
      console.error("Error:", error);
    }
  },
  onSendMsg() {
    if (this.data.iconDisabled) {
      return;
    }
    // console.log(this.data.rawText);
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
  onMsgChange() {
    this.setData({
      iconDisabled: this.data.rawText.trim() === "",
    });
  },
});