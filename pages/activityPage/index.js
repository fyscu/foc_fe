// index.js
import Dialog from "@vant/weapp/dialog/dialog";
import Toast from "@vant/weapp/toast/toast";
import {
  getEvent,
  regevent,
  regrepair,
  getLuckynum
} from "../../utils/req";

var app = getApp();

Page({
  data: {
    statusList: ["未开始", "报名中", "报名结束", "进行中", "已结束", "未知"],
    departmentList: ["维修部", "研发部", "行政部", "设计部", "流媒部"],
    freeTimeList: ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00'],
    searchText: "",
    searchEmpty: true, // 没有搜索结果
    activities: [],
    activitiesShowing: {},
    activityId: 0,
    name: '',
    gender: '',
    hasName: true,
    departments: [],
    freeTimes: [],
    showPopup: false,
  },
  onShow() {
    this.initialize();
  },
  initialize() {
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
      const end_time = activity.end_time.replace(/-/g, "/");
      const signupStartTime = new Date(signup_start_time).getTime();
      const signupEndTime = new Date(signup_end_time).getTime();
      const endTime = new Date(end_time).getTime();
      // console.log(activity);
      if (now < signupStartTime) {
        activity.status = 0; // 报名未开始
      } else if (signupStartTime <= now && now <= signupEndTime) {
        activity.status = 1; // 报名进行中
        // activity.status = 2; // 报名已结束
      } else if (signupEndTime <= now && now <= endTime) {
        activity.status = 3; // 活动进行中
      } else if (now >= endTime) {
        activity.status = 4; // 活动已结束
      } else {
        activity.status = 5; // 未知状态
      }
    });
    this.setData({
      activities: activities
    });
  },
  navigateToNumberPage(event) {
    const activity = event.currentTarget.dataset.activity;
    getLuckynum(activity.id).then((ret) => {
      if (ret === 401) {
        Toast("鉴权失败，请刷新重试");
      } else if (ret === 500) {
        Toast("获取号码失败");
      } else if (ret === 404) {
        Toast("找不到号码");
      } else {
        wx.navigateTo({
          url: `/pages/activityPage/numberPage/index?luckynum=${ret.luckynum}&isWinner=${ret.is_winner}`,
        });
      }
    });
  },
  closePopup() {
    this.setData({
      showPopup: false
    });
  },
  onGenderChange(event) {
    this.setData({
      gender: event.detail,
    });
  },
  onNameChange(event) {
    this.setData({
      name: event.detail,
      hasName: event.detail !== ""
    });
  },
  toggleDepartmentsCheck(event) {
    const departments = this.data.departmentList[
      event.currentTarget.dataset.index
    ];
    const index = this.data.departments.indexOf(departments);
    if (index === -1) {
      this.setData({
        departments: [...this.data.departments, departments],
      });
    } else {
      this.data.departments.splice(index, 1);
      this.setData({
        departments: this.data.departments,
      });
    }
  },
  toggleFreeTimesCheck(event) {
    const freeTimes = this.data.freeTimeList[
      event.currentTarget.dataset.index
    ];
    const index = this.data.freeTimes.indexOf(freeTimes);
    if (index === -1) {
      this.setData({
        freeTimes: [...this.data.freeTimes, freeTimes],
      });
    } else {
      this.data.freeTimes.splice(index, 1);
      this.setData({
        freeTimes: this.data.freeTimes,
      });
    }
  },
  handleSignup(event) {
    const activity = event.currentTarget.dataset.activity;
    if (activity.status === 0) {
      Toast("报名尚未开始");
      return;
    }
    if (activity.status === 2) {
      Toast("报名已结束");
      return;
    }
    if (activity.status === 4) {
      Toast("活动已结束");
      return;
    }
    // 处理报名逻辑
    if (!app.globalData.isloggedin) {
      Toast("请先登录");
      return;
    }
    if (activity.type === '大修') {
      // 大修报名
      this.setData({
        showPopup: true,
        activityId: activity.id,
      });
    } else {
      Dialog.confirm({
        title: '报名确认',
        message: `确认报名活动${activity.name}吗？`,
      }).then(() => {
        regevent(activity.id).then((ret) => {
          if (ret === 401) {
            Toast("鉴权失败，请刷新重试");
          } else if (ret === 200) {
            Toast("报名成功");
            this.initialize();
          } else if (ret === 300) {
            Toast("您已报名");
          } else if (ret === 403) {
            Toast("请使用大修报名通道");
          } else {
            Toast("报名失败");
          }
        });
      }).catch(() => {
        console.log("取消报名");
      });
    }
  },
  handleRepairSignup() {
    if (this.data.name.trim() === "") {
      this.setData({ hasName: false });
      Toast("请输入姓名");
      return;
    }
    if (this.data.gender.trim() === "") {
      Toast("请选择性别");
      return;
    }
    this.setData({
      showPopup: false,
      activityId: 0,
    });
    Dialog.confirm({
      title: '报名确认',
      message: `确认报名本次大修吗？`,
    }).then(() => {
      regrepair(
        this.data.activityId,
        this.data.name,
        this.data.gender,
        this.data.departments,
        this.data.freeTimes,
        app.globalData.userInfo.uid,
      ).then((ret) => {
        if (ret === 401) {
          Toast("鉴权失败，请刷新重试");
        } else if (ret === 200) {
          Toast("报名成功");
          this.initialize();
        } else if (ret === 300) {
          Toast("您已报名");
        } else if (ret === 403) {
          Toast("此活动不是大修活动");
        } else {
          Toast("报名失败");
        }
      });
    }).catch(() => {
      console.log("取消报名");
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
