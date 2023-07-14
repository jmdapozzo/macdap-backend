const express = require("express");
const router = express.Router();

class Product {
    id;
    name;
    description;
    category;
    qtyPerItem;
    price;
    createdAt;
    modifiedAt;
  
    constructor(id, name, description, category, qtyPerItem, price, createdAt, modifiedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.category = category;
        this.qtyPerItem = qtyPerItem;
        this.price = price;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt;
    }
  }
  
const getProducts = (req, res, next) => {
    let products = [];

    products.push(new Product(1, "name 1", "decription", "category", 1, 1.00, new Date(), null));
    products.push(new Product(2, "name 3", "decription", "category", 3, 1.00, new Date(), null));
    products.push(new Product(3, "name 5", "decription", "category", 5, 1.00, new Date(), null));
    products.push(new Product(4, "name 10", "decription", "category", 10, 1.00, new Date(), null));
  
    res.send(products);
  };
  router.get("/product/v1", (req, res, next) => getProducts(req, res, next));
  
module.exports = router;
