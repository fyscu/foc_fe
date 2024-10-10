Page({
  data: {
    number_status: 0, // 默认状态，可以通过onLoad或其他方式设置
    your_number: '0', // 默认号码，可以通过onLoad或其他方式设置
    ctx: null,
    width: 0,
    height: 0,
    particles: [],
    animationFrameId: null,
    isAnimating: false
  },

  onLoad(options) {
    const ctx = wx.createCanvasContext('confettiCanvas', this);
    this.setData({ ctx });

    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          width: res.windowWidth,
          height: res.windowHeight
        });
      }
    });

    // 假设你通过options传递number_status和your_number
    if (options.status !== undefined) {
      this.setData({
        number_status: parseInt(options.status),
        your_number: options.number || this.data.your_number
      }, () => {
        // 撒花效果
        console.log("撒花");
        this.startConfetti();
      });
    }
  },


  // 启动撒彩纸动画
  startConfetti: function () {
    if (this.data.isAnimating) return; // 防止重复启动
    this.setData({ isAnimating: true });

    // 初始化粒子
    this.initParticles(100); // 生成100个彩纸粒子

    // 开始动画循环
    this.animate();
  },

  // 初始化粒子数组
  initParticles: function (count) {
    const particles = [];
    const colors = ['#FFC107', '#FF4081', '#3F51B5', '#4CAF50', '#00BCD4', '#E91E63'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * this.data.width, // 随机 x 坐标
        y: Math.random() * this.data.height - this.data.height, // 初始位置在屏幕上方
        width: Math.random() * 5 + 3, // 随机宽度
        height: Math.random() * 15 + 5, // 随机高度
        speedX: Math.random() * 2 - 1, // 水平速度
        speedY: Math.random() * 2 + 1, // 垂直速度
        rotation: Math.random() * 360, // 初始旋转角度
        rotationSpeed: Math.random() * 10 - 5, // 旋转速度
        color: colors[Math.floor(Math.random() * colors.length)] // 随机颜色
      });
    }

    this.setData({ particles });
  },

  // 动画循环
  animate: function () {
    if (!this.data.isAnimating) return;

    const ctx = this.data.ctx;
    const { width, height, particles } = this.data;

    // 清除 Canvas
    ctx.clearRect(0, 0, width, height);

    // 更新和绘制每个粒子
    particles.forEach((particle, index) => {
      // 更新速度
      particle.speedY += 0.08; // 应用重力
      particle.speedX *= 0.99; // 应用空气阻力
      particle.speedY *= 0.99;

      // 更新位置
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.rotation += particle.rotationSpeed;

      // 重置粒子位置如果超出屏幕
      if (particle.y > height) {
        // 从粒子数组中移除粒子
        particles.splice(index, 1); // 移除该粒子
      } else {
        // 绘制粒子为长条矩形
        ctx.save();
        ctx.translate(particle.x + particle.width / 2, particle.y + particle.height / 2);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.setFillStyle(particle.color);
        ctx.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
        ctx.restore();
      }
    });

    // 更新粒子数组
    this.setData({ particles });

    // 渲染 Canvas
    ctx.draw();

    // 请求下一帧
    const animationFrameId = setTimeout(() => {
      this.animate();
    }, 16); // 大约60帧每秒
    this.setData({ animationFrameId });
  },

  // 停止动画（可选）
  stopConfetti: function () {
    if (!this.data.isAnimating) return;
    this.setData({ isAnimating: false });
    clearTimeout(this.data.animationFrameId);
  },

  onUnload: function () {
    // 页面卸载时停止动画
    this.stopConfetti();
  }
});
