// models
const User = require('../models/userModel');

// utils
const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const user = await User.aggregate([
    {
      $match: { isActive: true },
    },
    {
      $project: {
        _id: 1,
        name: {
          $concat: ['$firstName', ' ', '$lastName'], // combine firstName and lastName fields
        },
        role: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 0,
    msg: "Retrieved all users' data successfully",
    data: user,
  });
});
