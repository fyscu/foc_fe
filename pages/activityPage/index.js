// index.js
import Toast from "@vant/weapp/toast/toast";
import { regevent } from "../../utils/req";

var app = getApp();

Page({
  data: {
    statusList: ["未开始", "进行中", "已结束"],
    searchText: "",
    searchEmpty: true, // 没有搜索结果
    activities: [{
      "name": "江安大修",
      "type": 1,
      "description": "江安大修是飞扬俱乐部举办的面向全校的大型公益维修活动，任何干事都可参加，获得相应的志愿时长",
      "start_time": "2024/8/3 8:00:00",
      "signup_start_time": "2024/6/3 12:00:00",
      "signup_end_time": "2024/9/2 12:00:00",
      "poster": "https://cdn.feiyang.ac.cn/fyMiniprogam/%E6%9C%9B%E6%B1%9F%E5%A4%A7%E4%BF%AE.JPG"
    },
    {
      "name": "雷锋月 江安大修",
      "type": 1,
      "description": "雷锋月大修活动",
      "start_time": "2024/7/3 8:00:00",
      "signup_start_time": "2024/6/3 12:00:00",
      "signup_end_time": "2024/6/23 12:00:00",
      "poster": "https://cdn.feiyang.ac.cn/fyMiniprogam/%E9%9B%B7%E9%94%8B%E6%9C%88%E5%A4%A7%E4%BF%AE.jpg"
    },
    {
      "name": "年终晚会",
      "type": 2,
      "description": "飞扬20周年年终晚会",
      "start_time": "2024/7/3 8:00:00",
      "signup_start_time": "2024/6/3 12:00:00",
      "signup_end_time": "2024/9/4 12:00:00",
      "poster": "https://cdn.feiyang.ac.cn/fyMiniprogam/%E5%B9%B4%E7%BB%88%E6%99%9A%E4%BC%9A%E5%B1%95%E6%9D%BF.png"
    },
    {
      "name": "购机讲座",
      "type": 3,
      "description": "飞扬俱乐部·2024 购机讲座，新生买电脑需要注意哪些坑？",
      "start_time": "2024/9/3 8:00:00",
      "signup_start_time": "2024/6/3 12:00:00",
      "signup_end_time": "2024/8/23 12:00:00",
      "poster": "https://cdn.feiyang.ac.cn/fyMiniprogam/%E8%B4%AD%E6%9C%BA%E8%AE%B2%E5%BA%A7%E5%A4%A7.jpeg"
    },
    {
      "name": "会员大会",
      "type": 3,
      "description": "飞扬俱乐部·2024 会员大会，快来了解我们吧",
      "start_time": "2024/7/3 8:00:00",
      "signup_start_time": "2024/6/3 12:00:00",
      "signup_end_time": "2024/6/23 12:00:00",
      "poster": "https://cdn.feiyang.ac.cn/fyMiniprogam/%E4%BC%9A%E5%91%98%E5%A4%A7%E4%BC%9A.JPG"
    }],
    activitiesShowing: {},
  },
  onLoad(options) {
    // 初始化 activity
    // TODO：从后端获取 activities
    this.setActivityStatus();
    this.search("");
  },
  setActivityStatus() {
    const now = new Date().getTime();
    let activities = this.data.activities;
    activities.forEach((activity) => {
      const signupStartTime = new Date(activity.signup_start_time).getTime();
      const signupEndTime = new Date(activity.signup_end_time).getTime();
      // console.log(activity);
      if (now < signupStartTime) {
        activity.status = 0;
      } else if (now > signupEndTime) {
        activity.status = 2;
      } else {
        activity.status = 1;
      }
    });
    this.setData({
      activities: activities
    });
  },
  handleSignup(event) {
    const activity = event.currentTarget.dataset.activity;
    if (activity.status === 0) {
      Toast("活动尚未开始");
      return;
    }
    if (activity.status === 2) {
      Toast("活动已结束");
      return;
    }
    // 处理报名逻辑
    console.log(`报名活动: ${activity.name}`);
    if (!app.globalData.isloggedin) {
      Toast("请先登录");
      return;
    }
    if (activity.type === 1) {
      // 大修报名
      Toast("抱歉，该功能仍在开发中");
      return;
    }
    regevent(activity.name).then((returnCode) => {
      if (returnCode === 401) {
        Toast("鉴权失败，请刷新重试");
      } else if (returnCode === 200) {
        Toast("报名成功");
      } else if (returnCode === 403) {
        Toast("请使用大修报名通道");
      } else {
        Toast("报名失败");
      }
    });
  },
  onSearchChange(event) {
    this.setData({
      searchText: event.detail,
    });
    this.search(this.data.searchText);
  },
  search(text) {
    // 如果搜索文本为空，显示所有活动。
    if (text.trim() === "") {
      this.setData({
        searchEmpty: this.data.activities.length === 0,
        activitiesShowing: this.data.activities,
      });
      return;
    };
    // 不为空，则过滤
    let matchedActivities = this.data.activities.filter(activity =>
      activity.name.includes(text) ||
      activity.description.includes(text)
    );
    this.setData({
      searchEmpty: matchedActivities.length === 0,
      activitiesShowing: matchedActivities,
    });
  }
});
