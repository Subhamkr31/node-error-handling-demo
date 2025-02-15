const express = require('express');
const CustomError = require('./utils/CustomError');
const SuccessResponse = require('./utils/successResponse');
const pool = require('./config/database');

const app = express();
app.use(express.json());

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle specific database connection errors
  if (err.code === 'ECONNREFUSED') {
    err.message = 'Unable to connect to database. Please check if MySQL is running.';
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// Get all users
app.get('/users', async (req, res, next) => {
  try {
    const [users] = await pool.query('SELECT * FROM users');
    new SuccessResponse(users, 'Users retrieved successfully').send(res);
  } catch (error) {
    next(new CustomError('Error fetching users', 500));
  }
});

// Create a new user
app.post('/users', async (req, res, next) => {
  try {
    const { name, email } = req.body;

    // Validation error
    if (!name || !email) {
      throw new CustomError('Name and email are required', 400);
    }

    const [result] = await pool.query(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name, email]
    );

    const userData = {
      id: result.insertId,
      name,
      email
    };

    new SuccessResponse(
      userData,
      'User created successfully',
      201
    ).send(res);
  } catch (error) {
    // Duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      next(new CustomError('Email already exists', 409));
    } else {
      next(error);
    }
  }
});

// Get user by ID
app.get('/users/:id', async (req, res, next) => {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);

    // Not found error
    if (users.length === 0) {
      throw new CustomError('User not found', 404);
    }

    new SuccessResponse(
      users[0],
      'User retrieved successfully'
    ).send(res);
  } catch (error) {
    next(error);
  }
});

// Delete user
app.delete('/users/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      throw new CustomError('User not found', 404);
    }

    new SuccessResponse(
      null,
      'User deleted successfully',
      204
    ).send(res);
  } catch (error) {
    next(error);
  }
});

// Handle 404 routes
app.all('*', (req, res, next) => {
  next(new CustomError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware
app.use(errorHandler);

// Update the server startup
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  try {
    await pool.query('SELECT 1');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer(); 