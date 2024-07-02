import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Chart, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';
import './tradeView.css';
import { useAuthState } from "../../../../general/components/Authentication/utils/AuthProvider";
import GetConfig from "../../../../general/components/Authentication/utils/config";
import stockConfig from '../../utils/config';
import API_BASE_URL from "../../../../config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import 'chartjs-adapter-date-fns';

// Register chart.js components
Chart.register(...registerables);

const TradeView = () => {
    const { token } = useAuthState();
    const config = GetConfig(token);

    const [stockData, setStockData] = useState({});
    const chartRefs = useRef({});
    const [watchList, setWatchList] = useState([]);
    const [newSymbol, setNewSymbol] = useState('');
    const [stockSearchQuery, setStockSearchQuery] = useState('');
    const [stockSearchQueryResults, setStockSearchQueryResults] = useState([]);

    const websocket = useRef(null);
    const isWebSocketInitialized = useRef(false);

    useEffect(() => {
        fetchMarketStatus();
        fetchWatchList();
    }, []);

    useEffect(() => {
        if (!isWebSocketInitialized.current && watchList.length > 0) {
            console.log('Initializing WebSocket connection...');
            websocket.current = new WebSocket(stockConfig.websocketUrl, [], config);
            isWebSocketInitialized.current = true;

            websocket.current.onopen = () => {
                console.log('WebSocket connection established');
                watchList.forEach(stock => {
                    websocket.current.send(JSON.stringify({ type: 'subscribe', symbol: stock.symbol }));
                });
            };

            websocket.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log(data)
                if (data.type === 'trade') {
                    const { symbol, price, time } = data.data;
                    setStockData(prevData => ({
                        ...prevData,
                        [symbol]: [
                            ...(prevData[symbol] || []),
                            { price, time }
                        ]
                    }));
                }
            };

            websocket.current.onclose = () => {
                console.log('WebSocket closed');
                websocket.current = null;
            };

            websocket.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            return () => {
                if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
                    websocket.current.close();
                }
            };
        }
    }, [watchList, config]);

    useEffect(() => {
        // Render charts when stockData or watchList changes
        watchList.forEach(stock => {
            if (chartRefs.current[stock.symbol]) {
                const chartData = getChartData(stock.symbol);
                renderChart(stock.symbol, chartData);
            }
        });
    }, [stockData, watchList]);

    const handleAddSymbol = () => {
        if (newSymbol && !watchList.some(stock => stock.symbol === newSymbol)) {
            setWatchList([...watchList, { symbol: newSymbol, description: newSymbol }]);
            websocket.current.send(JSON.stringify({ type: 'subscribe', symbol: newSymbol }));
        }
        setNewSymbol('');
    };

    const fetchMarketStatus = async () => {
        try {
            const response = await axios.get(`${stockConfig.baseUrl}/stock/market-status?exchange=US&token=${process.env.REACT_APP_WEBSOCKET_TOKEN}`);
            // Update market status if needed
        } catch (error) {
            console.error('Error fetching market status', error);
        }
    };

    const fetchWatchList = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/apps/stocks/watchlist/`, config);
            setWatchList(response.data);
        } catch (error) {
            console.error('Error fetching watchlist', error);
        }
    };

    const getChartData = (symbol) => {
        const data = stockData[symbol] || [];
        const prices = data.map(d => d.price);
        const times = data.map(d => new Date(d.time));

        return {
            labels: times,
            datasets: [
                {
                    label: `${symbol} Price`,
                    data: prices,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    fill: false,
                },
            ],
        };
    };

    const renderChart = (symbol, data) => {
        const ctx = chartRefs.current[symbol].getContext('2d');

        if (chartRefs.current[symbol].chart) {
            chartRefs.current[symbol].chart.destroy();
        }

        chartRefs.current[symbol].chart = new Chart(ctx, {
            type: 'line',
            data,
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute',
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Price',
                        },
                    },
                },
            },
        });
    };

    const handleInputChange = (e) => {
        setStockSearchQuery(e.target.value);

        if (e.target.value) {
            handleSubmitSearch(e.target.value);
        } else {
            setStockSearchQueryResults([]);
        }
    };

    const handleSubmitSearch = async (query) => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/apps/stocks/search/?query=${query}`, config);
            setStockSearchQueryResults(response.data);
        } catch (error) {
            console.error('Error searching stocks', error);
        }
    };

    const handleAddStockToWatchlist = async (stock_id) => {
        try {
            await axios.post(`${API_BASE_URL}api/apps/stocks/add-to-watchlist/${stock_id}/`, null, config);
            fetchWatchList();
        } catch (error) {
            console.error('Error adding stock to watchlist', error);
        }
    };

    return (
        <div className="trade-view">
            <div className="trade-view-header">
                <div className="trade-view-header-inner">
                    <h2>Trade View</h2>
                </div>
            </div>
            <div className="trade-view-content">
                <div className="trade-view-content-inner">
                    <div className="trade-view-search-bar">
                        <div className={`trade-view-search-bar-inner ${stockSearchQueryResults.length === 0 ? '' : 'results-shown'}`}>
                            <input
                                placeholder="Search for stocks..."
                                value={stockSearchQuery}
                                onChange={handleInputChange}
                            />
                        </div>
                        {stockSearchQueryResults.length !== 0 &&
                            <div className="trade-view-search-results">
                                <div className="trade-view-search-results-inner">
                                    {stockSearchQueryResults.map((stock, index) => (
                                        <div key={index} className="per-stock-search-query">
                                            <div key={index} className="per-stock-search-query-inner">
                                                <p>{stock.description}</p>
                                                <div className="per-stock-search-add-to-watchlist-btn">
                                                    <button onClick={() => handleAddStockToWatchlist(stock.id)}>
                                                        <FontAwesomeIcon icon={faPlus} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        }
                    </div>
                    <div className="trade-view-my-watch-list">
                        <div className="trade-view-my-watch-list-header">
                            <h3>My Watchlist</h3>
                        </div>
                        <div className="trade-view-my-watch-list-content">
                            {watchList.map((per_stock, index) =>
                                <div key={index} className="per-stock-card">
                                    <div className="per-stock-card-inner">
                                        <div className="per-stock-header">
                                            <p className="stock-name-text">{per_stock.description}</p>
                                            <p className="stock-ticker-text">{per_stock.symbol}</p>
                                        </div>
                                        <div className="per-stock-graph">
                                            <canvas ref={(el) => chartRefs.current[per_stock.symbol] = el} id={`chart-${per_stock.symbol}`} width="300" height="110"></canvas>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TradeView;
