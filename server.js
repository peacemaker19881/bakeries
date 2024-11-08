const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const { check, validationResult } = require('express-validator');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL connected...');
});

// API Endpoints

// 1. Add Product
app.post('/api/products', [
    check('name').notEmpty(),
    check('price').isNumeric(),
    check('category').notEmpty(),
    check('quantity').isInt({ gt: 0 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, price, category, quantity } = req.body;
    db.query('INSERT INTO products (name, price, category, quantity) VALUES (?, ?, ?, ?)', [name, price, category, quantity], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, name, price, category, quantity });
    });
});

// 2. Search Products
app.get('/api/products', (req, res) => {
    const { priceMin, priceMax, category, quantity } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (priceMin) {
        query += ' AND price >= ?';
        params.push(priceMin);
    }
    if (priceMax) {
        query += ' AND price <= ?';
        params.push(priceMax);
    }
    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }
    if (quantity) {
        query += ' AND quantity >= ?';
        params.push(quantity);
    }

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. Place Order
app.post('/api/orders', [
    check('product_id').isInt(),
    check('quantity').isInt({ gt: 0 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { product_id, quantity } = req.body;
    db.query('INSERT INTO orders (product_id, quantity) VALUES (?, ?)', [product_id, quantity], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, product_id, quantity });
    });
});

// 4. View Orders
app.get('/api/orders', (req, res) => {
    db.query('SELECT * FROM orders', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});