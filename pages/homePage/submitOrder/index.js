import {
  getUUid
} from "../../../utils/util";
import Toast from "../../settingsPage/node_modules/@vant/weapp/toast/toast";
import Dialog from "@vant/weapp/dialog/dialog";

var app = getApp();
// 七牛云token
var qiniuToken = "";

// 图片、标题、问题描述、校区、机型、是否在保、故障类型

Page({
  data: {
    // 图像链接
    imageUrl: [],
    // 设备问题描述
    problemDesc: "",
    // 购买日期
    purchaseDate: "请选择",
    // 日期区间
    minDate: new Date(2019, 0, 1).getTime(),
    maxDate: new Date().getTime(),
    currentDate: new Date().getTime(),
    formatter(type, value) {
      if (type === "year") {
        return `${value}年`;
      }
      if (type === "month") {
        return `${value}月`;
      }
      if (type === "day") {
        return `${value}日`;
      }
      return value;
    },
    // 设备型号
    model: "",
    // 校区
    campusValue: "请选择",
    // 设备类型
    deviceTypeValue: "请选择",
    // 设备品牌
    brandValue: "请选择",
    // 保修状态
    warrantStatusValue: "请选择",
    // 设备问题
    deviceProblemValue: "请选择",
    // 不弹出选择框
    showPopup: 0,
    // showPopup = 1:
    campusList: ["江安", "华西", "望江"],
    // showPopup = 2:
    deviceTypeList: [
      "笔记本 (Laptop)",
      "台式机 (PC/Mac)",
      "移动手机 (Phone)",
      "其他设备 (Others)",
    ],
    // showPopup = 3:
    brandList: [
      "苹果 Apple",
      "戴尔 DELL",
      "华为 HUAWEI",
      "联想 Lenovo",
      "华硕 ASUS",
      "神舟 HASEE",
      "三星 SamSung",
      "微软 MicroSoft",
      "惠普 HP",
      "宏碁 Acer",
      "雷蛇 Razer",
      "ThinkPad",
      "外星人 Alienware",
      "雷神 Thunder",
      "NEC",
      "机械师 MACHENIKE",
      "微星 Msi",
      "炫龙 Shinelon",
      "清华同方",
      "Intel",
      "技嘉 GIGABYTE",
      "海尔 Haier",
      "LG",
      "东芝 Toshiba",
      "松下 Panasonic",
      "Terrans Force",
      "富士通 FUJITSU",
      "爱尔轩 AIERXUAN",
      "酷比魔方 CUBE",
      "锡恩帝 CENDE",
      "海鲅 HIPAA",
      "索立信",
      "夏普 Sharp",
      "SO-SOON",
      "其他",
    ],
    // showPopup = 4:
    warrantStatusList: ["过保", "在保", "未知"],
    // showPopup = 5:
    problemList: ["设备清灰", "系统重装", "无法开机", "设备进水", "软件问题"],
    // userinfo
    qq: app.globalData.userInfo.qq,
    phone: app.globalData.userInfo.phone,
  },
  // 显示页面时更新数据
  onShow() {
    this.reloadData();
  },
  onReady() {
    this.loadToken();
  },
  loadToken() {
    const that = this;
    wx.request({
      url: "https://chat.fyscu.com/api/getToken",
      success(res) {
        console.log("get token successfully:", res.data);
        qiniuToken = res.data.token;
      },
    });
  },
  reloadData() {
    this.setData({
      qq: app.globalData.userInfo.qq,
      phone: app.globalData.userInfo.phone,
    });
  },
  onConfirmCampus(event) {
    // 校区
    const {
      value
    } = event.detail;
    this.setData({
      campusValue: value,
      showPopup: 0,
    });
  },
  onConfirmDeviceType(event) {
    // 设备类型
    const {
      value
    } = event.detail;
    this.setData({
      deviceTypeValue: value,
      showPopup: 0,
    });
  },
  onConfirmBrand(event) {
    // 设备品牌
    const {
      value
    } = event.detail;
    this.setData({
      brandValue: value,
      showPopup: 0,
    });
  },
  onConfirmWarrantStatus(event) {
    // 保修状态
    const {
      value
    } = event.detail;
    this.setData({
      warrantStatusValue: value,
      showPopup: 0,
    });
  },
  onConfirmDeviceProblem(event) {
    // 设备问题
    const {
      value
    } = event.detail;
    this.setData({
      deviceProblemValue: value,
      showPopup: 0,
    });
  },
  formatDate(date) {
    date = new Date(date);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    // yy-mm-dd
    return `${year}-${month}-${day}`;
  },
  onConfirmPurchaseDate(event) {
    this.setData({
      showPopup: 0,
      purchaseDate: this.formatDate(event.detail),
    });
  },
  onClose() {
    this.setData({
      showPopup: 0,
    });
  },
  showPopup(event) {
    // console.log(event);
    this.setData({
      showPopup: parseInt(event.target.dataset.index),
    });
  },
  chooseImage() {
    const that = this;
    wx.chooseMedia({
      count: 4, // 可选择的图片数量
      // sizeType: ['compressed'], // 压缩图片
      mediaType: ["image"],
      sourceType: ["album", "camera"], // 来源：相册或相机
      camera: "back",
      success(res) {
        if (qiniuToken === "") {
          console.log("could not find token, generating one...");
          that.loadToken();
        }
        console.log(res);
        let temp_imageUrl = [];
        res.tempFiles.forEach((item) => {
          console.log("start uploading...");
          temp_imageUrl.push(that.uploadQiniu(item.tempFilePath));
        });
      },
    });
  },
  uploadQiniu(localFilePath) {
    var that = this;
    wx.uploadFile({
      // 七牛云华南API
      url: "https://upload-z2.qiniup.com",
      name: "file",
      filePath: localFilePath,
      header: {
        "Content-Type": "multipart/form-data",
      },
      formData: {
        token: qiniuToken,
        key: "fyMiniprogam/" + getUUid(),
      },
      success: function (res) {
        let data = JSON.parse(res.data);
        console.log("qiniu upload success!");
        let temp_imageUrl = that.data.imageUrl;
        console.log(res);
        temp_imageUrl.push("https://cdn.fyscu.com/" + data.key);
        that.setData({
          imageUrl: temp_imageUrl,
        });
      },
      fail: function (res) {
        console.log("failed to upload image:", res);
      },
    });
  },
  previewImage(event) {
    wx.previewImage({
      current: event.target.dataset.src,
      urls: this.data.imageUrl,
    });
  },
  deleteImage(event) {
    const image_src = event.target.dataset.src;
    let temp_imageUrl = this.data.imageUrl;
    const image_index = temp_imageUrl.indexOf(image_src); // 查找值的索引
    if (image_index !== -1) {
      temp_imageUrl.splice(image_index, 1); // 删除值
    }
    this.setData({
      imageUrl: temp_imageUrl,
    });
  },
  submitOrder() {
    if (
      this.data.qq === "" ||
      this.data.phone === "" ||
      this.data.campusValue === "请选择" ||
      this.data.problemDesc === ""
    ) {
      Toast("请先填写完整必要的信息。");
      return;
    }
    Dialog.confirm({
        title: "确认提交？",
        confirmButtonText: "确认",
        message: `提交后不可更改；技术员会通过您提交的信息联系您。`,
      })
      .then(() => {
        // on confirm
        Toast("提交订单成功");
      })
      .catch(() => {
        // on cancel
        console.log("用户已取消提交");
      });
  },
});