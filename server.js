const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'foodie_hub_secret_key_2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// MySQL Connection Pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root123', // Change this to your MySQL password
    database: 'foodie_hub',
    waitForConnections: true,
    connectionLimit: 10
});

// Test DB Connection
async function testConnection() {
    try {
        const conn = await pool.getConnection();
        console.log('✅ MySQL Connected Successfully!');
        conn.release();
    } catch (err) {
        console.error('❌ MySQL Connection Error:', err.message);
        console.log('Please check your MySQL credentials in server.js');
    }
}
testConnection();

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, password, address } = req.body;
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.json({ success: false, message: 'Email already registered!' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (name, email, phone, password, address) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, hashedPassword, address]
        );
        res.json({ success: true, message: 'Registration successful!' });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'User not found!' });
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid password!' });
        }
        req.session.userId = user.id;
        req.session.userName = user.name;
        res.json({ success: true, message: 'Login successful!', user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Check Auth
app.get('/api/check-auth', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, userId: req.session.userId, userName: req.session.userName });
    } else {
        res.json({ loggedIn: false });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// ==================== MENU ROUTES ====================

// Get Categories
app.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT * FROM categories');
        res.json(categories);
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Get Menu Items
app.get('/api/menu', async (req, res) => {
    try {
        const { category, veg } = req.query;
        let query = `SELECT m.*, c.name as category_name FROM menu_items m 
                     JOIN categories c ON m.category_id = c.id WHERE m.is_available = TRUE`;
        const params = [];
        if (category && category !== 'all') {
            query += ' AND m.category_id = ?';
            params.push(category);
        }
        if (veg === 'true') {
            query += ' AND m.is_veg = TRUE';
        } else if (veg === 'false') {
            query += ' AND m.is_veg = FALSE';
        }
        query += ' ORDER BY c.id, m.name';
        const [items] = await pool.query(query, params);
        res.json(items);
    } catch (err) {
        res.json({ error: err.message });
    }
});

// ==================== CART ROUTES ====================

// Get Cart
app.get('/api/cart', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.json({ items: [], total: 0 });
        const [items] = await pool.query(`
            SELECT c.id, c.quantity, m.id as item_id, m.name, m.price, m.image, m.is_veg
            FROM cart c JOIN menu_items m ON c.item_id = m.id
            WHERE c.user_id = ?`, [userId]);
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        res.json({ items, total });
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Add to Cart
app.post('/api/cart/add', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.json({ success: false, message: 'Please login first!' });
        const { itemId, quantity = 1 } = req.body;
        const [existing] = await pool.query('SELECT * FROM cart WHERE user_id = ? AND item_id = ?', [userId, itemId]);
        if (existing.length > 0) {
            await pool.query('UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?', [quantity, userId, itemId]);
        } else {
            await pool.query('INSERT INTO cart (user_id, item_id, quantity) VALUES (?, ?, ?)', [userId, itemId, quantity]);
        }
        res.json({ success: true, message: 'Added to cart!' });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Update Cart
app.put('/api/cart/update', async (req, res) => {
    try {
        const userId = req.session.userId;
        const { cartId, quantity } = req.body;
        if (quantity <= 0) {
            await pool.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [cartId, userId]);
        } else {
            await pool.query('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, cartId, userId]);
        }
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Remove from Cart
app.delete('/api/cart/remove/:cartId', async (req, res) => {
    try {
        const userId = req.session.userId;
        await pool.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.cartId, userId]);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// ==================== ORDER ROUTES ====================

// Place Order
app.post('/api/orders/place', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.json({ success: false, message: 'Please login first!' });
        const { address, paymentMethod } = req.body;
        const [cartItems] = await pool.query(`
            SELECT c.*, m.price FROM cart c 
            JOIN menu_items m ON c.item_id = m.id 
            WHERE c.user_id = ?`, [userId]);
        if (cartItems.length === 0) {
            return res.json({ success: false, message: 'Cart is empty!' });
        }
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const [orderResult] = await pool.query(
            'INSERT INTO orders (user_id, total_amount, delivery_address, payment_method, status) VALUES (?, ?, ?, ?, ?)',
            [userId, total, address, paymentMethod, 'confirmed']
        );
        const orderId = orderResult.insertId;
        for (const item of cartItems) {
            await pool.query(
                'INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.item_id, item.quantity, item.price]
            );
        }
        await pool.query('DELETE FROM cart WHERE user_id = ?', [userId]);
        res.json({ success: true, message: 'Order placed successfully!', orderId });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Get Order History
app.get('/api/orders', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.json([]);
        const [orders] = await pool.query(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
        for (let order of orders) {
            const [items] = await pool.query(`
                SELECT oi.*, m.name, m.image FROM order_items oi
                JOIN menu_items m ON oi.item_id = m.id
                WHERE oi.order_id = ?`, [order.id]);
            order.items = items;
        }
        res.json(orders);
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Get User Profile
app.get('/api/user/profile', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.json({ success: false });
        const [users] = await pool.query('SELECT id, name, email, phone, address FROM users WHERE id = ?', [userId]);
        res.json({ success: true, user: users[0] });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🍽️  FoodieHub Server Running!`);
    console.log(`📍 Open: http://localhost:${PORT}`);
    console.log(`\n⚠️  Make sure MySQL is running and database is set up!\n`);
});