import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import ExpenseChart from "../components/ExpenseChart";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleArrowLeft } from "@fortawesome/free-solid-svg-icons";

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch all expenses in real-time
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
      setExpenses(data);
    });

    return () => unsubscribe();
  }, [user]);

  // Filter expenses by category & date
  const filteredExpenses = expenses.filter((exp) => {
    let inCategory =
      filterCategory === "All" || exp.category === filterCategory;
    let inDate = true;

    if (startDate) {
      inDate = exp.date >= new Date(startDate);
    }
    if (endDate) {
      inDate = inDate && exp.date <= new Date(endDate + "T23:59:59");
    }

    return inCategory && inDate;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-cyan-800 mb-6">
          Expense History
        </h1>

        <button
          onClick={() => navigate("/dashboard")}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition mb-4"
        >
         <FontAwesomeIcon icon={faCircleArrowLeft}/> Back to Dashboard
        </button>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow mb-6 flex flex-col sm:flex-row gap-4 items-center">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="All">All Categories</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Bills">Bills</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Borrow">Borrow</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl shadow mb-6">
          <ExpenseChart expenses={filteredExpenses} />
        </div>

        {/* List */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <ul className="space-y-3 max-h-80 overflow-y-auto">
            {filteredExpenses.length === 0 ? (
              <p className="text-gray-500">No expenses in this period</p>
            ) : (
              filteredExpenses.map((exp) => (
                <li
                  key={exp.id}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{exp.title}</p>
                    <p className="text-sm text-gray-500">
                      {exp.category}
                      {exp.category === "Borrow" &&
                        exp.borrowedFrom &&
                        `(from ${exp.borrowedFrom})`}
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
                  <span className="text-cyan-800 font-semibold">
                    ₦{exp.amount}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default History;
