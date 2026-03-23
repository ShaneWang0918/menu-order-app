const { request } = require("../../utils/request");

function getNextSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return date.toISOString().split("T")[0];
  });
}

function formatDateLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${month}/${day} ${weekdays[date.getDay()]}`;
}

function buildSelectedSummary(items) {
  return items.reduce((result, dish) => {
    const existingDish = result.find((item) => item.id === dish.id);

    if (existingDish) {
      existingDish.count += 1;
      return result;
    }

    result.push({
      ...dish,
      count: 1,
    });
    return result;
  }, []);
}

Page({
  data: {
    loading: true,
    submitting: false,
    dishes: [],
    users: [],
    selectedItems: [],
    selectedSummary: [],
    selectedDate: "",
    selectedDateLabel: "请选择日期",
    dateOptions: [],
    dateLabels: [],
    userOptions: [],
    selectedUserId: "",
    selectedUserLabel: "请选择订餐人",
    message: "",
  },

  onShow() {
    this.loadPageData();
  },

  updateSelectionView(orderState, extraData = {}) {
    const dateLabels = extraData.dateLabels || this.data.dateLabels;
    const dateOptions = extraData.dateOptions || this.data.dateOptions;
    const userOptions = extraData.userOptions || this.data.userOptions;
    const selectedUserId =
      extraData.selectedUserId !== undefined ? extraData.selectedUserId : this.data.selectedUserId;
    const selectedDate = orderState.selectedDate;
    const selectedItems = Array.isArray(orderState.items) ? orderState.items : [];
    const selectedDateIndex = dateOptions.indexOf(selectedDate);
    const selectedUser = userOptions.find((item) => item.value === selectedUserId);

    this.setData({
      ...extraData,
      selectedDate,
      selectedItems,
      selectedSummary: buildSelectedSummary(selectedItems),
      selectedDateLabel: selectedDateIndex >= 0 ? dateLabels[selectedDateIndex] : "请选择日期",
      selectedUserId,
      selectedUserLabel: selectedUser ? selectedUser.label : "请选择订餐人",
    });
  },

  async loadPageData() {
    this.setData({
      loading: true,
      message: "",
    });

    try {
      const result = await request("/api/public/app-state");
      const dateOptions = getNextSevenDays();
      const selectedDate = dateOptions.includes(result.orderState.selectedDate)
        ? result.orderState.selectedDate
        : dateOptions[0];
      const dateLabels = dateOptions.map((date) => `${date}｜${formatDateLabel(date)}`);
      const userOptions = (result.users || []).map((user) => ({
        value: String(user.id),
        label: `${user.name}｜${user.team}`,
      }));

      this.updateSelectionView(
        {
          selectedDate,
          items: Array.isArray(result.orderState.items) ? result.orderState.items : [],
        },
        {
          loading: false,
          dishes: result.dishes || [],
          users: result.users || [],
          dateOptions,
          dateLabels,
          userOptions,
          selectedUserId: "",
          message: "",
        }
      );

      if (selectedDate !== result.orderState.selectedDate) {
        await this.saveOrderState({
          selectedDate,
          items: Array.isArray(result.orderState.items) ? result.orderState.items : [],
        });
      }
    } catch (error) {
      this.setData({
        loading: false,
        message: error.message || "加载失败，请稍后再试。",
      });
    }
  },

  async saveOrderState(orderState) {
    const result = await request("/api/public/order-state", {
      method: "PUT",
      data: {
        orderState,
      },
    });

    this.updateSelectionView(result.orderState);
  },

  async handleDateChange(event) {
    const index = Number(event.detail.value);
    const selectedDate = this.data.dateOptions[index];

    try {
      await this.saveOrderState({
        selectedDate,
        items: this.data.selectedItems,
      });
      this.setData({
        message: "",
      });
    } catch (error) {
      this.setData({
        message: error.message || "保存日期失败。",
      });
    }
  },

  handleUserChange(event) {
    const index = Number(event.detail.value);
    const user = this.data.userOptions[index];

    this.setData({
      selectedUserId: user ? user.value : "",
      selectedUserLabel: user ? user.label : "请选择订餐人",
    });
  },

  async handleAddDish(event) {
    const dishId = Number(event.currentTarget.dataset.id);
    const dish = this.data.dishes.find((item) => item.id === dishId);

    if (!dish) {
      return;
    }

    const nextItems = [...this.data.selectedItems, dish];

    try {
      await this.saveOrderState({
        selectedDate: this.data.selectedDate,
        items: nextItems,
      });
      this.setData({
        message: "",
      });
    } catch (error) {
      this.setData({
        message: error.message || "加入菜品失败。",
      });
    }
  },

  async handleRemoveDish(event) {
    const dishId = Number(event.currentTarget.dataset.id);
    const index = this.data.selectedItems.findIndex((item) => item.id === dishId);

    if (index === -1) {
      return;
    }

    const nextItems = [...this.data.selectedItems];
    nextItems.splice(index, 1);

    try {
      await this.saveOrderState({
        selectedDate: this.data.selectedDate,
        items: nextItems,
      });
      this.setData({
        message: "",
      });
    } catch (error) {
      this.setData({
        message: error.message || "移除菜品失败。",
      });
    }
  },

  async handleSubmitOrder() {
    if (!this.data.selectedItems.length) {
      this.setData({
        message: "请先加入至少一道菜。",
      });
      return;
    }

    if (!this.data.selectedUserId) {
      this.setData({
        message: "请选择订餐人。",
      });
      return;
    }

    this.setData({
      submitting: true,
      message: "",
    });

    try {
      const result = await request("/api/public/orders", {
        method: "POST",
        data: {
          userId: Number(this.data.selectedUserId),
        },
      });

      this.updateSelectionView(result.orderState, {
        submitting: false,
        selectedUserId: "",
        message: "订单提交成功。",
      });
    } catch (error) {
      this.setData({
        submitting: false,
        message: error.message || "提交订单失败。",
      });
    }
  },

});
