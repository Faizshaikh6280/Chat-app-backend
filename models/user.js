const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const DB = process.env.DBURI;
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
mongoose
  .connect(DB)
  .then((con) => console.log("DB connection is succesfull!"))
  .catch((err) => console.log(err));

process.on("uncaughtException", (err) => {
  console.log(err);
  process.exit(1);
});

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    require: [true, "First name is required"],
  },
  lastName: {
    type: String,
    require: [true, "First name is required"],
  },
  about: {
    type: String,
  },
  avatar: {
    type: String,
  },
  email: {
    type: String,
    require: [true, "Email is required"],
    validate: {
      validator: function (email) {
        return String(email)
          .toLowerCase()
          .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          );
      },
      message: (props) => `Email ${props.value} is invalid.`,
    },
  },
  password: {
    type: String,
  },
  username: {
    type: String,
    require: true,
  },
});

userSchema.plugin(plm);

// saving otp in encrypted form (this function will run before saving data into database)
userSchema.pre("save", async function (next) {
  //only hash otp if it is modified.
  if (!this.isModified("otp")) next();
  // generating hash code for otp for security reasons.
  this.otp = await bcrypt.hash(this.otp, 12); // otp is hashed with costs of 12 . (The more the cost the more difficult to decrypt the code)
});

userSchema.methods.correctPassword = (givenPassword, savedPassword) => {
  return givenPassword === savedPassword;
};

userSchema.methods.correctOTP = async (givenOTP, savedOTP) => {
  return await bcrypt.compare(givenOTP, savedOTP);
};

userSchema.methods.changePasswordAfterLogin = function (timeStamp) {
  return timeStamp < this.passwordChangedAt;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex"); // generated random string.
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpire = Date.now() + 10 * 60 * 1000; // 10 mints.
  return resetToken;
};

const User = new mongoose.model("User", userSchema);
module.exports = User;
