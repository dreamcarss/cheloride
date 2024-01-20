const carModel = require("../models/carModel");
const trashModel = require("../models/trashbin");


const getTrash = async(req, res) => {
    try {
        await trashModel.find().then((trash) => {
            if(trash.length > 0){
                res.status(200).json(trash)
            }
        })
    } catch (error) {
        res.render("400.ejs", { t: 500, sub: "Something went wrong" });
    }
}

const restoreTrashCar = async(req, res) => {
    try {
       const id = req.body.trashId.trim();
       await trashModel.findById(id).then((trash) => {
        let car = new carModel(trash.trash);
        car.save().then(async() => {
            await trashModel.findByIdAndDelete(trash._id).then(() => {
                res.status(200).json({"msg": "Item restored"})
            })
        })
       }) 
    } catch (error) {
        res.render("400.ejs", { t: 500, sub: "Something went wrong" });
    }
}


module.exports = { getTrash, restoreTrashCar };