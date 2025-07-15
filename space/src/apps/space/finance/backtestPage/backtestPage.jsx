// backtestPage.jsx 

import React from 'react';
import { useParams } from 'react-router-dom';
import './backtestPage.css';

export default function BacktestPage() {
  const { id } = useParams();
  return (
    <div className="backtest-page">
      <h1 className="backtest-title">Backtest #{id}</h1>
      <div className="backtest-charts">
        {/* Insert P&L and drawdown charts here */}
      </div>
      <div className="backtest-details">
        {/* Insert trade log table and metrics here */}
      </div>
    </div>
  );
}
