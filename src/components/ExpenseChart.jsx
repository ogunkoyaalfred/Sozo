import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const ExpenseChart = ({ expenses }) => {
  // Group by category
  const data = expenses.reduce((acc, exp) => {
    const existing = acc.find((item) => item.category === exp.category);
    if (existing) existing.amount += exp.amount;
    else acc.push({ category: exp.category, amount: exp.amount });
    return acc;
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="amount" fill="#0d9488" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ExpenseChart;
