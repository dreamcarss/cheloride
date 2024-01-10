const userModel = require("../models/userModel");
const cloudinary = require("cloudinary").v2;

async function handleUpload(req, res) {
  let file = req.body.file;
  let id = req.params.id;
  let head = req.body.head
  let user = await userModel.findById(id)
  if(user != null){
    if (file != null) {
      const respImg = await cloudinary.uploader.upload(file, {
        resource_type: "auto",
      });
      switch (head) {
        case "aadhaar":
          user.aadhaar = respImg.secure_url;
          break;
        case "license":
          user.license = respImg.secure_url;
          break;
        case "idproof":
          user.idproof.proof = respImg.secure_url;
          break;
        default:
          break;
      }
      user.save();
      res.status(200).json({ "msg": "Image saved" });
    } else {
      res.render("400.ejs", { t: 500, sub: "Something went wrong" });
    }
  }
}

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

const deleteUser = async(req, res) => {
  try {
    let id = req.params.id;
    await userModel.findByIdAndDelete(id).then(() => {
      res.status(200).json({"msg": "User deleted"})
    })
  } catch (error) {
    console.log(error)
  }
}

module.exports = { getUsers, updateRole, deleteUser, handleUpload };