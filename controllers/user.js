const userModel = require("../models/user");
const filterObj = require("../utils/util");

exports.updateMe = async function (req, res, next) {
  const { user } = req.user;

  const filteredBody = filterObj(
    req.body,
    "firstName",
    "lastName",
    "avatar",
    "about"
  );

  const updatedUser = await userModel.findByIdAndUpdate(
    { _id: user._id },
    filteredBody,
    { new: true, validateModifiedOnly: true }
  );

  res.status(200).json({
    status: "success",
    data: updatedUser,
    message: "Record successfully updated.",
  });
};
