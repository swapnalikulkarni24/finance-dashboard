// backend/src/controllers/transactionController.ts
import { Request, Response, NextFunction } from 'express';
import Transaction, { ITransaction } from '../models/Transaction';
import { CustomError } from '../middleware/errorMiddleware';
import mongoose from 'mongoose';
import { Parser } from 'json2csv'; // <--- ADD THIS IMPORT

// Extend the Request type from Express to include a user property
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
      };
    }
  }
}

// @desc    Get all transactions for the authenticated user with search, filter, sort, and pagination
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const query: any = { user: userId }; // Ensure transactions belong to the authenticated user

    // Filtering
    const { category, type, status, startDate, endDate, amountMin, amountMax } = req.query;

    if (category) {
      query.category = category;
    }
    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate as string);
      }
    }
    if (amountMin || amountMax) {
      query.amount = {};
      if (amountMin) {
        query.amount.$gte = parseFloat(amountMin as string);
      }
      if (amountMax) {
        query.amount.$lte = parseFloat(amountMax as string);
      }
    }

    // Search (real-time search across description and category)
    const search = req.query.search as string;
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } }, // Case-insensitive search
        { category: { $regex: search, $options: 'i' } },
        // Add other fields if needed, e.g., { 'user.username': { $regex: search, $options: 'i' } } if populated
      ];
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const totalResults = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalResults / limit);

    let transactionsQuery = Transaction.find(query);

    // Sorting
    const sortBy = (req.query.sortBy as string) || 'date';
    const order = (req.query.order as string) === 'asc' ? 1 : -1; // 'asc' or 'desc'

    const sortOptions: { [key: string]: 1 | -1 } = {};
    sortOptions[sortBy] = order;
    transactionsQuery = transactionsQuery.sort(sortOptions);

    // Apply pagination
    transactionsQuery = transactionsQuery.skip(startIndex).limit(limit);

    const transactions = await transactionsQuery;

    const pagination: any = {};

    if (endIndex < totalResults) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: transactions.length,
      totalResults,
      totalPages,
      currentPage: page,
      pagination,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Add the user ID from the authenticated request
    req.body.user = req.user.id;

    const newTransaction = await Transaction.create(req.body);

    res.status(201).json({
      success: true,
      data: newTransaction,
    });
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return next(new CustomError(messages.join(', '), 400));
    }
    next(error);
  }
};

// @desc    Get summary metrics (revenue vs expenses, category breakdown)
// @route   GET /api/transactions/summary
// @access  Private
export const getTransactionSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    // Filter by date range if provided (similar to getTransactions)
    const { startDate, endDate } = req.query;
    const dateQuery: any = {};
    if (startDate) {
      dateQuery.$gte = new Date(startDate as string);
    }
    if (endDate) {
      dateQuery.$lte = new Date(endDate as string);
    }
    const matchQuery: any = { user: new mongoose.Types.ObjectId(userId) };
    if (Object.keys(dateQuery).length > 0) {
      matchQuery.date = dateQuery;
    }

    // Revenue vs Expenses Trend (e.g., monthly)
    const monthlySummary = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Category Breakdown
    const categoryBreakdown = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
          },
        },
      },
      { $sort: { totalAmount: -1 } }, // Sort by total amount descending
    ]);

    // Summary Metrics (Total Income, Total Expense, Net Profit)
    const totalMetrics = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
          },
        },
      },
    ]);

    const summaryMetrics = totalMetrics.length > 0 ? totalMetrics[0] : { totalIncome: 0, totalExpense: 0 };
    const netProfit = summaryMetrics.totalIncome - summaryMetrics.totalExpense;

    res.status(200).json({
      success: true,
      data: {
        monthlySummary,
        categoryBreakdown,
        summaryMetrics: {
          totalIncome: summaryMetrics.totalIncome,
          totalExpense: summaryMetrics.totalExpense,
          netProfit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export transactions to CSV
// @route   GET /api/transactions/export-csv
// @access  Private (requires authentication)
export const exportCsvTransactions = async (req: Request, res: Response, next: NextFunction) => { // <--- ADD THIS ENTIRE FUNCTION
  try {
    const userId = req.user.id;

    // --- Filtering Logic (matching your frontend filters) ---
    const { category, type, status, startDate, endDate, amountMin, amountMax, search, columns } = req.query;
    const query: any = { user: userId }; // Filter by the authenticated user's transactions (use 'user' field, not 'owner')

    if (category) {
      query.category = category;
    }
    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate as string);
      }
    }
    if (amountMin || amountMax) { // Combine min/max amount handling
      query.amount = {};
      if (amountMin) {
        query.amount.$gte = parseFloat(amountMin as string);
      }
      if (amountMax) {
        query.amount.$lte = parseFloat(amountMax as string);
      }
    }
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } }, // Case-insensitive search
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch transactions from the database based on the query
    const transactions = await Transaction.find(query).sort({ date: -1 }).lean(); // .lean() for plain JS objects

    // Define fields for CSV (default to all if 'columns' not specified or invalid)
    // Convert 'columns' query param string to an array of strings
    let fields = columns ? (columns as string).split(',') : ['_id', 'description', 'amount', 'type', 'category', 'date', 'status', 'createdAt'];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(transactions);

    res.header('Content-Type', 'text/csv');
    res.attachment(`transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    return res.send(csv);

  } catch (error) {
    console.error('Error exporting CSV:', error);
    next(error); // Pass error to global error handler
  }
};
