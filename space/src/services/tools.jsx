// src/services/calculator.jsx
import apiCall from "../utils/api";

export const solveExpression = async (expression) => {
  const res = await apiCall(
    "space/projects/tools/calculator/solve/",
    "POST",
    { expression }
  );
  return res.data;
};
