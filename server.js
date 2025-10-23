import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Security: block access to sensitive files/paths before static middleware ---
app.use((req, res, next) => {
  const p = req.path || "";
  const forbiddenPrefixes = [
    "/server.js",
    "/.bolt",
    "/.env",
    "/package.json",
    "/package-lock.json",
    "/node_modules",
  ];
  for (const pref of forbiddenPrefixes) {
    if (p === pref || p.startsWith(pref + "/") || p.endsWith(pref)) {
      return res.status(404).send("Not found");
    }
  }
  const forbiddenFiles = ["server.js", ".bolt", ".env", "config.json"];
  const base = path.basename(p);
  if (forbiddenFiles.includes(base)) return res.status(404).send("Not found");
  next();
});

// --- FRONTEND: serve project root as static (index.html is in root) ---
const FRONTEND_DIR = __dirname;
app.use(express.static(FRONTEND_DIR));
console.log("[+] Serving frontend from:", FRONTEND_DIR);

// --- Load HMAC key from .bolt/config.json if present ---
let HMAC_KEY = "default-dev-key";
try {
  const cfgPath = path.join(__dirname, ".bolt", "config.json");
  if (fs.existsSync(cfgPath)) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    if (cfg.hmac_key) HMAC_KEY = cfg.hmac_key;
  }
} catch {
  console.warn("Could not load .bolt/config.json -> using default key");
}

// --- Data ---
let users = [
  { username: "test", password: "1234", fullName: "Test User", email: "test@example.com", balance: 5000 }
];

let products = [
  { id: "kebab1", name: "Kebab Spesial", price: 9999, description: "Kebab enak", image: "/assets/shawarma.jpeg" }
];

let orders = [];
let carts = [];

// --- Helper ---
function makeSignature(productId, quantity, total) {
  const payload = `${productId}|${quantity}|${total}`;
  return crypto.createHmac("sha256", HMAC_KEY).update(payload).digest("hex");
}

// --- Vulnerable endpoints ---
app.post("/create_cart", (req, res) => {
  const { username, productId, quantity } = req.body;
  const user = users.find(u => u.username === username);
  const product = products.find(p => p.id === productId);
  if (!user || !product) return res.status(404).json({ ok: false, error: "user/product not found" });

  const serverTotal = Number(product.price) * Number(quantity);
  const signature = makeSignature(productId, quantity, serverTotal);
  const cart = { id: `cart-${Date.now()}`, username, productId, quantity: Number(quantity), total: Number(serverTotal), signature };
  carts.push(cart);
  return res.json({ ok: true, cart });
});

app.post("/checkout", (req, res) => {
  const { username, cart } = req.body;
  if (!username || !cart) return res.status(400).json({ ok: false, error: "missing fields" });
  const { productId, quantity, total, signature } = cart;
  const user = users.find(u => u.username === username);
  const product = products.find(p => p.id === productId);
  if (!user || !product) return res.status(404).json({ ok: false, error: "user/product not found" });

  const expectedSig = makeSignature(productId, quantity, total);
  console.log("Checkout attempt:", { username, productId, quantity, total, providedSig: signature, expectedSig });

  user.balance = Number(user.balance) - Number(total);
  const order = { id: orders.length + 1, username, productId, quantity: Number(quantity), charged: Number(total), createdAt: new Date().toISOString(), status: "PAID" };
  orders.push(order);

  return res.json({ ok: true, message: "Pembelian berhasil (vulnerable lab variant)", order, balance: user.balance });
});

// --- Debug ---
app.get("/products", (req, res) => res.json({ ok: true, products }));
app.get("/user/:username", (req, res) => {
  const u = users.find(x => x.username === req.params.username);
  if (!u) return res.status(404).json({ ok: false });
  return res.json({ ok: true, user: u });
});
app.get("/orders", (req, res) => res.json({ ok: true, orders }));
app.get("/carts", (req, res) => res.json({ ok: true, carts }));
app.post("/admin/reset", (req, res) => {
  users = users.map(u => ({ ...u, balance: 5000 }));
  orders = [];
  carts = [];
  return res.json({ ok: true, message: "Lab reset: balances/orders cleared" });
});

// --- SPA fallback ---
app.get(/.*/, (req, res) => {
  const indexPath = path.join(FRONTEND_DIR, "index.html");
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  return res.status(404).send("Not Found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`VAPT lab running at http://localhost:${PORT}`));
