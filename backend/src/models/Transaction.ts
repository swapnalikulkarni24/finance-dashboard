// backend/src/models/Transaction.ts
import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for a Transaction document
export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId; // Reference to the User who owns this transaction
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true,
      maxlength: [200, 'Description cannot be more than 200 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Please add an amount'],
      min: [0, 'Amount must be a positive number'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Please select a type (income or expense)'],
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      trim: true,
      maxlength: [100, 'Category cannot be more than 100 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Please add a date for the transaction'],
      default: Date.now, // Default to current date if not provided
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'completed',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
