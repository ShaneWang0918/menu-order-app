const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = 3000;
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "store.json");

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

function getDefaultOrderDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString().split("T")[0];
}

function createDefaultStore() {
  return {
    dishes: defaultDishes,
    users: defaultUsers,
    orderState: {
      selectedDate: getDefaultOrderDate(),
      items: [],
    },
    orderHistory: [],
  };
}

function ensureStoreFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(createDefaultStore(), null, 2));
  }
}

function readStore() {
  ensureStoreFile();

  try {
    const content = fs.readFileSync(dataFile, "utf8");
    const parsed = JSON.parse(content);

    return {
      ...createDefaultStore(),
      ...parsed,
    };
  } catch (error) {
    const fallbackStore = createDefaultStore();
    fs.writeFileSync(dataFile, JSON.stringify(fallbackStore, null, 2));
    return fallbackStore;
  }
}

function writeStore(store) {
  ensureStoreFile();
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running" });
});

app.get("/api/app-data", (req, res) => {
  res.json(readStore());
});

app.put("/api/app-data", (req, res) => {
  const store = {
    ...createDefaultStore(),
    ...req.body,
  };

  writeStore(store);
  res.json(store);
});

app.put("/api/dishes", (req, res) => {
  const store = readStore();
  store.dishes = Array.isArray(req.body.dishes) ? req.body.dishes : store.dishes;
  writeStore(store);
  res.json(store);
});

app.put("/api/users", (req, res) => {
  const store = readStore();
  store.users = Array.isArray(req.body.users) ? req.body.users : store.users;
  writeStore(store);
  res.json(store);
});

app.put("/api/order-state", (req, res) => {
  const store = readStore();
  store.orderState = req.body.orderState ?? store.orderState;
  writeStore(store);
  res.json(store);
});

app.put("/api/order-history", (req, res) => {
  const store = readStore();
  store.orderHistory = Array.isArray(req.body.orderHistory) ? req.body.orderHistory : store.orderHistory;
  writeStore(store);
  res.json(store);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
