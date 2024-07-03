// index.js
import Toast from "@vant/weapp/toast/toast";
// var api = require("./includeAPI.wxs");

Page({
  data: {
    searchValue: "",
    activities: [{
        "name": "江安大修",
        "type": 1,
        "description": "江安大修是飞扬俱乐部举办的面向全校的大型公益维修活动，任何干事都可参加，获得相应的志愿时长",
        "start_time": "2024/8/3 8:00:00",
        "signup_start_time": "2024/6/3 12:00:00",
        "signup_end_time": "2024/7/23 12:00:00",
      },
      {
        "name": "望江大修",
        "type": 1,
        "description": "望江大修是飞扬俱乐部举办的面向全校的大型公益维修活动，任何干事都可参加，获得相应的志愿时长",
        "start_time": "2024/7/3 8:00:00",
        "signup_start_time": "2024/6/3 12:00:00",
        "signup_end_time": "2024/6/23 12:00:00",
      },
      {
        "name": "雷锋月 江安大修",
        "type": 1,
        "description": "雷锋月大修活动",
        "start_time": "2024/7/3 8:00:00",
        "signup_start_time": "2024/6/3 12:00:00",
        "signup_end_time": "2024/6/23 12:00:00",
      },
    ]
  },
  onLoad() {
    // 获取activity
    this.processActivities();
  },
  processActivities() {
    let activities = this.data.activities;
    activities.forEach((activity, index) => {
      const now = new Date().getTime();
      const signupStartTime = new Date(activity.signup_start_time).getTime();
      const signupEndTime = new Date(activity.signup_end_time).getTime();
      activity.can_signup = now >= signupStartTime && now <= signupEndTime;
      // console.log(activity);
      if (now < signupStartTime) {
        activity.tag_text = '未开始';
      } else if (now > signupEndTime) {
        activity.tag_text = '已结束';
      } else {
        activity.tag_text = '报名中';
      }
    });
    this.setData({
      activities: activities
    });
  },
  handleSignup(event) {
    const activity = event.currentTarget.dataset.activity;
    // 处理报名逻辑
    console.log(`报名活动: ${activity.name}`);
  }
});