const mongoose = require("mongoose");

const trashSchema = mongoose.Schema({
    trash: {type: Object, require: true},
    createdAt: { type: Date, expires: 3600 }
})

const trashModel = mongoose.model("trash", trashSchema);
module.exports = trashModel;