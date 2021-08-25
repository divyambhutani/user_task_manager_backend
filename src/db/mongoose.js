const mongoose = require("mongoose");

const url = process.env.MONGODB_URL;
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

// const Task = mongoose.model("Task", {
//   description: { type: String, trim: true, required: true },
//   completed: { type: Boolean, default: false },
// });
