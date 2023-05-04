const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

mongoose.connect("mongodb+srv://debolinashil96:SUpiyu%40%401996@cluster0.kk0graz.mongodb.net/todoListDB", {useNewUrlParser: true});
mongoose.connection.on("connected", ()=>{
    console.log("Connected to mongoDB");
});
mongoose.connection.on("error", ()=>{
    console.log("Failed to connect to mongoDB");
});

const itemsSchema = new mongoose.Schema(
    {
        name: {
            type: String
        }
    }
);

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item (
    {
        name: "Make lunch"
    }
);
const item2 = new Item (
    {
        name: "Study web development"
    }
);
const item3 = new Item (
    {
        name: "Chill and Netflix"
    }
);

const defaultItemsList = [item1, item2, item3];

const listsSchema = new mongoose.Schema(
    {
        name: String,
        items: [itemsSchema]
    }
);

const List = mongoose.model("List", listsSchema);


app.get("/", (req,res)=>{
    Item.find()
    .then((newItems)=>{
        if(newItems.length === 0) {
            Item.insertMany(defaultItemsList)
                .then(()=>{
                    console.log("Successfully inserted into the todoListDB");
                })
                .catch((err)=> {
                    console.log(err);
                });
            res.redirect("/");
        } else{
            res.render("list", {
                listTitle: "Today",
                newListItem: newItems
            });
        }
    })
    .catch(err=>{
        console.log(err);
    });
});

app.get("/:listParams", (req,res)=>{
    const listName = req.params.listParams;
    List.findOne({ name: listName }).exec()
        .then(foundList => {
            if (!foundList) {
                const list = new List(
                    {
                        name: listName,
                        items: defaultItemsList
                    }
                );
                list.save();
                res.redirect("/" + listName);
            } else {
                res.render("list", {
                    listTitle: foundList.name,
                    newListItem: foundList.items
                });
            }
        })
        .catch(err => {
            console.log(err);
        });
});

app.post("/", (req,res)=>{
    const newItem = req.body.newItem;
    const listName = req.body.list;

    const newdbItem = new Item(
        {
            name: newItem
        }
    );
    if(listName === "Today"){
        newdbItem.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName })
            .then(foundList => {
                foundList.items.push(newdbItem);
                foundList.save();
                res.redirect("/" + listName);
            })
            .catch(err=>{
                console.log(err);
            });
    }
    
});

app.post("/delete", (req,res)=>{
    const checkedBoxItemID = req.body.checkbox;
    async function deleteItem(){
        await Item.findByIdAndDelete(checkedBoxItemID);
    }
    const listName = req.body.listName;
    if(listName === "Today"){
        deleteItem();
        res.redirect("/");
    } else {
        List.findOne({ name: listName })
            .then(foundList=>{
                foundList.items.pull({ _id: checkedBoxItemID }); 
                foundList.save();
                res.redirect("/" + listName);
            })
            .catch(err=>{
                console.log(err);
            })
    }
    
});

app.listen(PORT, ()=>{
    console.log("Server is running on port " + PORT);
});