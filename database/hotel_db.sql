-- Create Database
CREATE DATABASE IF NOT EXISTS hotel_db;
USE hotel_db;

-- Table: Room

CREATE TABLE Room (
    roomId INT PRIMARY KEY AUTO_INCREMENT,
    roomNumber VARCHAR(10) UNIQUE NOT NULL,
    roomType VARCHAR(50) NOT NULL, -- e.g., Single, Double, Suite, Deluxe
    capacity INT DEFAULT 2,
    roomPrice DECIMAL(10, 2) NOT NULL,
    amenities TEXT, -- Comma-separated or JSON
    description TEXT,
    status VARCHAR(20) DEFAULT 'Available', -- Available, Occupied, Cleaning, Maintenance
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_room_status (status),
    INDEX idx_room_type (roomType)
);

-- TABLE: Guest
CREATE TABLE Guest (
    guestId INT PRIMARY KEY AUTO_INCREMENT,
    nic_or_passport VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address TEXT,
    loyalty_points INT DEFAULT 0,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_guest_email (email),
    INDEX idx_guest_phone (phone)
);
-- TABLE: Staff
CREATE TABLE Staff (
    staffId INT PRIMARY KEY AUTO_INCREMENT,
    nic VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL, -- Admin, Receptionist, Housekeeper, Kitchen
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    birthDate DATE,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_staff_role (role),
    INDEX idx_staff_username (username)
);

-- TABLE: Reservation

CREATE TABLE Reservation (
    reservationId INT PRIMARY KEY AUTO_INCREMENT,
    checkIn DATE NOT NULL,
    checkOut DATE NOT NULL,
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Confirmed, Checked-In, Checked-Out, Cancelled
    total_price DECIMAL(10, 2),
    
    -- Foreign Keys
    guestId INT NOT NULL,
    roomId INT NOT NULL,
    staffId INT, -- The staff member who created this reservation
    
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (guestId) REFERENCES Guest(guestId) ON DELETE CASCADE,
    FOREIGN KEY (roomId) REFERENCES Room(roomId) ON DELETE RESTRICT,
    FOREIGN KEY (staffId) REFERENCES Staff(staffId) ON DELETE SET NULL,
    
    CONSTRAINT check_checkout_after_checkin CHECK (checkOut > checkIn),
    INDEX idx_reservation_guest (guestId),
    INDEX idx_reservation_room (roomId),
    INDEX idx_reservation_dates (checkIn, checkOut),
    INDEX idx_reservation_status (status)
);

-- TABLE: Payment
CREATE TABLE Payment (
    paymentId INT PRIMARY KEY AUTO_INCREMENT,
    amount DECIMAL(10, 2) NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL, -- Cash, Card, Online, Bank Transfer
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Completed, Failed, Refunded
    reservationId INT NOT NULL UNIQUE, -- Each reservation has one payment
    
    FOREIGN KEY (reservationId) REFERENCES Reservation(reservationId) ON DELETE CASCADE,
    INDEX idx_payment_status (status),
    INDEX idx_payment_date (date)
);

-- TABLE: PaymentGatewaySettings
CREATE TABLE PaymentGatewaySettings (
    provider VARCHAR(50) PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT TRUE,
    config_json TEXT,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- TABLE: Inventory

CREATE TABLE Inventory (
    itemId INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- Food, Beverages, Services
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    restock_level INT DEFAULT 10,
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_inventory_category (category)
);

-- TABLE: Room_Service_Orders

CREATE TABLE Room_Service_Orders (
    orderId INT PRIMARY KEY AUTO_INCREMENT,
    orderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivery_date DATETIME,
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Preparing, Delivered, Cancelled
    
    guestId INT NOT NULL,
    itemId INT NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10, 2),
    special_requests TEXT,
    
    FOREIGN KEY (guestId) REFERENCES Guest(guestId) ON DELETE CASCADE,
    FOREIGN KEY (itemId) REFERENCES Inventory(itemId) ON DELETE RESTRICT,
    INDEX idx_order_guest (guestId),
    INDEX idx_order_status (status),
    INDEX idx_order_date (orderDate)
);

-- TABLE: Review

CREATE TABLE Review (
    reviewId INT PRIMARY KEY AUTO_INCREMENT,
    guestId INT NOT NULL,
    roomId INT,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (guestId) REFERENCES Guest(guestId) ON DELETE CASCADE,
    FOREIGN KEY (roomId) REFERENCES Room(roomId) ON DELETE SET NULL,
    INDEX idx_review_guest (guestId),
    INDEX idx_review_room (roomId),
    INDEX idx_review_rating (rating)
);


-- TABLE: Gallery

CREATE TABLE Gallery (
    galleryId INT PRIMARY KEY AUTO_INCREMENT,
    roomId INT,
    imageUrl VARCHAR(255) NOT NULL,
    altText VARCHAR(100),
    uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (roomId) REFERENCES Room(roomId) ON DELETE CASCADE,
    INDEX idx_gallery_room (roomId)
);

-- TABLE: Contact

CREATE TABLE Contact (
    contactId INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(100),
    message TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'New', -- New, In Progress, Resolved
    response_message TEXT,
    responded_by INT,
    responded_at DATETIME,
    
    FOREIGN KEY (responded_by) REFERENCES Staff(staffId) ON DELETE SET NULL,
    INDEX idx_contact_status (status),
    INDEX idx_contact_email (email)
);


-- TABLE: Offer/Promotion (for Offers.js component)

CREATE TABLE Offer (
    offerId INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    discount_percent DECIMAL(5, 2),
    discount_amount DECIMAL(10, 2),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    applicable_room_type VARCHAR(50), -- Can be NULL for all room types
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_offer_dates CHECK (end_date >= start_date),
    INDEX idx_offer_active (is_active),
    INDEX idx_offer_dates (start_date, end_date)
);


-- TABLE: Audit Log

CREATE TABLE AuditLog (
    logId INT PRIMARY KEY AUTO_INCREMENT,
    staffId INT,
    action VARCHAR(100) NOT NULL, -- Created, Updated, Deleted
    table_name VARCHAR(50),
    record_id INT,
    changes TEXT, -- JSON format preferred
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (staffId) REFERENCES Staff(staffId) ON DELETE SET NULL,
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_staff (staffId)
);



-- INSERT Sample Rooms
INSERT INTO Room (roomNumber, roomType, capacity, roomPrice, amenities, description, status)
VALUES 
('001','Single',1,40.00,'WiFi, TV','Budget single room (Non-AC, Ground Floor)','Available'),
('002','Single',1,40.00,'WiFi, TV','Budget single room (Non-AC, Ground Floor)','Available'),
('003','Double',2,55.00,'WiFi, TV','Budget double room (Non-AC, Ground Floor)','Available'),
('004','Double',2,55.00,'WiFi, TV','Budget double room (Non-AC, Ground Floor)','Available'),
('005','Single',1,40.00,'WiFi, TV','Budget single room (Non-AC, Ground Floor)','Available'),
('006','Family',3,70.00,'WiFi, TV','Family room (Non-AC, Ground Floor)','Available'),
('007','Double',2,55.00,'WiFi, TV','Budget double room (Non-AC, Ground Floor)','Available'),
('008','Single',1,40.00,'WiFi, TV','Budget single room (Non-AC, Ground Floor)','Available'),
('009','Double',2,55.00,'WiFi, TV','Budget double room (Non-AC, Ground Floor)','Available'),
('010','Single',1,40.00,'WiFi, TV','Budget single room (Non-AC, Ground Floor)','Available'),

('101','Single',1,60.00,'WiFi, TV, A/C','Standard single AC room (1st Floor)','Available'),
('102','Double',2,75.00,'WiFi, TV, A/C','Standard double AC room (1st Floor)','Available'),
('103','Single',1,60.00,'WiFi, TV, A/C','Standard single AC room (1st Floor)','Available'),
('104','Double',2,75.00,'WiFi, TV, A/C','Standard double AC room (1st Floor)','Available'),
('105','Family',3,90.00,'WiFi, TV, A/C','Family AC room (1st Floor)','Available'),
('106','Single',1,60.00,'WiFi, TV, A/C','Standard single AC room (1st Floor)','Available'),
('107','Double',2,75.00,'WiFi, TV, A/C','Standard double AC room (1st Floor)','Available'),
('108','Single',1,60.00,'WiFi, TV, A/C','Standard single AC room (1st Floor)','Available'),
('109','Double',2,75.00,'WiFi, TV, A/C','Standard double AC room (1st Floor)','Available'),
('110','Single',1,60.00,'WiFi, TV, A/C','Standard single AC room (1st Floor)','Available'),

('201','Single',1,90.00,'WiFi, TV, A/C, Balcony','Deluxe single room with balcony','Available'),
('202','Double',2,110.00,'WiFi, TV, A/C, Balcony','Deluxe double room with balcony','Available'),
('203','Single',1,95.00,'WiFi, TV, A/C, City View','Deluxe single room with city view','Available'),
('204','Double',2,115.00,'WiFi, TV, A/C, City View','Deluxe double room with city view','Available'),
('205','Family',3,130.00,'WiFi, TV, A/C','Deluxe family room','Available'),
('206','Single',1,90.00,'WiFi, TV, A/C, Balcony','Deluxe single room with balcony','Available'),
('207','Double',2,110.00,'WiFi, TV, A/C, Balcony','Deluxe double room with balcony','Available'),
('208','Single',1,95.00,'WiFi, TV, A/C, City View','Deluxe single room with city view','Available'),
('209','Double',2,115.00,'WiFi, TV, A/C, City View','Deluxe double room with city view','Available'),
('210','Single',1,90.00,'WiFi, TV, A/C, Balcony','Deluxe single room with balcony','Available'),

('301','Single',1,120.00,'WiFi, TV, A/C, Balcony','Executive single room','Available'),
('302','Double',2,140.00,'WiFi, TV, A/C, Balcony','Executive double room','Available'),
('303','Single',1,130.00,'WiFi, TV, A/C, Sea View','Executive single room with sea view','Available'),
('304','Double',2,150.00,'WiFi, TV, A/C, Sea View','Executive double room with sea view','Available'),
('305','Family',3,170.00,'WiFi, TV, A/C','Executive family room','Available'),
('306','Single',1,120.00,'WiFi, TV, A/C, Balcony','Executive single room','Available'),
('307','Double',2,140.00,'WiFi, TV, A/C, Balcony','Executive double room','Available'),
('308','Single',1,130.00,'WiFi, TV, A/C, Sea View','Executive single room with sea view','Available'),
('309','Double',2,150.00,'WiFi, TV, A/C, Sea View','Executive double room with sea view','Available'),
('310','Single',1,120.00,'WiFi, TV, A/C, Balcony','Executive single room','Available'),

('401','Single',1,180.00,'WiFi, TV, A/C','Junior suite','Available'),
('402','Double',2,220.00,'WiFi, TV, A/C, Living Room','Suite with living room','Available'),
('403','Single',1,200.00,'WiFi, TV, A/C, Kitchen','Suite with kitchen','Available'),
('404','Double',2,230.00,'WiFi, TV, A/C, Kitchen','Suite with kitchen','Available'),
('405','Family',3,260.00,'WiFi, TV, A/C, Kitchen','Family suite','Available'),
('406','Single',1,180.00,'WiFi, TV, A/C','Junior suite','Available'),
('407','Double',2,220.00,'WiFi, TV, A/C, Living Room','Suite with living room','Available'),
('408','Single',1,200.00,'WiFi, TV, A/C, Kitchen','Suite with kitchen','Available'),
('409','Double',2,230.00,'WiFi, TV, A/C, Kitchen','Suite with kitchen','Available'),
('410','Suite',4,300.00,'WiFi, TV, A/C, Balcony, Kitchen, Jacuzzi','Presidential suite','Available');

-- INSERT Sample Staff
INSERT INTO Staff (nic, name, phone, email, role, username, password_hash, birthDate, address)
VALUES 
    ('123456789', 'John Admin', '0777123456', 'admin@hotel.com', 'Admin', 'admin', SHA2('admin123', 256), '1990-01-15', '123 Admin Street'),
    ('987654321', 'Jane Receptionist', '0777654321', 'jane@hotel.com', 'Receptionist', 'jane', SHA2('jane123', 256), '1995-03-20', '456 Receptionist Ave');

-- INSERT Sample Guest
INSERT INTO Guest (nic_or_passport, name, email, password_hash, phone, address)
VALUES 
    ('PAS123456', 'Michael Johnson', 'michael@example.com', SHA2('guest123', 256), '0712345678', '789 Guest Lane');

-- INSERT Sample Inventory
INSERT INTO Inventory (name, category, price, quantity, restock_level, description)
VALUES 
    ('Coffee', 'Beverages', 5.00, 50, 20, 'Premium coffee'),
    ('Pizza', 'Food', 15.00, 30, 10, 'Delicious pizza');

