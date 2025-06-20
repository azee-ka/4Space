// src/services/tools.jsx
import apiCall from "../utils/api";

export const solveExpression = async (expression) => {
  const res = await apiCall(
    "space/projects/tools/calculator/solve/",
    "POST",
    { expression }
  );
  return res.data;
};


export const fetchCalculatorHistory = async () => {
  const res = await apiCall("space/projects/tools/calculator/history/", "GET");
  return res.data;
};
