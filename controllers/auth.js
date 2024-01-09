// const userModel = require("../models/user");
// const passport = require("passport");
// const localStrategy = require("passport-local");
// passport.use(new localStrategy(userModel.authenticate()));

// exports.register = async function (req, res) {
//   const userdata = new userModel({
//     firstName: req.body.firstName,
//     lastName: req.body.lastName,
//     secret: req.body.secret,
//     email: req.body.email,
//     username: req.body.email,
//   });

//   userModel
//     .register(userdata, req.body.password)
//     .then(function (registeredUser) {
//       passport.authenticate("local")(req, res, function () {
//         res.redirect("/");
//       });
//     });
// };

// exports.login = async function () {
//   passport.authenticate("local", {
//     successRedirect: "/",
//     failureRedirect: "/auth/login",
//     failureFlash: true,
//   });
// };

// exports.isLoggedIn = async function (req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   return redirect("/auth/login");
// };

// exports.logout = async function (req, res, next) {
//   req.logout(function (err) {
//     if (err) {
//       return next(err);
//     }
//     res.redirect("/");
//     window.history.pushState("/");
//   });
// };

const jwt = require("jsonwebtoken");
const userModel = require("../models/user");
const filterObj = require("../utils/util");
const { promisify } = require("util");
//helper functions.
const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_Secret); // will give some random value.

exports.protected = async function (req, res, next) {
  //1) getting token and checking whether if it's there.
  let token;
  // Token form on client : "Beared ddkskvbsbv"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  } else {
    res.status(400).json({
      status: "error",
      message: "You are not login. Please login to get access.",
    });
    return;
  }
  //2) Verification of token.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_Secret);

  //3) Check if user still exists(bcz user might be banned after logedin)
  const curUser = await userModel.findById({ _id: decoded.userId });

  if (!curUser) {
    res.status(400).json({
      status: "error",
      message: "The user does not exits.",
    });
    return;
  }
  next();
};

// newUser-> register -> sendOTP -> verify-> login
exports.register = async function (req, res, next) {
  const { firstName, lastName, password, email } = req.body;
  const filteredBody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "password",
    "email"
  );

  const existingUser = await userModel.findOne({ email: email });
  if (!existingUser) {
    // user is registering first time.
    filteredBody.username = email;
    const user = await userModel.create(filteredBody);
    const token = signToken(user._id);
    res.status(200).json({
      status: "success",
      message: "Login successfully",
      token,
    });
  } else {
    res.status(400).json({
      status: "error",
      message: "User already exists with provided credentials.",
    });
  }
};

exports.login = async function (req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      status: "error",
      message: "Both Email and password are required!",
    });
  }

  const user = await userModel.findOne({ email: email }).select("+password");
  if (!user || !user.correctPassword(password, user.password)) {
    res.status(400).json({
      status: "error",
      message: "Email or Password is incorrect",
    });
    return;
  }

  const token = signToken(user._id);

  res.status(200).json({
    status: "success",
    message: "Login successfully",
    token,
  });
};

// ----ORIGINAL AUTHENTICATION BY SENDING EMIALs.
// newUser-> register -> sendOTP -> verify-> login
// exports.register = async function (req, res, next) {
//   const { firstName, lastName, password, email } = req.body;

//   const filteredBody = filterObj(
//     req.body,
//     "firstName",
//     "lastName",
//     "password",
//     "email"
//   );

//   // saving the password in hashed form.

//   const existingUser = await userModel.findOne({ email: email });
//   // user already exists with email
//   if (existingUser && existingUser.verified) {
//     res.status(400).json({
//       status: "error",
//       message: "Account already exists with given email. Please login.",
//     });
//     //user existis but not verified.
//   } else if (existingUser) {
//     const updated_user = await userModel.findOneAndUpdate(
//       { email: email },
//       filteredBody,
//       {
//         new: true,
//         validateModifiedOnly: true,
//       }
//     );
//     updated_user.passwordChangedAt = Date.now();
//     // generate OTP and send email to user.
//     req.userId = existingUser._id;
//     next();
//   } else {
//     // user is registering first time.
//     const newUser = await userModel.create(filteredBody);
//     // generate OTP and send email to user.
//     req.userId = newUser._id;
//     next();
//   }
// };

// exports.sendOTP = async function (req, res, next) {
//   const { userId } = req;

//   // a numeric otp of length six.
//   const newOTP = otpGenerator.generate(6, {
//     lowerCaseAlphabets: false,
//     upperCaseAlphabets: false,
//     specialChars: false,
//   });

//   const otpExpireTime = Date.now() + 1000 * 60 * 10; // otp available for next 10 mints.
//   const updatedUser = await userModel.findByIdAndUpdate(
//     userId,
//     {
//       otp: newOTP,
//       otpExpireTime,
//     },
//     {
//       new: true,
//       validateModifiedOnly: true,
//     }
//   );

//   //TODO=> send email to user about OTP.
//   try {
//     mailService.sendEmail({
//       from: "'Tawk app',<shabbukhan1988098@gmail.com>",
//       to: updatedUser.email,
//       subject: "OTP for tawk",
//       text: `Your OTP is ${newOTP}. This is valid for 10 mints`,
//       html: otpTemplate(updatedUser.firstName, newOTP),
//     });
//     res.status(200).json({
//       status: "success",
//       message: "OTP sent successfully.",
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

// exports.verifyOTP = async function (req, res, next) {
//   // verify otp and update user record accordingly.
//   const { email, otp } = req.body;

//   const user = await userModel.findOne({
//     email: email,
//     otpExpireTime: { $gte: Date.now() },
//   });

//   if (!user) {
//     res.status(400).json({
//       status: "error",
//       message:
//         "Either email is invalid or OTP has been expired. Please try again.",
//     });
//   }

//   if (!(await user.correctOTP(otp, user.otp))) {
//     res.status(400).json({
//       status: "error",
//       message: "Invalid OTP",
//     });
//     return;
//   }

//   user.verified = true;
//   user.otp = undefined;
//   user.otpExpireTime = undefined;

//   await user.save({ validateBeforeSave: false });

//   const token = signToken(user._id);

//   res.status("200").json({
//     status: "success",
//     message: "OTP successfully verified!",
//     token,
//   });
// };

// exports.login = async function (req, res, next) {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     res.status(400).json({
//       status: "error",
//       message: "Both Email and password are required!",
//     });
//   }

//   const user = await userModel.findOne({ email: email }).select("+password");

//   if (!user || !user.correctPassword(req.password, user.password)) {
//     res.status(400).json({
//       status: "error",
//       message: "Email or Password is incorrect",
//     });
//     return;
//   }

//   const token = signToken(user._id);

//   res.status(200).json({
//     status: "success",
//     message: "Login successfully",
//     token,
//   });
// };

// exports.forgetPassword = async function (req, res, next) {
//   const user = await userModel.findOne({ email: req.body.email });
//   if (!user) {
//     res.status("400").json({
//       status: "error",
//       message: "Provided email is not valid.",
//     });
//     return;
//   }
//   // Generating a resetToken
//   const resetToken = user.createPasswordResetToken();
//   const passwordResetUrl = `https://tawk.com/auth/reset-password/?code=${resetToken}`;

//   // sending email to user.
//   try {
//     //TODO=> sending email to user with "passwordResetUrl"
//     await mailService.sendEmail({
//       from: "shabbukhan1988098@gmail.com",
//       to: updatedUser.email,
//       subject: "Reset password link from TAWK",
//       text: `Click on the link to reset password . This is valid for 10 mints.`,
//       html: resetPasswordTemplate(user.firstName, passwordResetUrl),
//     });

//     res.status("200").json({
//       status: "success",
//       message: "Reset link successfully sent to the email.",
//     });
//   } catch (error) {
//     res.status("500").json({
//       status: "error",
//       message: "There was problem in sending email. Please try again",
//     });
//     user.passwordResetExpire = undefined;
//     user.passwordResetToken = undefined;
//     await user.save({ validateBeforeSave: false });
//   }
// };

// exports.resetPassword = async function (req, res, next) {
//   //1) Finding user based on hash code provided in reset link url.
//   const hashedToken = crypto
//     .createHash("sha256")
//     .update(req.params.token)
//     .digest("hex");

//   const user = await userModel.findOne({
//     passwordResetToken: hashedToken,
//     passwordResetExpire: { $gte: Date.now() }, // password should be resetted within 10 mints.
//   });

//   //2) Error if there is no user with above conditions.
//   if (!user) {
//     res.status(400).json({
//       status: "error",
//       message: "Token is invalid or reset time expired.",
//     });
//     return;
//   }
//   //3) Reset password
//   user.password = req.body.password;
//   user.passwordConfirm = req.body.passwordConfirm;
//   user.passwordChangedAt = Date.now();
//   //4) Set passwordtoken and time undefiend as there is no use after resetting password.
//   user.passwordResetToken = undefined;
//   user.passwordResetExpire = undefined;
//   await user.save();

//   //5) Send a success msg to the users mail
//   try {
//     //TODO=> send mail to user informing about resetting the password.
//   } catch (error) {
//     res.status(500).json({
//       status: "error",
//       message: "Error while sending informing msg.",
//     });
//   }

//   //6) Login and sending  a new token
//   const token = signToken(user._id);
//   res.status("200").json({
//     status: "success",
//     message: "Password successfully reset",
//     token,
//   });
// };
