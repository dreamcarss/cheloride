const userModel = require("../models/userModel");

const getUsers = async(req, res) => {
  try {
    await userModel.find().then((users) => {
      if(users.length > 0){
        users.forEach((user) => user.password = "")
        res.status(200).json({"data": users})
      }
    })
  } catch (error) {
    console.log(error)
  }
}

const updateRole = async (req, res) => {
  try {
    let id = req.params.id
    await userModel
      .findByIdAndUpdate(id, {
        role: req.body.role,
        kycStatus: req.body.kycStatus || false
      })
      .then((user) => {
        console.log(user)
          res.status(200).json({ "msg": "User Updated"});
      });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { getUsers, updateRole };