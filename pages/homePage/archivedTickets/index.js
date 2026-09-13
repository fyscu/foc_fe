import Dialog from "@vant/weapp/dialog/dialog";
import Toast from "@vant/weapp/toast/toast";
import { getTicket, restoreArchive } from "../../../utils/req";

const app = getApp();

Page({
  data: {
    loading: true,
    archivedList: [],
  },
  onShow() {
    this.loadArchived();
  },
  loadArchived() {
    this.setData({ loading: true });
    getTicket({ uid: app.globalData.userInfo.uid }).then((code) => {
      if (code === 401) {
        Toast("鉴权失败，请刷新重试");
        this.setData({ loading: false });
        return;
      }
      if (code !== 200) {
        Toast("工单获取失败");
        this.setData({ loading: false });
        return;
      }
      const all = app.globalData.ticketList || [];
      const archived = all
        .filter(t => Number(t.archived) === 1)
        .sort((a, b) => {
          // 未恢复的排前，已恢复的排后；同组内按存档时间倒序
          if (!!a.restored_from !== !!b.restored_from) {
            return a.restored_from ? 1 : -1;
          }
          return (b.archived_at || '').localeCompare(a.archived_at || '');
        });
      this.setData({ archivedList: archived, loading: false });
    });
  },
  onRestore(e) {
    const archiveId = e.currentTarget.dataset.id;
    Dialog.confirm({
      title: '确认重新提交？',
      message: '将以「加急订单」形式排在普通报修队列前方。复用原订单信息，无需重新填写。',
      confirmButtonText: '重新提交',
    }).then(() => {
      wx.showLoading({ title: '提交中', mask: true });
      restoreArchive(archiveId).then((res) => {
        wx.hideLoading();
        if (res.code === 200) {
          Toast.success('提交成功，新工单 #' + res.orderid);
          setTimeout(() => {
            this.loadArchived();
          }, 800);
        } else if (res.code === 401) {
          Toast('鉴权失败，请重试');
        } else if (res.code === 409) {
          Toast(res.message || '您还有未完结的报修单');
        } else {
          Toast(res.message || '提交失败');
        }
      });
    }).catch(() => {});
  },
});
