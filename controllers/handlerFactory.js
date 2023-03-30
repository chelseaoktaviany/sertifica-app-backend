const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// delete one
exports.deleteOne = (Model, message) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    // send response
    res.status(204).json({
      status: 0,
      msg: message,
      data: [],
    });
  });

exports.updateOne = (Model, message) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    // send response
    res.status(200).json({
      status: 0,
      msg: message,
      data: doc,
    });
  });

// create one
exports.createOne = (Model, message) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    // send response
    res.status(201).json({
      status: 0,
      msg: message,
      data: doc,
    });
  });

// get one
exports.getOne = (Model, popOptions, message) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    // send response
    res.status(200).json({
      status: 0,
      msg: message,
      data: doc,
    });
  });

// get all
exports.getAll = (Model, message) =>
  catchAsync(async (req, res, next) => {
    // to allow for nested GET models on desired_model
    let filter = {};

    // nested get endpoint (later)
    if (req.params.publisherId) filter = { publisher: req.params.publisherId };

    // execute query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;

    // send response
    res.status(200).json({
      status: 0,
      msg: message,
      results: doc.length,
      data: doc,
    });
  });
