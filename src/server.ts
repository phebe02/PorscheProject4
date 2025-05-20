
import express from "express";
import path from "path";
import mongoose from "mongoose";
import fetch from "node-fetch";
import Porsche from "./models/Porsche";
import Factory from "./models/Factory";
import session from "express-session";
import bcrypt from "bcrypt";
import User from "./models/User";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI!;

//session middleware
app.use(session({
    secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false
}));
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "src", "views"));
app.use(express.static(path.join(__dirname, "..", "public")));

mongoose.connect(MONGO_URI).then(async () => {
  console.log("✅ Verbonden met MongoDB");

  const factoryCount = await Factory.countDocuments();
  if (factoryCount === 0) {
    console.log("📥 Geen fabrieken gevonden. Importeren van GitHub...");
    const response = await fetch("https://raw.githubusercontent.com/phebe02/porscheProject/main/data/factories.json");
    const factories = await response.json();
    await Factory.insertMany(factories);
    console.log("✅ Fabrieken geïmporteerd naar MongoDB");
  }

  const count = await Porsche.countDocuments();
  if (count === 0) {
    console.log("📥 Geen Porsches gevonden. Importeren van GitHub...");
    const response = await fetch("https://raw.githubusercontent.com/phebe02/porscheProject/main/data/porsches.json");
    const data = await response.json();
    await Porsche.insertMany(data);
    console.log("✅ Data geïmporteerd naar MongoDB");
  }
});

app.get("/", requireLogin, async (req, res) => {
  const porsches = await Porsche.find();
  res.render("index", { porsches });
});

app.get("/detail", async (req, res) => {
  const porsche = await Porsche.findOne({ id: req.query.id });
  res.render("detail", { porsche });
});

app.get("/edit", async (req, res) => {
  const porsche = await Porsche.findOne({ id: req.query.id });
  res.render("edit", { porsche });
});

app.post("/edit", async (req, res) => {
  const { id, name, price, category, isAvailable } = req.body;
  await Porsche.updateOne({ id }, { name, price, category, isAvailable: isAvailable === "on" });
  res.redirect(`/detail?id=${id}`);
});

app.listen(PORT, () => {
  console.log(`🚀 Server actief op http://localhost:${PORT}`);
});

app.get("/factories", async (req, res) => {
  const factories = await Factory.find();
  res.render("factories", { factories });
});

app.get("/factory", async (req, res) => {
  const factory = await Factory.findOne({ id: req.query.id });
  res.render("factory", { factory });
});


app.get("/edit-factory", async (req, res) => {
  const factory = await Factory.findOne({ id: req.query.id });
  res.render("edit-factory", { factory });
});

app.post("/edit-factory", async (req, res) => {
  const { id, name, location, founded, isElectricCertified } = req.body;
  await Factory.updateOne({ id }, {
    name,
    location,
    founded,
    isElectricCertified: isElectricCertified === "true"
  });
  res.redirect(`/factory?id=${id}`);
});


app.post("/delete", async (req, res) => {
  await Porsche.deleteOne({ id: req.body.id });
  res.redirect("/");
});

app.post("/delete-factory", async (req, res) => {
  await Factory.deleteOne({ id: req.body.id });
  res.redirect("/factories");
});



app.use(session({
  secret: "geheim",
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

async function createDefaultUsers() {
  const count = await User.countDocuments();
  if (count === 0) {
    const admin = new User({
      username: "admin",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "ADMIN"
    });
    const user = new User({
      username: "user",
      passwordHash: await bcrypt.hash("user123", 10),
      role: "USER"
    });
    await admin.save();
    await user.save();
    console.log("✅ Default users aangemaakt");
  }
}

createDefaultUsers();

function requireLogin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.user || req.session.user.role !== "ADMIN") {
    return res.status(403).send("⛔ Geen toegang");
  }
  next();
}
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});
app.post("/login", async (req, res) => {
  const username = typeof req.body.username === "string" ? req.body.username : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  const user = await User.findOne({ username });

  const isValid = user && await bcrypt.compare(password, user.passwordHash ?? "");

  if (
    !isValid ||
    !user ||
    typeof user.username !== "string" ||
    typeof user.role !== "string"
  ) {
    return res.render("login", { error: "❌ Ongeldige login" });
  }

  req.session.user = {
    username: user.username,
    role: user.role,
  };

  res.redirect("/");
});







app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const bestaat = await User.findOne({ username });
  if (bestaat) return res.render("register", { error: "⚠️ Gebruikersnaam bestaat al" });
  const hash = await bcrypt.hash(password, 10);
  await User.create({ username, passwordHash: hash, role: "USER" });
  res.redirect("/login");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});
