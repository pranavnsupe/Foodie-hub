-- Create Database
CREATE DATABASE IF NOT EXISTS foodie_hub;
USE foodie_hub;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(50)
);

-- Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255),
    category_id INT,
    is_veg BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    rating DECIMAL(2,1) DEFAULT 4.0,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Cart Table
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    item_id INT,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES menu_items(id)
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'delivered', 'cancelled') DEFAULT 'pending',
    delivery_address TEXT,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    item_id INT,
    quantity INT,
    price DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (item_id) REFERENCES menu_items(id)
);

-- Insert Categories
INSERT INTO categories (name, icon) VALUES
('Veg Starters', '🥗'),
('Non-Veg Starters', '🍗'),
('Main Course Veg', '🍛'),
('Main Course Non-Veg', '🍖'),
('Chinese', '🥡'),
('Desserts', '🍰'),
('Beverages', '🥤');

-- Insert Menu Items

-- Veg Starters (category_id = 1)
INSERT INTO menu_items (name, description, price, image, category_id, is_veg, rating) VALUES
('Samosa', 'Crispy pastry filled with spiced potatoes and peas', 49.00, 'samosa.jpg', 1, TRUE, 4.5),
('Paneer Tikka', 'Marinated cottage cheese grilled to perfection', 199.00, 'paneer-tikka.jpg', 1, TRUE, 4.7),
('Veg Spring Roll', 'Crispy rolls stuffed with mixed vegetables', 129.00, 'spring-roll.jpg', 1, TRUE, 4.3),
('Aloo Tikki', 'Spiced potato patties served with chutneys', 79.00, 'aloo-tikki.jpg', 1, TRUE, 4.4),
('Hara Bhara Kebab', 'Green vegetable patties with spinach and peas', 149.00, 'samosa.jpg', 1, TRUE, 4.2),
('Dahi Ke Kebab', 'Soft kebabs made with hung curd', 169.00, 'paneer-tikka.jpg', 1, TRUE, 4.6);

-- Non-Veg Starters (category_id = 2)
INSERT INTO menu_items (name, description, price, image, category_id, is_veg, rating) VALUES
('Chicken Tikka', 'Tender chicken marinated in spices and grilled', 249.00, 'chicken-tikka.jpg', 2, FALSE, 4.8),
('Fish Fry', 'Crispy fried fish with special masala coating', 279.00, 'fish-fry.jpg', 2, FALSE, 4.6),
('Chicken Wings', 'Spicy buffalo wings with dipping sauce', 229.00, 'chicken-wings.jpg', 2, FALSE, 4.5),
('Seekh Kebab', 'Minced meat kebabs grilled on skewers', 269.00, 'seekh-kebab.jpg', 2, FALSE, 4.7),
('Tandoori Prawns', 'Jumbo prawns marinated and grilled', 349.00, 'fish-fry.jpg', 2, FALSE, 4.9),
('Mutton Galouti', 'Melt-in-mouth minced mutton kebabs', 299.00, 'seekh-kebab.jpg', 2, FALSE, 4.8);

-- Main Course Veg (category_id = 3)
INSERT INTO menu_items (name, description, price, image, category_id, is_veg, rating) VALUES
('Dal Makhani', 'Creamy black lentils slow-cooked overnight', 199.00, 'dal-makhani.jpg', 3, TRUE, 4.7),
('Paneer Butter Masala', 'Cottage cheese in rich tomato gravy', 249.00, 'paneer-butter.jpg', 3, TRUE, 4.8),
('Veg Biryani', 'Fragrant rice with mixed vegetables and spices', 219.00, 'veg-biryani.jpg', 3, TRUE, 4.5),
('Chole Bhature', 'Spiced chickpeas with fluffy fried bread', 179.00, 'chole-bhature.jpg', 3, TRUE, 4.6),
('Palak Paneer', 'Cottage cheese in creamy spinach gravy', 229.00, 'paneer-butter.jpg', 3, TRUE, 4.4),
('Malai Kofta', 'Potato-paneer dumplings in creamy sauce', 259.00, 'dal-makhani.jpg', 3, TRUE, 4.5);

-- Main Course Non-Veg (category_id = 4)
INSERT INTO menu_items (name, description, price, image, category_id, is_veg, rating) VALUES
('Butter Chicken', 'Tender chicken in creamy tomato sauce', 299.00, 'butter-chicken.jpg', 4, FALSE, 4.9),
('Chicken Biryani', 'Aromatic rice layered with spiced chicken', 279.00, 'chicken-biryani.jpg', 4, FALSE, 4.8),
('Mutton Rogan Josh', 'Kashmiri style lamb curry', 349.00, 'mutton-curry.jpg', 4, FALSE, 4.7),
('Fish Curry', 'Fish cooked in tangy coconut gravy', 289.00, 'fish-curry.jpg', 4, FALSE, 4.6),
('Chicken Korma', 'Creamy chicken curry with nuts', 279.00, 'butter-chicken.jpg', 4, FALSE, 4.5),
('Keema Matar', 'Minced meat with green peas', 269.00, 'mutton-curry.jpg', 4, FALSE, 4.4);

-- Chinese (category_id = 5)
INSERT INTO menu_items (name, description, price, image, category_id, is_veg, rating) VALUES
('Veg Fried Rice', 'Wok-tossed rice with vegetables', 169.00, 'fried-rice.jpg', 5, TRUE, 4.4),
('Chicken Fried Rice', 'Fried rice with tender chicken pieces', 199.00, 'fried-rice.jpg', 5, FALSE, 4.5),
('Hakka Noodles', 'Stir-fried noodles with vegetables', 159.00, 'noodles.jpg', 5, TRUE, 4.3),
('Chicken Noodles', 'Noodles tossed with chicken and sauces', 189.00, 'noodles.jpg', 5, FALSE, 4.5),
('Veg Manchurian', 'Vegetable balls in spicy manchurian sauce', 179.00, 'manchurian.jpg', 5, TRUE, 4.6),
('Chilli Chicken', 'Crispy chicken in spicy chilli sauce', 229.00, 'chilli-chicken.jpg', 5, FALSE, 4.7),
('Paneer Chilli', 'Cottage cheese in Indo-Chinese style', 209.00, 'manchurian.jpg', 5, TRUE, 4.4),
('Dragon Chicken', 'Spicy crispy chicken with peppers', 249.00, 'chilli-chicken.jpg', 5, FALSE, 4.6);

-- Desserts (category_id = 6)
INSERT INTO menu_items (name, description, price, image, category_id, is_veg, rating) VALUES
('Gulab Jamun', 'Deep-fried milk dumplings in sugar syrup', 99.00, 'gulab-jamun.jpg', 6, TRUE, 4.7),
('Ice Cream Sundae', 'Vanilla ice cream with chocolate sauce', 149.00, 'ice-cream.jpg', 6, TRUE, 4.5),
('Chocolate Brownie', 'Warm brownie with ice cream', 179.00, 'brownie.jpg', 6, TRUE, 4.8),
('Rasmalai', 'Soft cottage cheese patties in sweet milk', 129.00, 'rasmalai.jpg', 6, TRUE, 4.6),
('Kheer', 'Traditional rice pudding with nuts', 109.00, 'rasmalai.jpg', 6, TRUE, 4.4),
('Gajar Halwa', 'Sweet carrot pudding with nuts', 119.00, 'gulab-jamun.jpg', 6, TRUE, 4.5);

-- Beverages (category_id = 7)
INSERT INTO menu_items (name, description, price, image, category_id, is_veg, rating) VALUES
('Mango Lassi', 'Sweet yogurt drink with mango', 89.00, 'lassi.jpg', 7, TRUE, 4.6),
('Masala Chai', 'Traditional Indian spiced tea', 39.00, 'masala-chai.jpg', 7, TRUE, 4.5),
('Cold Coffee', 'Chilled coffee with ice cream', 119.00, 'cold-coffee.jpg', 7, TRUE, 4.7),
('Fresh Lime Soda', 'Refreshing lemon soda', 59.00, 'fresh-juice.jpg', 7, TRUE, 4.3),
('Butter Milk', 'Spiced traditional buttermilk', 49.00, 'lassi.jpg', 7, TRUE, 4.4),
('Fresh Orange Juice', '100% fresh squeezed orange juice', 99.00, 'fresh-juice.jpg', 7, TRUE, 4.6);