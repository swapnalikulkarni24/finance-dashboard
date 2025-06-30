Financial Dashboard
This is a full-stack web application designed to help users track their income and expenses, visualize financial trends, manage transactions, and export data. 
It provides an intuitive dashboard interface with interactive charts, a sortable and filterable transaction table, and a secure login system.
Features
•User Authentication: Secure login interface (mocked for demo with pre-filled credentials).
•Interactive Dashboard:
 Summary Metrics: Overview of total income, total expenses, and net profit.
 Revenue vs. Expenses Trend: Monthly line chart showing financial performance over time.
 Expense Category Breakdown: Pie chart visualizing spending distribution by category.
•Transaction Management:
 Add new transactions with description, amount, type, category, date, and status.
 View transactions in a paginated table.
 Sort transactions by various columns (description, amount, type, category, date, status).
•Advanced Filtering & Search:
 Filter transactions by category, type, and status.
 Filter transactions by custom date ranges.
 Search transactions by description or category.
 Filter by amount range (min/max).
•CSV Export: Configure and export filtered transaction data to a CSV file with selected columns.

Technologies Used
Frontend
•React: A JavaScript library for building user interfaces.
•Material-UI (MUI): A popular React UI framework for beautiful and responsive components.
•Recharts: A composable charting library built on React components for data visualization.
•React-Datepicker: A simple and reusable datepicker component for React.
•Axios: A promise-based HTTP client for making API requests.
•React Router DOM: For declarative routing in React applications.
Backend
•Node.js: A JavaScript runtime environment.
•Express.js: A fast, unopinionated, minimalist web framework for Node.js.
•Mongoose: An ODM (Object Data Modeling) library for MongoDB and Node.js.
•MongoDB: A NoSQL document database for storing transaction data.
•Moment.js: For parsing, validating, manipulating, and formatting dates (used in backend for CSV formatting).
•csv-writer: For generating CSV files on the server-side.
•Dotenv: For loading environment variables from a .env file.
•Mongoose Paginate V2: For easy pagination of Mongoose queries.
•CORS: Middleware to enable Cross-Origin Resource Sharing.

Setup Instructions
Follow these steps to get the Financial Dashboard running locally on your machine.
Prerequisites
Before you begin, ensure you have the following installed:
•Node.js & npm (comes with Node.js)
•MongoDB 
•Git
1. Clone the Repository
Open your terminal or command prompt and clone the project:
git clone https://github.com/swapnalikulkarni24/finance-dashboard.git
cd finance-dashboard
2. Environment Variables
Create a file named .env in the root directory of the project (your-financial-dashboard/).
# .env (in the root directory)
# MongoDB Connection URI
# Replace with your local MongoDB URI or MongoDB Atlas connection string
MONGODB_URI=mongodb://localhost:27017/financial_dashboard_db
# Port for the Backend Server (Optional, defaults to 5000 if not set)
PORT=5000
# Base URL for the Frontend to connect to the Backend API
# For local development, this should match your backend server's address
REACT_APP_API_BASE_URL=http://localhost:5000/api
3. MongoDB Data Seeding
Ensure MongoDB is running.
•Navigate to your project's root directory in the terminal:
cd your-financial-dashboard
•Run the Python script:
python import_transactions.py
•Provide User ID: If no users are found, the script will prompt you to enter an existing MongoDB User ID. This is critical because transactions must be associated with a user to appear on the dashboard. You can get this ID by registering a user via your frontend's login/register page (http://localhost:3000/register) and then inspecting your MongoDB users collection.
4. Backend Setup
•Navigate to the backend directory:
cd backend
•Install dependencies:
npm install
•Start the backend server:
npm run dev
You should see "MongoDB connected successfully" and "Backend server running on port 5000" (or your configured PORT).
5. Frontend Setup
•Navigate to the frontend directory:
cd frontend
•Install dependencies:
npm install
•Start the frontend development server:
npm start
This will open your browser to http://localhost:3000.
6. Access the Application
Once both the backend and frontend servers are running:
•Open your web browser and go to: http://localhost:3000
•You will be redirected to the login page.
•Use the following demo credentials:
Email: progeekak@gmail.com
Password: Swapnali#24
•After successful login, you will be redirected to the Dashboard, populated with data for the user associated with ObjectId("68604a8e3da067ed1ca77004").

API Documentation
This provides a comprehensive overview of the RESTful API endpoints for the Financial Dashboard backend application.
•Base URL
The base URL for all API endpoints is: http://localhost:5000/api
•Authentication
Authentication for most endpoints is handled using JSON Web Tokens (JWT).
•Registration/Login: Upon successful registration or login, the API will return a token in the response body.
•Protected Routes: For all protected routes, this token must be included in the Authorization header of your requests in the format: Bearer YOUR_JWT_TOKEN.
Example Header for Authenticated Requests:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ODFhNzk2Njg2MDQ2NDYwMWZmODgyMyIsImlhdCI6MTY3ODg4NzYwMCwiZXhwIjoxNjc4OTc0MDAwfQ.some_random_string_here
•Endpoints
1. User Authentication
POST /api/auth/register
•	Description: Registers a new user account.
•	Access: Public
•	Request Body (JSON):
•	{
•	"username": "string",
•	"email": "string (valid email format)",
•	"password": "string (min 6 characters)"
•	}

•	Success Response (201 Created):
•	{
•	  "success": true,
•	  "token": "string (JWT token)",
•	  "user": {
•	    "id": "string (MongoDB ObjectId)",
•	    "username": "string",
•	    "email": "string"
•	  }
•	}

•	Error Responses:
o	400 Bad Request:
	{"success": false, "message": "User already exists with this email"}
	{"success": false, "message": "Please add a username"}
	{"success": false, "message": "Please add a valid email"}
	{"success": false, "message": "Password must be at least 6 characters"}
	{"success": false, "message": "Duplicate field value entered"}
o	500 Internal Server Error: {"success": false, "message": "Server Error"}
POST /api/auth/login
•	Description: Authenticates a user and returns a JWT token.
•	Access: Public
•	Request Body (JSON):
•	{
•	  "email": "string",
•	  "password": "string"
•	}

•	Success Response (200 OK):
•	{
•	  "success": true,
•	  "token": "string (JWT token)",
•	  "user": {
•	    "id": "string (MongoDB ObjectId)",
•	    "username": "string",
•	    "email": "string"
•	  }
•	}

•	Error Responses:
o	400 Bad Request: {"success": false, "message": "Please provide an email and password"}
o	401 Unauthorized: {"success": false, "message": "Invalid credentials"}
o	500 Internal Server Error: {"success": false, "message": "Server Error"}
GET /api/auth/me
•	Description: Retrieves the profile of the currently authenticated user.
•	Access: Private (requires JWT)
•	Request: No request body or query parameters. Requires Authorization header.
•	Success Response (200 OK):
•	{
•	  "success": true,
•	  "data": {
•	    "_id": "string (MongoDB ObjectId)",
•	    "username": "string",
•	    "email": "string",
•	    "createdAt": "string (ISO Date)",
•	    "updatedAt": "string (ISO Date)"
•	  }
•	}

•	Error Responses:
o	401 Unauthorized: {"success": false, "message": "Not authorized to access this route"} or {"success": false, "message": "Not authorized, token failed"}
o	404 Not Found: {"success": false, "message": "User not found"}
o	500 Internal Server Error: {"success": false, "message": "Server Error"}
2. Transaction Management
All transaction endpoints require authentication.
GET /api/transactions
•	Description: Retrieves a list of transactions for the authenticated user with advanced filtering, search, sorting, and pagination capabilities.
•	Access: Private (requires JWT)
•	Query Parameters:
o	page (Number, default: 1): The current page number for pagination.
o	limit (Number, default: 10): The number of transactions per page.
o	sortBy (String, default: date): Field to sort the results by (e.g., date, amount, description, category, type, status).
o	order (String, default: desc): Sort order (asc for ascending, desc for descending).
o	category (String, optional): Filter by transaction category (case-sensitive).
o	type (String, optional): Filter by transaction type (income or expense).
o	status (String, optional): Filter by transaction status (pending, completed, cancelled).
o	startDate (String, optional, ISO Date format): Filter transactions with a date on or after this date.
o	endDate (String, optional, ISO Date format): Filter transactions with a date on or before this date.
o	amountMin (Number, optional): Filter transactions with an amount greater than or equal to this value.
o	amountMax (Number, optional): Filter transactions with an amount less than or equal to this value.
o	search (String, optional): Search across description and category fields (case-insensitive, uses regex).
•	Success Response (200 OK):
•	{
•	  "success": true,
•	  "count": 10,
•	  "totalResults": 50,
•	  "totalPages": 5,
•	  "currentPage": 1,
•	  "pagination": {
•	    "next": { "page": 2, "limit": 10 }
•	    // "prev": { "page": 0, "limit": 10 } // Only if not on first page
•	  },
•	  "data": [
•	    {
•	      "_id": "60b8d7e0f2b6c3d4e5f6a7b8",
•	      "user": "68604a8e3da067ed1ca77004",
•	      "description": "Monthly Salary",
•	      "amount": 3000.00,
•	      "type": "income",
•	      "category": "Salary",
•	      "date": "2025-06-25T00:00:00.000Z",
•	      "status": "completed",
•	      "createdAt": "2025-06-28T10:00:00.000Z",
•	      "updatedAt": "2025-06-28T10:00:00.000Z"
•	    },
•	    // ... more transaction objects
•	  ]
•	}

•	Error Responses:
o	401 Unauthorized: (If no token or invalid token)
o	500 Internal Server Error: {"success": false, "message": "Failed to load transactions."}
POST /api/transactions
•	Description: Creates a new transaction for the authenticated user.
•	Access: Private (requires JWT)
•	Request Body (JSON):
•	{
•	  "description": "string (max 200 characters)",
•	  "amount": "number (positive)",
•	  "type": "income" | "expense",
•	  "category": "string (max 100 characters)",
•	  "date": "string (ISO Date format, e.g., '2025-06-28T12:00:00Z')",
•	  "status": "pending" | "completed" | "cancelled" (default: 'completed')
•	}

o	Note: The user field is automatically set by the backend based on the authenticated user's token.
•	Success Response (201 Created):
•	{
•	  "success": true,
•	  "data": {
•	    "_id": "string (MongoDB ObjectId)",
•	    "user": "string (MongoDB ObjectId of authenticated user)",
•	    "description": "string",
•	    "amount": "number",
•	    "type": "string",
•	    "category": "string",
•	    "date": "string (ISO Date)",
•	    "status": "string",
•	    "createdAt": "string (ISO Date)",
•	    "updatedAt": "string (ISO Date)"
•	  }
•	}

•	Error Responses:
o	400 Bad Request: {"success": false, "message": "Validation error messages, e.g., 'Please add a description'"}
o	401 Unauthorized: (If no token or invalid token)
o	500 Internal Server Error: {"success": false, "message": "Server Error"}
GET /api/transactions/summary
•	Description: Provides aggregated financial summary data for the authenticated user, including monthly income/expense trends and a breakdown of expenses by category.
•	Access: Private (requires JWT)
•	Query Parameters (Optional):
o	startDate (String, optional, ISO Date format): Filter summary data from this date.
o	endDate (String, optional, ISO Date format): Filter summary data up to this date.
•	Success Response (200 OK):
•	{
•	  "success": true,
•	  "data": {
•	    "monthlySummary": [
•	      {
•	        "_id": { "year": 2024, "month": 1 },
•	        "totalIncome": 4550.00,
•	        "totalExpense": 2540.00
•	      },
•	      // ... more monthly summaries
•	    ],
•	    "categoryBreakdown": [
•	      {
•	        "_id": "Food",
•	        "totalAmount": 1500.00,
•	        "totalIncome": 0,
•	        "totalExpense": 1500.00
•	      },
•	      {
•	        "_id": "Housing",
•	        "totalAmount": 3600.00,
•	        "totalIncome": 0,
•	        "totalExpense": 3600.00
•	      },
•	      // ... more category breakdowns
•	    ],
•	    "summaryMetrics": {
•	      "totalIncome": 12345.67,
•	      "totalExpense": 8765.43,
•	      "netProfit": 3580.24
•	    }
•	  }
•	}

•	Error Responses:
o	401 Unauthorized: (If no token or invalid token)
o	500 Internal Server Error: {"success": false, "message": "Failed to fetch summary data."}
GET /api/transactions/export-csv
•	Description: Exports transaction data for the authenticated user to a CSV file. Supports filtering similar to GET /api/transactions and allows selection of specific columns.
•	Access: Private (requires JWT)
•	Query Parameters:
o	columns (String, Required): A comma-separated string of column values to include in the CSV (e.g., _id,description,amount,type,category,date,status,createdAt).
o	Optional Filtering Parameters: All optional query parameters from GET /api/transactions can also be used here to filter the data before export (category, type, status, startDate, endDate, amountMin, amountMax, search).
•	Success Response (200 OK):
o	Returns a CSV file directly. The Content-Type header will be text/csv and Content-Disposition will suggest a filename like transactions_YYYY-MM-DD.csv.
•	Error Responses:
o	400 Bad Request: {"success": false, "message": "No columns selected for export."}
o	401 Unauthorized: (If no token or invalid token)
o	500 Internal Server Error: {"success": false, "message": "Failed to generate CSV export"}
•	Usage Examples
Once logged into the dashboard:
•	View Transactions: The main table displays all transactions. Use pagination at the bottom to navigate through pages.
•	Sort Data: Click on table headers (e.g., "Description", "Amount", "Date") to sort the data in ascending or descending order.
•	Filter Data:
o	Use the "Type" and "Status" dropdowns above the table to quickly filter transactions.
o	Click "Show Filters" in the "Analytics Filters" section to reveal date range filters for charts and overall metrics. Click "Apply Filters" after selecting dates.
•	Search: Type keywords into the "Search Description or Category" field to find specific transactions.
•	Add Transaction: Click the "Add Transaction" button in the navigation bar to open a modal for adding new entries.
•	Export CSV: Click the "Export CSV" button to open a modal. Select the columns you wish to include in your CSV file and click "Export CSV" to download.

UI Screenshots
![Screenshot (195)](https://github.com/user-attachments/assets/fe7ccc81-2776-432c-8043-e1e8fda79bde)

