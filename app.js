// app.js
App({
  systemInfo: null,
  towxml: require('/towxml/index'),
  globalData: {
    rootApiUrl: 'https://focapi.feiyang.ac.cn',
    sysConfig: null, // 全剧配置
    ticketList: [], // 工单列表
    isloggedin: false, // 是否登录
    userInfo: {
      // is_tech: false, // 是否为技术员
      qq: "", // 用户QQ号
      uid: "", // 用户id
      role: "", // 用role替代is_tech
      email: "", // 用户邮箱
      phone: "", // 用户手机号
      campus: "", // 所在校区
      nickname: "", // 用户昵称
      avatarUrl: "https://img1.doubanio.com/view/group_topic/l/public/p560183288.webp", // 默认用户头像地址
    },
    code: null,
    openid: null, // 唯一用户标识
    accessToken: null, // 关于 AT: https://fyapidocs.wjlo.cc/get_started/prepare
  },
  // 定义全局变量
  onLaunch() {
    // 获取全局配置
    this.systemInfo = wx.getSystemInfoSync();
    var globalData = this.globalData;
    wx.login({
      success: (res) => {
        if (res.code) {
          globalData.code = res.code;
          console.log('code:', res.code);
          wx.request({
            url: globalData.rootApiUrl + '/v1/user/login',
            method: "POST",
            header: {
              'content-type': 'application/json',
            },
            data: {
              'code': globalData.code,
            },
            success(apiRes) {
              let result = apiRes.data;
              if (result.success) {
                if (result.openid) {
                  // 成功获取用户OpenId
                  globalData.openid = result.openid;
                }
                if (result.registered) {
                  // 用户已经注册
                  console.log('用户已注册:', result);
                  globalData.accessToken = result.access_token;
                  // 设置用户信息
                  globalData.userInfo.uid = result.uid;
                  globalData.userInfo.role = result.role;
                  globalData.userInfo.email = result.email;
                  globalData.userInfo.phone = result.phone;
                  globalData.userInfo.campus = result.campus;
                  globalData.userInfo.nickname = result.nickname;
                  globalData.userInfo.avatarUrl = result.avatar;
                  // 设置技术员信息
                  if (result.role === "technician") {
                    globalData.userInfo.wants = result.wants;
                    globalData.userInfo.available = result.available;
                  }
                  // 成功登录
                  globalData.isloggedin = true;
                  wx.reLaunch({
                    url: '/pages/homePage/index', // 假设首页是 /pages/index/index
                  });
                } else {
                  // 用户尚未注册
                  console.log('用户尚未注册:', result);
                  globalData.accessToken = result.access_token;
                }
              } else {
                console.log('请求失败:', result);
              }
            },
            complete() {
              console.log('requesting /user/login complete.');
            },
          })
        } else {
          console.log('获取code失败:', res);
        }
      },
    });
  },
});

// 全局配置sysConfig示例：
// ```json
// [
//     {
//         "data": "1",
//         "info": "全局报修开关",
//         "name": "Global_Flag"
//     },
//     {
//         "data": "2024",
//         "info": "全局年份时间",
//         "name": "Global_Year"
//     },
//     {
//         "data": "1.送修前请移除电源外其余外设配件,\n\n（包括鼠标 接收器 U盘 内存卡等）\n\n2.如要更换配件，请提前购买准备好\n\n3.如需重装系统，送修前电脑充满电\n\n4.请备份好数据，不对丢失数据负责\n\n5.我们不是万能，不保证一定能修好\n",
//         "info": "全局公告内容",
//         "name": "Global_Tips"
//     },
//     {
//         "data": "20",
//         "info": "每天提交限额",
//         "name": "Global_Days"
//     },
//     {
//         "data": "90",
//         "info": "每周提交限额",
//         "name": "Global_Week"
//     },
//     {
//         "data": "240",
//         "info": "每月提交限额",
//         "name": "Global_Mont"
//     },
//     {
//         "data": "10",
//         "info": "全局超时时间",
//         "name": "Global_Time"
//     },
//     {
//         "data": "10",
//         "info": "用户每天限额",
//         "name": "Limits_Days"
//     },
//     {
//         "data": "40",
//         "info": "用户每周限额",
//         "name": "Limits_Week"
//     }
// ]
// ```
