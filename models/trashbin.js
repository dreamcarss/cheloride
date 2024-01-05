const mongoose = require("mongoose");

const trashSchema = mongoose.Schema({
    trash: {type: Object, require: true}
})

const trashModel = mongoose.model("trash", trashSchema);
module.exports = trashModel;