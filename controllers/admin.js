const userModel = require("../models/userModel");

const getUsers = async(req, res) => {
  try {
    if(req.method == "GET"){
      res.render("users.ejs");
    }else{
      await userModel.find().then((users) => {
        if(users.length > 0){
        console.log(users)
          res.status(200).json({"data": users})
        }
      })
    }
  } catch (error) {
    console.log(error)
  }
}

module.exports = {getUsers}