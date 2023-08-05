require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + bitton to aff a new item."
});

const item3 = new Item({
    name: "<-- hit this checkbox to delete an item."
});

const defaultItems = [item1, item2, item3];
 

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//------------------------------------------------------------------------------------------

app.get("/", (req, res) => {
    
    Item.find().
        then((foundItems) => {
            if (foundItems.length === 0) {
                Item.insertMany(defaultItems)
                .then(function () {
                    console.log("Succesfully saved all the default items to todolistDB");
                    res.redirect("/");
                })
                .catch(function (err) {
                    console.log(err);
                });
            } else {
                 res.render("list", { listTitle: "Today", newListItems: foundItems });
            }
        })
        .catch(function (err) {
            console.log(err);
        });
});

//------------------------------------------------------------------------------------------

app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName })
            .then((foundList) => {
                foundList.items.push(item);
                foundList.save();

                res.redirect("/" + listName);
            });
    }
});

//------------------------------------------------------------------------------------------

app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.deleteOne({ _id: checkedItemId })
            .then(() => {
                console.log("Documet deleted");
                res.redirect("/");
            })
            .catch((err) => {
                console.log(err);
            });
    } else {
        List.findOneAndUpdate({ name: listName }, {$pull: {items: {_id: checkedItemId}}})
        .then((foundList) => {
            res.redirect("/" + listName);
        })
        .catch((err) => {
            console.log(err);
        });
    }
    
});

//------------------------------------------------------------------------------------------

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName })
        .then((foundList) => {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();

                res.redirect("/" + customListName);
            } else {
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        })
        .catch(function (err) {
            console.log(err);
        });

});

//------------------------------------------------------------------------------------------
 
app.get("/about", (req, res) => {
    res.render("about");
});


 
app.listen(3000, () => {
    console.log("Server started on port 3000");
});