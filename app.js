const express = require("express");
const morgan = require("morgan"); // HTTP request logger middleware in nodejs
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongosanitize = require("express-mongo-sanitize");
const bodyParser = require("body-parser");
// const xss = require("xss"); //(cross side scripting) it make sures that req body does'nt contains any malicious or harmful code.
const cors = require("cors"); //(cross origin request ) it make sure that 2 parties can communicate and share their data with each other.
const routes = require("./routes/index");
const expressSession = require("express-session");
const passport = require("passport");
const userRouter = require("./models/user");
const connectFlash = require("connect-flash");
const app = express();
app.use(express.json({ limit: "10kb" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());

app.use(connectFlash());
app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: "Assalamualikum bhaijan",
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(userRouter.serializeUser());
passport.serializeUser(userRouter.deserializeUser());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "PATCH", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  max: 3000,
  windowMS: 1000 * 60 * 60,
  message: "Too many requests from this IP, Please try again after an hour",
});

app.use(express.urlencoded({ extended: true }));
app.use(mongosanitize());
// app.use(xss());

app.use("/tawk", limiter); // any request starting with "/tawk" then this limiter will be applied.
app.use(routes);

module.exports = app;
