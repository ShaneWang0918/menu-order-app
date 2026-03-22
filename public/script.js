const defaultDishes = [
  {
    id: 1,
    name: "香煎鸡腿排",
    image: "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=900&q=80",
    ingredients: "鸡腿排、蒜头、黑胡椒、时令蔬菜",
  },
  {
    id: 2,
    name: "番茄海鲜意大利面",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80",
    ingredients: "意大利面、虾子、蛤蜊、番茄酱、洋葱",
  },
  {
    id: 3,
    name: "日式咖喱猪排饭",
    image: "https://images.unsplash.com/photo-1604908176997-4317c280a2c6?auto=format&fit=crop&w=900&q=80",
    ingredients: "猪排、咖喱酱、白饭、胡萝卜、马铃薯",
  },
  {
    id: 4,
    name: "牛油果沙拉碗",
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=900&q=80",
    ingredients: "牛油果、生菜、玉米、番茄、水煮蛋",
  },
];

const defaultUsers = [
  { id: 1, name: "小王", team: "设计组" },
  { id: 2, name: "小美", team: "工程组" },
  { id: 3, name: "小陈", team: "运营组" },
];

const dishesStorageKey = "menu-order-dishes";
const orderStorageKey = "today-order-dishes";
const usersStorageKey = "menu-order-users";
const orderHistoryStorageKey = "menu-order-history";
const apiBase = "/api";

function formatDateLabel(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
}

function getNextSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return date.toISOString().split("T")[0];
  });
}

function loadFromStorage(key, fallbackValue) {
  const savedValue = localStorage.getItem(key);

  if (!savedValue) {
    return fallbackValue;
  }

  try {
    const parsedValue = JSON.parse(savedValue);
    return parsedValue ?? fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data;
}

function normalizeAppData(data) {
  const defaults = getDefaultAppData();

  return {
    dishes: Array.isArray(data?.dishes) && data.dishes.length > 0 ? data.dishes : defaults.dishes,
    users: Array.isArray(data?.users) && data.users.length > 0 ? data.users : defaults.users,
    orderState:
      data?.orderState &&
      typeof data.orderState === "object" &&
      typeof data.orderState.selectedDate === "string" &&
      Array.isArray(data.orderState.items)
        ? data.orderState
        : defaults.orderState,
    orderHistory: Array.isArray(data?.orderHistory) ? data.orderHistory : defaults.orderHistory,
  };
}

async function uploadDishImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${apiBase}/admin/uploads/images`, {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.imageUrl) {
    throw new Error(data.message || "上传图片失败");
  }

  return data.imageUrl;
}

function loadDishes() {
  const storedDishes = loadFromStorage(dishesStorageKey, []);

  if (Array.isArray(storedDishes) && storedDishes.length > 0) {
    return storedDishes;
  }

  saveToStorage(dishesStorageKey, defaultDishes);
  return [...defaultDishes];
}

function getDefaultAppData() {
  return {
    dishes: cloneData(defaultDishes),
    users: cloneData(defaultUsers),
    orderState: {
      selectedDate: getNextSevenDays()[0],
      items: [],
    },
    orderHistory: [],
  };
}

function loadOrderState() {
  const fallbackDate = getNextSevenDays()[0];
  const storedOrder = loadFromStorage(orderStorageKey, {
    selectedDate: fallbackDate,
    items: [],
  });

  if (Array.isArray(storedOrder)) {
    return {
      selectedDate: fallbackDate,
      items: storedOrder,
    };
  }

  return {
    selectedDate:
      typeof storedOrder.selectedDate === "string" ? storedOrder.selectedDate : fallbackDate,
    items: Array.isArray(storedOrder.items) ? storedOrder.items : [],
  };
}

function loadUsers() {
  const storedUsers = loadFromStorage(usersStorageKey, []);

  if (Array.isArray(storedUsers) && storedUsers.length > 0) {
    return storedUsers;
  }

  saveToStorage(usersStorageKey, defaultUsers);
  return [...defaultUsers];
}

function loadOrderHistory() {
  const storedOrders = loadFromStorage(orderHistoryStorageKey, []);
  if (!Array.isArray(storedOrders)) {
    return [];
  }

  return storedOrders
    .filter((order) => order && typeof order === "object")
    .map((order) => ({
      id: order.id ?? Date.now(),
      userId: order.userId ?? null,
      userName: typeof order.userName === "string" && order.userName ? order.userName : "未指定用户",
      team: typeof order.team === "string" && order.team ? order.team : "未分类",
      totalItems: Number.isFinite(order.totalItems)
        ? order.totalItems
        : Array.isArray(order.items)
          ? order.items.reduce((sum, item) => sum + (Number(item.count) || 0), 0)
          : 0,
      orderDate:
        typeof order.orderDate === "string" && order.orderDate
          ? order.orderDate
          : getNextSevenDays()[0],
      completed: Boolean(order.completed),
      createdAt:
        typeof order.createdAt === "string" && order.createdAt
          ? order.createdAt
          : "无创建时间",
      items: Array.isArray(order.items)
        ? order.items
            .filter((item) => item && typeof item === "object")
            .map((item) => ({
              id: item.id ?? null,
              name: typeof item.name === "string" && item.name ? item.name : "未命名菜品",
              count: Number(item.count) > 0 ? Number(item.count) : 1,
            }))
        : [],
    }));
}

function getLegacyLocalData() {
  return {
    dishes: loadDishes(),
    users: loadUsers(),
    orderState: loadOrderState(),
    orderHistory: loadOrderHistory(),
  };
}

function hasLegacyLocalData() {
  return [dishesStorageKey, usersStorageKey, orderStorageKey, orderHistoryStorageKey].some((key) =>
    localStorage.getItem(key)
  );
}

function isDefaultAppData(data) {
  const defaultData = getDefaultAppData();

  return JSON.stringify(data.dishes) === JSON.stringify(defaultData.dishes) &&
    JSON.stringify(data.users) === JSON.stringify(defaultData.users) &&
    JSON.stringify(data.orderState) === JSON.stringify(defaultData.orderState) &&
    JSON.stringify(data.orderHistory) === JSON.stringify(defaultData.orderHistory);
}

async function loadPublicAppData() {
  return normalizeAppData(await requestJson(`${apiBase}/public/app-state`));
}

async function loadAdminAppData() {
  return normalizeAppData(await requestJson(`${apiBase}/admin/app-state`));
}

async function loadSharedAppData() {
  const serverData = await loadPublicAppData();
  const localData = getLegacyLocalData();

  if (hasLegacyLocalData() && isDefaultAppData(serverData) && !isDefaultAppData(localData)) {
    return normalizeAppData(await requestJson(`${apiBase}/app-data`, {
      method: "PUT",
      body: JSON.stringify(localData),
    }));
  }

  return serverData;
}

async function savePublicOrderState(orderState) {
  const response = await requestJson(`${apiBase}/public/order-state`, {
    method: "PUT",
    body: JSON.stringify({ orderState }),
  });

  return response.orderState;
}

async function createPublicOrder(userId) {
  return requestJson(`${apiBase}/public/orders`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

async function saveAdminDishes(dishes) {
  const response = await requestJson(`${apiBase}/admin/dishes`, {
    method: "PUT",
    body: JSON.stringify({ dishes }),
  });

  return response.dishes;
}

async function saveAdminUsers(users) {
  const response = await requestJson(`${apiBase}/admin/users`, {
    method: "PUT",
    body: JSON.stringify({ users }),
  });

  return response.users;
}

async function loadAdminOrderHistory() {
  const response = await requestJson(`${apiBase}/admin/orders`);
  return response.orderHistory;
}

async function completeOrderDate(orderDate) {
  const response = await requestJson(`${apiBase}/admin/orders/complete-date`, {
    method: "POST",
    body: JSON.stringify({ orderDate }),
  });

  return response.orderHistory;
}

function getLoginNextPath() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");

  if (!next || !next.startsWith("/")) {
    return "/orders.html";
  }

  return next;
}

function initializeAdminLayout() {
  const logoutButton = document.querySelector("#admin-logout-button");

  if (!logoutButton) {
    return;
  }

  logoutButton.addEventListener("click", async () => {
    try {
      await requestJson(`${apiBase}/admin/auth/logout`, {
        method: "DELETE",
      });
    } finally {
      window.location.href = "/login.html";
    }
  });
}

function initializeLoginPage() {
  const form = document.querySelector("#admin-login-form");
  const message = document.querySelector("#admin-login-message");

  if (!form || !message) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const password = String(formData.get("password") || "").trim();

    if (!password) {
      message.textContent = "请输入管理密码。";
      return;
    }

    try {
      await requestJson(`${apiBase}/admin/auth/login`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      window.location.href = getLoginNextPath();
    } catch (error) {
      message.textContent = "密码错误，请重新输入。";
    }
  });
}

function buildDishSummaryData(items) {
  return items.reduce((result, dish) => {
    const existingDish = result.find((item) => item.id === dish.id);

    if (existingDish) {
      existingDish.count += 1;
      return result;
    }

    result.push({ ...dish, count: 1 });
    return result;
  }, []);
}

function groupOrdersByDate(orderHistory) {
  const grouped = orderHistory.reduce((result, order) => {
    const existingDateGroup = result.find((item) => item.orderDate === order.orderDate);

    if (!existingDateGroup) {
      result.push({
        orderDate: order.orderDate,
        totalItems: order.totalItems,
        createdAtList: [order.createdAt],
        dishes: order.items.map((item) => ({
          name: item.name,
          totalCount: item.count,
          people: [{ name: order.userName, count: item.count }],
        })),
      });
      return result;
    }

    existingDateGroup.totalItems += order.totalItems;
    existingDateGroup.createdAtList.push(order.createdAt);

    order.items.forEach((item) => {
      const existingDish = existingDateGroup.dishes.find((dish) => dish.name === item.name);

      if (!existingDish) {
        existingDateGroup.dishes.push({
          name: item.name,
          totalCount: item.count,
          people: [{ name: order.userName, count: item.count }],
        });
        return;
      }

      existingDish.totalCount += item.count;
      const existingPerson = existingDish.people.find((person) => person.name === order.userName);

      if (!existingPerson) {
        existingDish.people.push({ name: order.userName, count: item.count });
        return;
      }

      existingPerson.count += item.count;
    });

    return result;
  }, []);

  return grouped.sort((a, b) => a.orderDate.localeCompare(b.orderDate));
}

function renderPendingOrderList(orderHistoryList, orderHistory) {
  const pendingOrders = orderHistory.filter((order) => !order.completed);

  if (pendingOrders.length === 0) {
    orderHistoryList.innerHTML = '<p class="empty-state">目前没有未完成订单。</p>';
    return;
  }

  const groupedOrders = groupOrdersByDate(pendingOrders);

  orderHistoryList.innerHTML = groupedOrders
    .map(
      (orderGroup) => `
        <article class="history-card pending-card">
          <div class="history-header">
            <div>
              <h3>${orderGroup.orderDate}｜${formatDateLabel(orderGroup.orderDate)}</h3>
              <p>共 ${orderGroup.totalItems} 份餐点｜创建记录 ${orderGroup.createdAtList.length} 笔</p>
            </div>
            <button class="complete-button" data-date="${orderGroup.orderDate}" type="button">已完成</button>
          </div>
          <ul class="summary-list">
            ${orderGroup.dishes
              .map(
                (dish) =>
                  `<li>${dish.name} x ${dish.totalCount}｜点菜人：${dish.people
                    .map((person) => `${person.name} x ${person.count}`)
                    .join("、")}</li>`
              )
              .join("")}
          </ul>
        </article>
      `
    )
    .join("");
}

function buildOrderStats(orderHistory) {
  return orderHistory.reduce((result, order) => {
    order.items.forEach((item) => {
      const existingDish = result.find((row) => row.name === item.name);

      if (!existingDish) {
        result.push({
          name: item.name,
          totalCount: item.count,
          people: [{ name: order.userName, count: item.count }],
        });
        return;
      }

      existingDish.totalCount += item.count;
      const existingPerson = existingDish.people.find((person) => person.name === order.userName);

      if (!existingPerson) {
        existingDish.people.push({ name: order.userName, count: item.count });
        return;
      }

      existingPerson.count += item.count;
    });

    return result;
  }, []);
}

function renderOrderStatsTable(tableBody, orderHistory, keyword) {
  const stats = buildOrderStats(orderHistory);
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredStats = stats.filter((row) => {
    if (!normalizedKeyword) {
      return true;
    }

    const peopleText = row.people.map((person) => person.name).join(" ");
    return (
      row.name.toLowerCase().includes(normalizedKeyword) ||
      peopleText.toLowerCase().includes(normalizedKeyword)
    );
  });

  if (filteredStats.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="3" class="empty-table">查不到符合条件的数据。</td></tr>';
    return;
  }

  tableBody.innerHTML = filteredStats
    .sort((a, b) => b.totalCount - a.totalCount)
    .map(
      (row) => `
        <tr>
          <td>${row.name}</td>
          <td>${row.totalCount}</td>
          <td>${row.people.map((person) => `${person.name} x ${person.count}`).join("、")}</td>
        </tr>
      `
    )
    .join("");
}

async function initializeHomePage() {
  const menuList = document.querySelector("#menu-list");
  const selectedList = document.querySelector("#selected-list");
  const orderSummary = document.querySelector("#order-summary");
  const orderDateSelect = document.querySelector("#order-date-select");
  const homeOrderForm = document.querySelector("#home-order-form");
  const homeOrderUser = document.querySelector("#home-order-user");
  const homeOrderMessage = document.querySelector("#home-order-message");

  if (
    !menuList ||
    !selectedList ||
    !orderSummary ||
    !orderDateSelect ||
    !homeOrderForm ||
    !homeOrderUser ||
    !homeOrderMessage
  ) {
    return;
  }

  const appData = await loadSharedAppData();
  const dishes = appData.dishes;
  const users = appData.users;
  const availableDates = getNextSevenDays();
  const orderState = appData.orderState;

  if (!availableDates.includes(orderState.selectedDate)) {
    orderState.selectedDate = availableDates[0];
  }

  orderState.items = orderState.items.filter((selectedDish) =>
    dishes.some((dish) => dish.id === selectedDish.id)
  );

  async function saveOrderState() {
    const savedOrderState = await savePublicOrderState(orderState);
    orderState.selectedDate = savedOrderState.selectedDate;
    orderState.items = savedOrderState.items;
  }

  function showHomeOrderMessage(message) {
    homeOrderMessage.textContent = message;
  }

  function renderMenu() {
    if (dishes.length === 0) {
      menuList.innerHTML = '<p class="empty-state">目前还没有菜品，请先到管理页新增。</p>';
      return;
    }

    menuList.innerHTML = dishes
      .map(
        (dish) => `
          <article class="dish-card">
            <img class="dish-image" src="${dish.image}" alt="${dish.name}" />
            <div class="dish-content">
              <h3 class="dish-name">${dish.name}</h3>
              <p class="dish-ingredients">食材：${dish.ingredients}</p>
              <button class="add-button" data-id="${dish.id}" type="button">加入今日订单</button>
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderSelectedDishes() {
    orderSummary.textContent = `${formatDateLabel(orderState.selectedDate)} 已选 ${orderState.items.length} 份餐点`;

    if (orderState.items.length === 0) {
      selectedList.innerHTML = '<p class="empty-state">目前还没有加入任何菜品。</p>';
      return;
    }

    const summary = buildDishSummaryData(orderState.items);

    selectedList.innerHTML = summary
      .map(
        (dish) => `
          <article class="selected-item">
            <div>
              <h4>${dish.name}</h4>
              <p>食材：${dish.ingredients}</p>
            </div>
            <div class="selected-actions">
              <span class="selected-count">x ${dish.count}</span>
              <button class="remove-button" data-id="${dish.id}" type="button">移除一份</button>
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderDateOptions() {
    orderDateSelect.innerHTML = availableDates
      .map(
        (date) =>
          `<option value="${date}" ${date === orderState.selectedDate ? "selected" : ""}>${date}｜${formatDateLabel(date)}</option>`
      )
      .join("");
  }

  function renderUserOptions() {
    if (users.length === 0) {
      homeOrderUser.innerHTML = '<option value="">请先到用户管理页新增用户</option>';
      return;
    }

    homeOrderUser.innerHTML = [
      '<option value="">请选择订餐人</option>',
      ...users.map((user) => `<option value="${user.id}">${user.name}｜${user.team}</option>`),
    ].join("");
  }

  menuList.addEventListener("click", async (event) => {
    const button = event.target.closest(".add-button");

    if (!button) {
      return;
    }

    const dishId = Number(button.dataset.id);
    const selectedDish = dishes.find((dish) => dish.id === dishId);

    if (!selectedDish) {
      return;
    }

    try {
      orderState.items.push(selectedDish);
      await saveOrderState();
      renderSelectedDishes();
    } catch (error) {
      orderState.items.pop();
      showHomeOrderMessage("保存订单失败，请刷新后重试。");
    }
  });

  selectedList.addEventListener("click", async (event) => {
    const button = event.target.closest(".remove-button");

    if (!button) {
      return;
    }

    const dishId = Number(button.dataset.id);
    const dishIndex = orderState.items.findIndex((dish) => dish.id === dishId);

    if (dishIndex === -1) {
      return;
    }

    const removedDish = orderState.items[dishIndex];
    try {
      orderState.items.splice(dishIndex, 1);
      await saveOrderState();
      renderSelectedDishes();
    } catch (error) {
      orderState.items.splice(dishIndex, 0, removedDish);
      showHomeOrderMessage("保存订单失败，请刷新后重试。");
    }
  });

  orderDateSelect.addEventListener("change", async () => {
    const previousDate = orderState.selectedDate;
    try {
      orderState.selectedDate = orderDateSelect.value;
      await saveOrderState();
      renderSelectedDishes();
    } catch (error) {
      orderState.selectedDate = previousDate;
      orderDateSelect.value = previousDate;
      showHomeOrderMessage("保存日期失败，请刷新后重试。");
    }
  });

  homeOrderForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (orderState.items.length === 0) {
      showHomeOrderMessage("目前没有可送出的餐点，请先加入菜品。");
      return;
    }

    const selectedUser = users.find((user) => user.id === Number(homeOrderUser.value));

    if (!selectedUser) {
      showHomeOrderMessage("请先选择订餐人。");
      return;
    }

    try {
      const response = await createPublicOrder(selectedUser.id);
      orderState.selectedDate = response.orderState.selectedDate;
      orderState.items = response.orderState.items;
      showHomeOrderMessage(`已为 ${selectedUser.name} 建立一笔订单。`);
      homeOrderForm.reset();
      renderUserOptions();
      renderSelectedDishes();
    } catch (error) {
      showHomeOrderMessage("建立订单失败，请刷新后重试。");
    }
  });

  renderMenu();
  renderDateOptions();
  renderSelectedDishes();
  renderUserOptions();
}

async function initializeDishesPage() {
  const form = document.querySelector("#dish-form");
  const dishesList = document.querySelector("#manage-dishes-list");
  const formMessage = document.querySelector("#form-message");
  const imageInput = document.querySelector('input[name="image"]');

  if (!form || !dishesList || !formMessage || !imageInput) {
    return;
  }

  const appData = await loadAdminAppData();
  let dishes = appData.dishes;

  async function saveDishes() {
    dishes = await saveAdminDishes(dishes);
  }

  function showMessage(message) {
    formMessage.textContent = message;
  }

  function renderDishes() {
    if (dishes.length === 0) {
      dishesList.innerHTML = '<p class="empty-state">目前没有菜品，请先新增一道菜。</p>';
      return;
    }

    dishesList.innerHTML = dishes
      .map(
        (dish) => `
          <article class="managed-dish-card">
            <img class="managed-dish-image" src="${dish.image}" alt="${dish.name}" />
            <div class="managed-dish-content">
              <h3>${dish.name}</h3>
              <p>食材：${dish.ingredients}</p>
            </div>
            <button class="remove-button" data-id="${dish.id}" type="button">删除菜品</button>
          </article>
        `
      )
      .join("");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = formData.get("name").trim();
    const imageFile = imageInput.files[0];
    const ingredients = formData.get("ingredients").trim();

    if (!name || !imageFile || !ingredients) {
      showMessage("请填写完整的菜名、上传图片与食材。");
      return;
    }

    try {
      const image = await uploadDishImage(imageFile);
      const newDish = {
        id: Date.now(),
        name,
        image,
        ingredients,
      };

      dishes.unshift(newDish);
      await saveDishes();
      renderDishes();
      showMessage(`已新增“${name}”`);
      form.reset();
    } catch (error) {
      showMessage(error.message || "新增菜品失败，请刷新后重试。");
    }
  });

  dishesList.addEventListener("click", async (event) => {
    const button = event.target.closest(".remove-button");

    if (!button) {
      return;
    }

    const dishId = Number(button.dataset.id);
    const previousDishes = [...dishes];
    try {
      dishes = dishes.filter((dish) => dish.id !== dishId);
      await saveDishes();
      renderDishes();
      showMessage("已删除一笔菜品。");
    } catch (error) {
      dishes = previousDishes;
      showMessage("删除菜品失败，请刷新后重试。");
    }
  });

  renderDishes();
}

async function initializeUsersPage() {
  const form = document.querySelector("#user-form");
  const userList = document.querySelector("#user-list");
  const userMessage = document.querySelector("#user-message");

  if (!form || !userList || !userMessage) {
    return;
  }

  const appData = await loadAdminAppData();
  let users = appData.users;

  async function saveUsers() {
    users = await saveAdminUsers(users);
  }

  function showMessage(message) {
    userMessage.textContent = message;
  }

  function renderUsers() {
    if (users.length === 0) {
      userList.innerHTML = '<p class="empty-state">目前没有订餐人，请先新增一位。</p>';
      return;
    }

    userList.innerHTML = users
      .map(
        (user) => `
          <article class="simple-card">
            <div>
              <h3>${user.name}</h3>
              <p>部门：${user.team}</p>
            </div>
            <button class="remove-button" data-id="${user.id}" type="button">删除用户</button>
          </article>
        `
      )
      .join("");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = formData.get("name").trim();
    const team = formData.get("team").trim();

    if (!name || !team) {
      showMessage("请填写完整的姓名与部门。");
      return;
    }

    const newUser = {
      id: Date.now(),
      name,
      team,
    };

    try {
      users.unshift(newUser);
      await saveUsers();
      renderUsers();
      form.reset();
      showMessage(`已新增用户“${name}”`);
    } catch (error) {
      users = users.filter((user) => user.id !== newUser.id);
      showMessage("新增用户失败，请刷新后重试。");
    }
  });

  userList.addEventListener("click", async (event) => {
    const button = event.target.closest(".remove-button");

    if (!button) {
      return;
    }

    const userId = Number(button.dataset.id);
    const previousUsers = [...users];
    try {
      users = users.filter((user) => user.id !== userId);
      await saveUsers();
      renderUsers();
      showMessage("已删除一位用户。");
    } catch (error) {
      users = previousUsers;
      showMessage("删除用户失败，请刷新后重试。");
    }
  });

  renderUsers();
}

async function initializeOrdersPage() {
  const pendingOrderList = document.querySelector("#pending-order-list");
  const orderMessage = document.querySelector("#order-message");
  const orderStatsBody = document.querySelector("#order-stats-body");
  const orderStatsSearch = document.querySelector("#order-stats-search");

  if (!pendingOrderList || !orderMessage || !orderStatsBody || !orderStatsSearch) {
    return;
  }

  let orderHistory = await loadAdminOrderHistory();

  function showMessage(message) {
    orderMessage.textContent = message;
  }

  function renderOrdersPage() {
    renderPendingOrderList(pendingOrderList, orderHistory);
    renderOrderStatsTable(orderStatsBody, orderHistory, orderStatsSearch.value);
  }

  pendingOrderList.addEventListener("click", async (event) => {
    const button = event.target.closest(".complete-button");

    if (!button) {
      return;
    }

    const selectedDate = button.dataset.date;
    try {
      orderHistory = await completeOrderDate(selectedDate);
      renderOrdersPage();
      showMessage(`${selectedDate} 的订单已标记为完成。`);
    } catch (error) {
      showMessage("更新订单状态失败，请重新登录后再试。");
    }
  });

  orderStatsSearch.addEventListener("input", () => {
    renderOrderStatsTable(orderStatsBody, orderHistory, orderStatsSearch.value);
  });

  renderOrdersPage();
}

initializeAdminLayout();
initializeLoginPage();
initializeHomePage();
initializeDishesPage();
initializeUsersPage();
initializeOrdersPage();
