// frontend/src/pages/DashboardPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import axios from 'axios';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Collapse,
  Alert,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon, Logout as LogoutIcon, FilterList as FilterListIcon, Search as SearchIcon, Clear as ClearIcon, KeyboardArrowUp as ArrowUpIcon, KeyboardArrowDown as ArrowDownIcon, FileDownload as FileDownloadIcon, Close as CloseIcon } from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import CsvExportModal from '../components/CsvExportModal';

// Define the shape of a single transaction
interface ITransaction {
  _id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string; // Will be string from backend, convert to Date for display/filtering
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

// Define the shape of summary data
interface ISummaryData {
  monthlySummary: Array<{
    _id: { year: number; month: number };
    totalIncome: number;
    totalExpense: number;
  }>;
  categoryBreakdown: Array<{
    _id: string;
    totalAmount: number;
    totalIncome: number;
    totalExpense: number;
  }>;
  summaryMetrics: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
  };
}

const API_BASE_URL = 'http://localhost:5000/api'; // Base URL for your backend API

// MODIFIED: Expanded color palette for more distinct pie chart slices
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#FF8042', '#00C49F', '#FFBB28', '#A28DFF', '#FFD1DC', '#ADD8E6', '#90EE90', '#CDB7F5', '#87CEEB', '#FFB6C1']; // Colors for pie chart

const DashboardPage: React.FC = () => {
  const { user, logout, token, error: authError, clearError: clearAuthError } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [summaryData, setSummaryData] = useState<ISummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(0); // MUI TablePagination is 0-indexed
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalResults, setTotalResults] = useState(0);

  // Filtering state
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    status: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    amountMin: '',
    amountMax: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Sorting state
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState('desc'); // 'asc' or 'desc'

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // New Transaction Form State
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    date: new Date(),
    status: 'completed' as 'pending' | 'completed' | 'cancelled',
  });
  const [addingTransaction, setAddingTransaction] = useState(false);
  const [addTransactionError, setAddTransactionError] = useState<string | null>(null);

  // CSV Export State
  const [showCsvExportModal, setShowCsvExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Define available columns for CSV export
  const availableCsvColumns = [
    { label: 'ID', value: '_id' },
    { label: 'Description', value: 'description' },
    { label: 'Amount', value: 'amount' },
    { label: 'Type', value: 'type' },
    { label: 'Category', value: 'category' },
    { label: 'Date', value: 'date' },
    { label: 'Status', value: 'status' },
    { label: 'Created At', value: 'createdAt' },
  ];

  // Axios instance for authenticated requests
  const authAxios = useMemo(() => { // Line 106: Start of useMemo for authAxios
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }, [token]);

  // Intercept responses for global error handling (e.g., token expiration)
  useEffect(() => {
    const interceptor = authAxios.interceptors.response.use(
      response => response,
      async err => {
        if (err.response && err.response.status === 401) {
          logout();
          navigate('/login');
          setError('Session expired or unauthorized. Please log in again.');
        }
        return Promise.reject(err);
      }
    );
    return () => {
      authAxios.interceptors.response.eject(interceptor);
    };
  }, [authAxios, logout, navigate]); // authAxios is now a stable dependency

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    clearAuthError(); // Clear any auth-related errors from context

    try {
      const params: any = {
        page: page + 1, // Convert 0-indexed MUI page to 1-indexed backend page
        limit: rowsPerPage,
        sortBy: sortBy,
        order: order,
      };

      // Add filter params
      if (filters.category) params.category = filters.category;
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();
      if (filters.amountMin) params.amountMin = filters.amountMin;
      if (filters.amountMax) params.amountMax = filters.amountMax;
      if (searchQuery) params.search = searchQuery;

      const res = await authAxios.get('/transactions', { params });
      setTransactions(res.data.data);
      setTotalResults(res.data.totalResults);
      // Backend already calculates totalPages, but TablePagination uses `count` (totalResults)
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
      setError(err.response?.data?.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, order, filters, searchQuery, authAxios, clearAuthError]);

  const fetchSummaryData = useCallback(async () => {
    setError(null); // Clear previous errors for summary data
    try {
      const params: any = {};
      // MODIFIED: Pass filters to summary endpoint as well, so charts reflect selected date range
      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();

      const res = await authAxios.get('/transactions/summary', { params });
      setSummaryData(res.data.data);
      // MODIFIED: Log the raw summary data for debugging
      console.log('Fetched Summary Data:', res.data.data);
    } catch (err: any) {
      console.error('Failed to fetch summary data:', err);
      setError(err.response?.data?.message || 'Failed to load summary data.');
    }
  }, [authAxios, filters.startDate, filters.endDate]); // MODIFIED: Added filters as dependencies


  useEffect(() => {
    if (token) {
      fetchTransactions();
      fetchSummaryData();
    }
  }, [token, fetchTransactions, fetchSummaryData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setOrder('asc'); // Default to ascending when changing column
    }
    setPage(0); // Reset to first page on sort change
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleAmountFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value) || value === '') { // Allow numbers or empty string
      setFilters({ ...filters, [e.target.name]: value });
    }
  };

  const handleApplyFilters = () => {
    setPage(0); // Reset to first page when applying new filters
    fetchTransactions();
    fetchSummaryData(); // Re-fetch summary with new date filters
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      category: '',
      type: '',
      status: '',
      startDate: null,
      endDate: null,
      amountMin: '',
      amountMax: '',
    });
    setSearchQuery(''); // Also clear search on clear filters
    setPage(0); // Reset pagination
    setSortBy('date');
    setOrder('desc');
    // The useEffect will pick up filter changes and re-fetch automatically
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); // Reset to first page on search
    fetchTransactions();
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to page 0 when rows per page changes
  };

  // New Transaction Handlers
  const handleNewTransactionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({
      ...prev,
      [name]: name === 'amount' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  const handleNewTransactionDateChange = (date: Date | null) => {
    if (date) {
      setNewTransaction(prev => ({ ...prev, date }));
    }
  };

  const handleAddTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingTransaction(true);
    setAddTransactionError(null);

    // Basic validation
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.category || !newTransaction.date) {
      setAddTransactionError('Please fill all required fields.');
      setAddingTransaction(false);
      return;
    }

    try {
      await authAxios.post('/transactions', newTransaction);
      setShowAddTransactionModal(false);
      setNewTransaction({
        description: '',
        amount: '',
        type: 'expense',
        category: '',
        date: new Date(),
        status: 'completed',
      }); // Reset form
      fetchTransactions(); // Re-fetch transactions to show new one
      fetchSummaryData(); // Re-fetch summary data
    } catch (err: any) {
      console.error('Error adding transaction:', err);
      setAddTransactionError(err.response?.data?.message || 'Failed to add transaction.');
    } finally {
      setAddingTransaction(false);
    }
  };

  // CSV Export Handler
  const handleExportCsv = async (columns: string[]) => {
    setIsExporting(true);
    setExportError(null);

    try {
      const params: any = {
        columns: columns.join(','), // Send selected columns as a comma-separated string
        // Also include current filters for the export
        category: filters.category,
        type: filters.type,
        status: filters.status,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        amountMin: filters.amountMin,
        amountMax: filters.amountMax,
        search: searchQuery,
      };

      const res = await authAxios.get('/transactions/export-csv', {
        params,
        responseType: 'blob', // Important for file downloads
      });

      // Create a blob from the response data
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);

      // Create a link element, set its href and download attributes, then click it
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`; // Dynamic filename
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url); // Clean up the URL object

      setShowCsvExportModal(false); // Close modal on successful export
    } catch (err: any) {
      console.error('CSV Export error:', err);
      setExportError(err.response?.data?.message || 'Failed to export CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatMonthYear = (year: number, month: number) => {
    const date = new Date(year, month - 1); // Month is 0-indexed in JS Date
    return date.toLocaleString('default', { month: 'short', year: '2-digit' });
  };

  // Prepare data for monthly trend chart
  const trendData = useMemo(() => { // MODIFIED: Wrapped in useMemo for performance
    const data = summaryData?.monthlySummary.map(m => ({
      name: formatMonthYear(m._id.year, m._id.month),
      Income: m.totalIncome,
      Expense: m.totalExpense,
    })) || [];
    // MODIFIED: Log prepared trend data for debugging
    const cleanData = [...data]; // MODIFIED: Force a new array instance by spreading it to potentially fix prototype issue
    console.log('Trend Data for Line Chart:', cleanData); // Log prepared trend data for debugging
    return cleanData;
  }, [summaryData]); // MODIFIED: Added summaryData as dependency

  // Prepare data for category breakdown pie chart (expenses only)
  const expenseCategoryData = useMemo(() => { // MODIFIED: Wrapped in useMemo for performance
    const totalExpenses = summaryData?.summaryMetrics.totalExpense || 0;
    // MODIFIED: Threshold for grouping small slices
    const MIN_PERCENTAGE_FOR_SLICE = 0.02; // 2% threshold for showing a separate slice

    if (!summaryData?.categoryBreakdown || totalExpenses === 0) {
      return [];
    }

    let otherAmount = 0;
    const significantCategories: Array<{ name: string; value: number; percent: number }> = [];

    summaryData.categoryBreakdown
      .filter(c => c.totalExpense > 0) // MODIFIED: Only consider categories with expenses
      .forEach(c => {
        const percentage = c.totalExpense / totalExpenses;
        if (percentage >= MIN_PERCENTAGE_FOR_SLICE) {
          significantCategories.push({
            name: c._id,
            value: c.totalExpense,
            percent: percentage,
          });
        } else {
          otherAmount += c.totalExpense;
        }
      });

    // MODIFIED: Logic to conditionally add 'Other' slice
    if (otherAmount > 0) {
        if (significantCategories.length === 0 || otherAmount / totalExpenses >= MIN_PERCENTAGE_FOR_SLICE / 2) {
            significantCategories.push({
                name: 'Other',
                value: otherAmount,
                percent: otherAmount / totalExpenses,
            });
        }
    }

    // MODIFIED: Sort by value descending to have larger slices first
    significantCategories.sort((a, b) => b.value - a.value);

    // MODIFIED: Log prepared pie data for debugging
    console.log('Expense Category Data for Pie Chart:', significantCategories);
    return significantCategories;
  }, [summaryData]); // MODIFIED: Added summaryData as dependency


  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <AppBar position="sticky" elevation={4} sx={{ backgroundColor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar sx={{ justifyContent: 'space-between', flexWrap: 'wrap', py: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'primary.main', mb: { xs: 1, sm: 0 } }}>
            Financial Dashboard {/* MODIFIED: Changed title to "Financial Dashboard" (was "Finance Dashboard") */}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 1, sm: 2 } }}>
            <Typography variant="body1" sx={{ color: 'text.secondary', mr: 2, display: { xs: 'none', sm: 'block' } }}>
              Welcome, {user?.username || 'User'}!
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={() => setShowAddTransactionModal(true)}
              sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 0.8, sm: 1 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Add Transaction
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<FileDownloadIcon />}
              onClick={() => setShowCsvExportModal(true)}
              sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 0.8, sm: 1 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 0.8, sm: 1 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Global Error/Auth Error Display */}
      <Fade in={!!(error || authError)}>
        <Box> {/* Wrapped Alert with Box to ensure single child for Fade */}
          {(error || authError) ? (
            <Alert
              severity="error"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => { setError(null); clearAuthError(); }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              sx={{ my: 2, mx: 'auto', width: '95%', maxWidth: 800, borderRadius: 2, boxShadow: 1 }}
            >
              {error || authError}
            </Alert>
          ) : null}
        </Box>
      </Fade>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary', mb: 3 }}>
          Dashboard Overview
        </Typography>

        {/* Summary Metrics */}
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, md: 4}}> {/* MODIFIED: Changed size prop to item prop for Grid */}
            <Paper sx={{ p: 3, borderLeft: '5px solid', borderColor: 'success.main' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>Total Income</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {loading ? <CircularProgress size={24} /> : formatCurrency(summaryData?.summaryMetrics.totalIncome || 0)}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4}}> {/* MODIFIED: Changed size prop to item prop for Grid */}
            <Paper sx={{ p: 3, borderLeft: '5px solid', borderColor: 'error.main' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>Total Expenses</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {loading ? <CircularProgress size={24} /> : formatCurrency(summaryData?.summaryMetrics.totalExpense || 0)}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4}}> {/* MODIFIED: Changed size prop to item prop for Grid */}
            <Paper sx={{ p: 3, borderLeft: '5px solid', borderColor: 'primary.main' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>Balance</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {loading ? <CircularProgress size={24} /> : formatCurrency(summaryData?.summaryMetrics.netProfit || 0)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Filters for Charts/Summary */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              Analytics Filters
            </Typography>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outlined"
              startIcon={<FilterListIcon />}
              sx={{ textTransform: 'none' }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Box>
          <Collapse in={showFilters}>
            <Grid container spacing={2} sx={{ mt: 1}}>
              <Grid size={{ xs: 12, sm: 6, md: 4}}> {/* MODIFIED: Changed size prop to item prop for Grid */}
                <DatePicker
                  selected={filters.startDate}
                  onChange={(date: Date | null) => setFilters({ ...filters, startDate: date })}
                  selectsStart
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  placeholderText="Select Start Date"
                  customInput={
                    <TextField
                      label="Start Date"
                      variant="outlined"
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  }
                  dateFormat="yyyy/MM/dd"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4}}> {/* MODIFIED: Changed size prop to item prop for Grid */}
                <DatePicker
                  selected={filters.endDate}
                  onChange={(date: Date | null) => setFilters({ ...filters, endDate: date })}
                  selectsEnd
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  minDate={filters.startDate || undefined}
                  placeholderText="Select End Date"
                  customInput={
                    <TextField
                      label="End Date"
                      variant="outlined"
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  }
                  dateFormat="yyyy/MM/dd"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4}}> {/* MODIFIED: Changed size prop to item prop for Grid */}
                <Box sx={{ display: 'flex', gap: 1, mt: { xs: 2, md: 0 } }}>
                  <Button variant="contained" color="primary" onClick={handleApplyFilters} fullWidth>
                    Apply Filters
                  </Button>
                  <Button variant="outlined" color="secondary" onClick={handleClearFilters} fullWidth>
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </Paper>

        {/* Analytics Charts */}
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, lg: 6}}> {/* MODIFIED: Changed size prop to item prop for Grid */}
            <Paper sx={{ p: 3, height: 450 }}>
              <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Income-Expenses Trend
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="80%">
                  {/* MODIFIED: Reverted to LineChart */}
                  <LineChart
                    data={trendData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }} 
                  >
                    <CartesianGrid strokeDasharray="3 3" /> {/* MODIFIED: Reverted CartesianGrid to default (both vertical/horizontal) */}
                    <XAxis dataKey="name" /> {/* MODIFIED: Reverted XAxis to default (with axisLine/tickLine) */}
                    <YAxis tickFormatter={(value) => `$${value}`} /> {/* MODIFIED: Reverted YAxis to default (with axisLine/tickLine and auto domain) */}
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend /> {/* MODIFIED: Reverted Legend to default position (bottom) */}
                    <Line type="monotone" dataKey="Income" stroke="#82ca9d" activeDot={{ r: 8 }} /> {/* MODIFIED: Reverted to Line for Income, default color */}
                    <Line type="monotone" dataKey="Expense" stroke="#8884d8" activeDot={{ r: 8 }} /> {/* MODIFIED: Reverted to Line for Expense, default color */}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                  <Typography variant="body1" color="text.secondary">No monthly trend data available for selected period.</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, lg: 6}}> {/* MODIFIED: Changed size prop to item prop for Grid */}
            <Paper sx={{ p: 3, height: 450 }}>
              <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Expense Category Breakdown
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : expenseCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                  <Typography variant="body1" color="text.secondary">No expense data available for breakdown.</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Transaction Table */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary', mb: 3 }}>
            Transaction Listing
          </Typography>

          {/* Search and Filter Bar */}
          <Grid container spacing={2} alignItems="center" mb={3}>
            <Grid size={{ xs: 12, sm: 6}}> {/* MODIFIED: Changed size prop to item prop for Grid */}
              <TextField
                label="Search Description or Category"
                variant="outlined"
                fullWidth
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={(e) => { if (e.key === 'Enter') handleSearchSubmit(e); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    searchQuery && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => { setSearchQuery(''); setPage(0); fetchTransactions(); }}>
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6}}> {/* MODIFIED: Changed size prop to item prop for Grid */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
                <TextField
                  select
                  label="Type"
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 120, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 120, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </TextField>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleApplyFilters}
                  sx={{ textTransform: 'none', px: 2, py: 1, borderRadius: 2 }}
                >
                  Apply
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleClearFilters}
                  sx={{ textTransform: 'none', px: 2, py: 1, borderRadius: 2 }}
                >
                  Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : transactions.length === 0 ? (
              <Typography variant="body1" color="text.secondary" align="center" py={5}>
                No transactions found matching your criteria.
              </Typography>
            ) : (
              <TableContainer sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Table stickyHeader aria-label="transactions table">
                  <TableHead>
                    <TableRow>
                      <TableCell onClick={() => handleSort('description')} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                        Description
                        {sortBy === 'description' && (order === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />)}
                      </TableCell>
                      <TableCell onClick={() => handleSort('amount')} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                        Amount
                        {sortBy === 'amount' && (order === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />)}
                      </TableCell>
                      <TableCell onClick={() => handleSort('type')} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                        Type
                        {sortBy === 'type' && (order === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />)}
                      </TableCell>
                      <TableCell onClick={() => handleSort('category')} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                        Category
                        {sortBy === 'category' && (order === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />)}
                      </TableCell>
                      <TableCell onClick={() => handleSort('date')} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                        Date
                        {sortBy === 'date' && (order === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />)}
                      </TableCell>
                      <TableCell onClick={() => handleSort('status')} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                        Status
                        {sortBy === 'status' && (order === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />)}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: transaction.type === 'income' ? '#FFFFFF' : '#FFFFFF',
                              fontWeight: 'medium',
                              display: 'inline-flex',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              backgroundColor: transaction.type === 'income' ? 'success.light' : 'error.light',
                            }}
                          >
                            {formatCurrency(transaction.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{transaction.type}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              color: transaction.status === 'completed' ? '#FFFFFF' :
                                     transaction.status === 'pending' ? '#FFFFFF' :
                                     'text.secondary',
                              fontWeight: 'medium',
                              display: 'inline-flex',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              backgroundColor: transaction.status === 'completed' ? 'primary.light' :
                                               transaction.status === 'pending' ? 'warning.light' :
                                               'action.hover',
                              textTransform: 'capitalize'
                            }}
                          >
                            {transaction.status}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 20, 50]}
                  component="div"
                  count={totalResults}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableContainer>
            )}
          </Paper>
        </Container>

        {/* Add Transaction Modal (MUI Dialog) */}
        {showAddTransactionModal ? (
          <Dialog open={showAddTransactionModal} onClose={() => { setShowAddTransactionModal(false); setAddTransactionError(null); }} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>Add New Transaction</DialogTitle>
            <IconButton
              aria-label="close"
              onClick={() => { setShowAddTransactionModal(false); setAddTransactionError(null); }}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
            <DialogContent dividers>
              {addTransactionError ? (
                <Alert severity="error" sx={{ mb: 2 }}>{addTransactionError}</Alert>
              ) : null}
              <Box component="form" onSubmit={handleAddTransactionSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Description"
                  name="description"
                  value={newTransaction.description}
                  onChange={handleNewTransactionChange}
                  fullWidth
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6}}> {/* MODIFIED: Changed size prop to item prop for Grid */}
                    <TextField
                      label="Amount"
                      name="amount"
                      type="number"
                      value={newTransaction.amount}
                      onChange={handleNewTransactionChange}
                      fullWidth
                      required
                      inputProps={{ step: "0.01" }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6}}> {/* MODIFIED: Changed size prop to item prop for Grid */}
                    <TextField
                      select
                      label="Type"
                      name="type"
                      value={newTransaction.type}
                      onChange={handleNewTransactionChange}
                      fullWidth
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    >
                      <MenuItem value="expense">Expense</MenuItem>
                      <MenuItem value="income">Income</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6}}> {/* MODIFIED: Changed size prop to item prop for Grid */}
                    <TextField
                      label="Category"
                      name="category"
                      value={newTransaction.category}
                      onChange={handleNewTransactionChange}
                      fullWidth
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6}}> {/* MODIFIED: Changed size prop to item prop for Grid */}
                    <DatePicker
                      selected={newTransaction.date}
                      onChange={handleNewTransactionDateChange}
                      dateFormat="yyyy/MM/dd"
                      customInput={
                        <TextField
                          label="Date"
                          variant="outlined"
                          fullWidth
                          required
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      }
                    />
                  </Grid>
                </Grid>
                <TextField
                  select
                  label="Status"
                  name="status"
                  value={newTransaction.status}
                  onChange={handleNewTransactionChange}
                  fullWidth
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </TextField>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
              <Button
                onClick={handleAddTransactionSubmit}
                color="primary"
                variant="contained"
                disabled={addingTransaction}
                sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
              >
                {addingTransaction ? <CircularProgress size={24} color="inherit" /> : 'Add Transaction'}
              </Button>
            </DialogActions>
          </Dialog>
        ) : null}

        {/* CSV Export Modal */}
        <CsvExportModal
          isOpen={showCsvExportModal}
          onClose={() => { setShowCsvExportModal(false); setExportError(null); }}
          onExport={handleExportCsv}
          availableColumns={availableCsvColumns}
          isExporting={isExporting}
          exportError={exportError}
        />

        {/* Footer */}
        <Box component="footer" sx={{ py: 3, bgcolor: 'grey.900', color: 'white', textAlign: 'center', mt: 'auto' }}>
          <Typography variant="body2">
            &copy; {new Date().getFullYear()} Financial Dashboard. All rights reserved.
          </Typography>
        </Box>
      </Box>
    );
};

export default DashboardPage;
