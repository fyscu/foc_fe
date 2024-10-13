// index.js
import Toast from "@vant/weapp/toast/toast";
import { getEvent, regevent } from "../../utils/req";

var app = getApp();

Page({
  data: {
    statusList: ["未开始", "进行中", "已结束"],
    searchText: "",
    searchEmpty: true, // 没有搜索结果
    activities: [],
    activitiesShowing: {},
  },
  onShow() {
    // 初始化 activity
    getEvent().then((ret) => {
      if (ret === 401) {
        Toast("鉴权失败，请刷新重试");
      } else if (ret === 500) {
        Toast("获取活动失败");
      } else if (ret === 404) {
        Toast("找不到活动");
      } else {
        this.setData({ activities: ret });
        this.setActivityStatus();
        this.search("");
      }
    });
  },
  setActivityStatus() {
    const now = new Date().getTime();
    let activities = this.data.activities;
    activities.forEach((activity) => {
      // yyyy-MM-dd HH:mm:ss -> yyyy/MM/dd HH:mm:ss
      const signup_start_time = activity.signup_start_time.replace(/-/g, "/");
      const signup_end_time = activity.signup_end_time.replace(/-/g, "/");
      const signupStartTime = new Date(signup_start_time).getTime();
      const signupEndTime = new Date(signup_end_time).getTime();
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
