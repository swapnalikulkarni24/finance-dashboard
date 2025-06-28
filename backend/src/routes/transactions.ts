// backend/src/routes/transactions.ts
import { Router } from 'express';
import { getTransactions, createTransaction, getTransactionSummary, exportCsvTransactions } from '../controllers/transactionController'; // <--- ADD exportCsvTransactions here
import { protect } from '../middleware/authMiddleware';

const router = Router();

// All transaction routes will be protected
router.use(protect);

router.route('/')
  .get(getTransactions) // Get all transactions for the user
  .post(createTransaction); // Create a new transaction

router.route('/summary')
  .get(getTransactionSummary); // Get summary data for charts

router.route('/export-csv') // <--- ADD THIS NEW ROUTE
  .get(exportCsvTransactions); // This route is also protected by router.use(protect)

export default router;
