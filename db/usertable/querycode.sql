CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) DEFAULT NULL, -- Allow NULL values for password
    role ENUM('user', 'admin') DEFAULT 'user',
    picture VARCHAR(255) DEFAULT 'https://res.cloudinary.com/dhbl4eauf/image/upload/v1720194161/1000_F_349497933_Ly4im8BDmHLaLzgyKg2f2yZOvJjBtlw5_fylttm.jpg'
);

