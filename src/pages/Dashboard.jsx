import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {
  faCircleCheck,
  faHourglassHalf,
  faTrashCan,
} from "@fortawesome/free-regular-svg-icons";
import {
  faArrowRightToBracket,
  faClockRotateLeft,
  faPiggyBank,
} from "@fortawesome/free-solid-svg-icons";
import ReceiptScanner from "../components/ReceiptScanner";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle]         = useState("");
  const [amount, setAmount]       = useState("");
  const [category, setCategory]   = useState("Food");
  const [status, setStatus]       = useState("Pending");
  const [borrowFrom, setBorrowFrom] = useState("");
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  // Receipt scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scanBanner, setScanBanner]   = useState(null); // { amount, date, narration }

  // Expenses state
  const [expenses, setExpenses]       = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [dailyTotal, setDailyTotal]   = useState(0);
  const [today, setToday]             = useState(new Date());

  // Logout
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Called by ReceiptScanner when parsing succeeds
  // Called by ReceiptScanner when parsing succeeds — auto-saves instantly
const handleReceiptParsed = async (data) => {
  console.log("handleReceiptParsed called", data); // 👈
  
  if (!data.amount) {
    setError("Could not read amount from receipt. Please add manually.");
    setShowScanner(false);
    return;
  }

  const resolvedCategory = data.category || "Other";
  const resolvedTitle    = data.title     || data.narration || "Receipt expense";

  try {
    const expenseRef = collection(db, "users", user.uid, "expenses");
    await addDoc(expenseRef, {
      title:        resolvedTitle,
      amount:       parseFloat(data.amount),
      category:     resolvedCategory,
      status:       null,
      borrowedFrom: null,
      date:         serverTimestamp(),
    });

    console.log("Saved successfully!"); // 👈
    setScanBanner(data);
    setShowScanner(false);
    setSuccess(`✅ Saved! ₦${data.amount.toLocaleString()} · ${resolvedCategory} · "${resolvedTitle}"`);
  } catch (err) {
    console.error("Firebase save error:", err); // 👈
    setError("Receipt scanned but failed to save. Please try again.");
  }
};

  // Add expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title && category !== "Borrow") {
      setError("Please enter a title");
      return;
    }
    if (!amount) {
      setError("Please enter an amount");
      return;
    }
    if (category === "Borrow" && !borrowFrom) {
      setError("Please enter who you borrowed from");
      return;
    }

    try {
      const expenseRef = collection(db, "users", user.uid, "expenses");
      await addDoc(expenseRef, {
        title:        title,
        amount:       parseFloat(amount),
        category,
        status:       category === "Borrow" ? status : null,
        borrowedFrom: category === "Borrow" ? borrowFrom : null,
        date:         serverTimestamp(),
      });

      setTitle("");
      setAmount("");
      setCategory("Food");
      setStatus("Pending");
      setBorrowFrom("");
      setScanBanner(null);
      setSuccess("Expense added successfully!");
    } catch (err) {
      setError("Failed to add expense");
    }
  };

  // Real-time listener
  useEffect(() => {
    if (!user) return;

    const expensesRef = collection(db, "users", user.uid, "expenses");
    const q = query(expensesRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
      }));

      setAllExpenses(data);

      const now          = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayExpenses = data.filter((exp) => exp.date && exp.date >= startOfToday);
      setExpenses(todayExpenses);
    });

    return () => unsubscribe();
  }, [user]);

  // Calculate daily total
  useEffect(() => {
    const total = expenses
      .filter(
        (exp) =>
          exp.date &&
          exp.date.getDate()     === today.getDate() &&
          exp.date.getMonth()    === today.getMonth() &&
          exp.date.getFullYear() === today.getFullYear() &&
          exp.category !== "Borrow"
      )
      .reduce((acc, exp) => acc + exp.amount, 0);

    setDailyTotal(total);
  }, [expenses, today]);

  // Reset "today" at midnight
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    const timer = setTimeout(() => setToday(new Date()), msUntilMidnight);
    return () => clearTimeout(timer);
  }, []);

  // Delete expense
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "users", user.uid, "expenses", id));
    } catch (err) {
      console.log("Failed to delete expense:", err);
    }
  };

  // Toggle borrow status
  const handleToggleStatus = async (exp) => {
    if (!exp.id) return;
    const docRef = doc(db, "users", user.uid, "expenses", exp.id);
    await updateDoc(docRef, {
      status: exp.status === "Pending" ? "Paid Back" : "Pending",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8 gap-2">
          <h1 className="text-2xl font-bold text-cyan-800">
            Welcome, {user?.displayName || user?.email}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/history")}
              className="bg-cyan-700 py-2 px-4 rounded-lg text-white hover:bg-cyan-600 transition"
            >
              <FontAwesomeIcon icon={faClockRotateLeft} /> History
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              <FontAwesomeIcon icon={faArrowRightToBracket} /> Logout
            </button>
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow text-center">
            <p className="text-sm text-gray-500">This Week</p>
            <p className="text-xl font-bold text-cyan-800">
              ₦{allExpenses
                .filter((exp) => {
                  if (!exp.date || exp.category === "Borrow") return false;
                  const today = new Date();
                  const startOfWeek = new Date(today);
                  startOfWeek.setHours(0, 0, 0, 0);
                  startOfWeek.setDate(today.getDate() - today.getDay());
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);
                  endOfWeek.setHours(23, 59, 59, 999);
                  return exp.date >= startOfWeek && exp.date <= endOfWeek;
                })
                .reduce((acc, exp) => acc + exp.amount, 0)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow text-center">
            <p className="text-sm text-gray-500">This Month</p>
            <p className="text-xl font-bold text-cyan-800">
              ₦{allExpenses
                .filter((exp) => {
                  const now     = new Date();
                  const expDate = exp.date;
                  return (
                    expDate &&
                    expDate.getMonth()    === now.getMonth() &&
                    expDate.getFullYear() === now.getFullYear() &&
                    exp.category !== "Borrow"
                  );
                })
                .reduce((acc, exp) => acc + exp.amount, 0)}
            </p>
          </div>
        </div>

        {/* Add Expense Form */}
        <div className="bg-white p-6 rounded-2xl shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Add Expense</h2>
            {/* Scan Receipt toggle button */}
            <button
              onClick={() => { setShowScanner((v) => !v); setScanBanner(null); }}
              className="flex items-center gap-2 bg-cyan-50 border border-cyan-300 text-cyan-700 text-sm px-3 py-1.5 rounded-lg hover:bg-cyan-100 transition"
            >
              {showScanner ? "Close Scanner" : "Scan Receipt"}
            </button>
          </div>

          {/* Receipt Scanner — shown when toggled */}
          {showScanner && (
            <div className="mb-4">
              <ReceiptScanner onReceiptParsed={handleReceiptParsed} />
              <p className="text-xs text-gray-400 mt-2 text-center">
                💡 Tip: When paying, type your narration as{" "}
                <span className="font-medium text-gray-500">Category - Title</span>
                {" "}e.g. <span className="italic">Transport - Uber ride</span>
              </p>
            </div>
          )}

          {/* Scan result banner */}
          {scanBanner && (
            <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-sm text-cyan-800">
              <p className="font-semibold mb-1">🧾 Scanned from receipt</p>
              <p>Amount: <span className="font-medium">₦{scanBanner.amount?.toLocaleString()}</span></p>
              {scanBanner.narration && <p>Narration: <span className="font-medium">{scanBanner.narration}</span></p>}
              {scanBanner.date      && <p>Date on receipt: <span className="font-medium">{scanBanner.date}</span></p>}
            </div>
          )}

          {error   && <p className="bg-red-100 text-red-600 p-2 rounded mb-4">{error}</p>}
          {success && <p className="bg-green-100 text-green-600 p-2 rounded mb-4">{success}</p>}

          <form onSubmit={handleAddExpense} className="space-y-4">
            <input
              type="text"
              placeholder="Expense title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Bills">Bills</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Borrow">Borrow</option>
              <option value="Other">Other</option>
            </select>

            {category === "Borrow" && (
              <>
                <input
                  type="text"
                  placeholder="Borrowed from (Person's name)"
                  value={borrowFrom}
                  onChange={(e) => setBorrowFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid Back">Paid Back</option>
                </select>
              </>
            )}

            <button
              type="submit"
              className="w-full bg-cyan-800 hover:bg-cyan-700 text-white py-2 rounded-lg font-medium transition duration-200"
            >
              <FontAwesomeIcon icon={faPiggyBank} className="mr-2" />
              Add Expense
            </button>
          </form>
        </div>

        {/* Expense List */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4 flex justify-between">
            Expenses
            <span className="text-gray-500 font-normal">
              Today's Total: ₦{dailyTotal}
            </span>
          </h2>

          {expenses.length === 0 ? (
            <p className="text-gray-600">No expenses yet</p>
          ) : (
            <ul className="space-y-3 max-h-80 overflow-y-auto">
              {expenses.map((exp) => (
                <li
                  key={exp.id}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{exp.title}</p>
                    <p className="text-sm text-gray-500">
                      {exp.category}
                      {exp.category === "Borrow" && exp.borrowedFrom && ` (from ${exp.borrowedFrom})`}
                      {exp.category === "Borrow" && (
                        <span
                          className={`ml-2 text-sm font-medium px-2 py-1 rounded-full ${
                            exp.status === "Pending"
                              ? "bg-yellow-200 text-yellow-800"
                              : "bg-green-200 text-green-800"
                          }`}
                        >
                          {exp.status}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-cyan-800 font-semibold">₦{exp.amount}</span>
                    <button
                      onClick={() =>
                        exp.category === "Borrow"
                          ? handleToggleStatus(exp)
                          : handleDelete(exp.id)
                      }
                      className="text-red-500 hover:text-red-600 font-bold"
                    >
                      {exp.category === "Borrow" ? (
                        exp.status === "Pending" ? (
                          <FontAwesomeIcon icon={faCircleCheck} className="text-green-600" />
                        ) : (
                          <FontAwesomeIcon icon={faHourglassHalf} className="text-yellow-600" />
                        )
                      ) : ""}
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="text-red-500 hover:text-red-600 font-bold"
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
