import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './tradeView.css';
import { useAuthDispatch, useAuthState } from "../../../../general/components/Authentication/utils/AuthProvider";
import GetConfig from "../../../../general/components/Authentication/utils/config";
import stockConfig from '../../utils/config';
import API_BASE_URL from "../../../../config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import 'chartjs-adapter-date-fns';

// Register chart.js components
Chart.register(...registerables);

const TradeView = () => {
    const { isAuthenticated } = useAuthDispatch();
    const { token } = useAuthState();
    const config = GetConfig(token);

    const [stockData, setStockData] = useState([
        {
            "v": 54266550,
            "vw": 209.7069,
            "o": 209.15,
            "c": 209.07,
            "h": 211.38,
            "l": 208.61,
            "t": 1719288000000,
            "n": 621125
        },
        {
            "v": 64531178,
            "vw": 213.1428,
            "o": 211.5,
            "c": 213.25,
            "h": 214.86,
            "l": 210.64,
            "t": 1719374400000,
            "n": 769036
        },
        {
            "v": 48631748,
            "vw": 213.9094,
            "o": 214.69,
            "c": 214.1,
            "h": 215.7395,
            "l": 212.35,
            "t": 1719460800000,
            "n": 644311
        },
        {
            "v": 80927625,
            "vw": 212.5954,
            "o": 215.77,
            "c": 210.62,
            "h": 216.07,
            "l": 210.3,
            "t": 1719547200000,
            "n": 729816
        }
    ],
        [
            {
                "v": 54266550,
                "vw": 209.7069,
                "o": 209.15,
                "c": 209.07,
                "h": 211.38,
                "l": 208.61,
                "t": 1719288000000,
                "n": 621125
            },
            {
                "v": 64531178,
                "vw": 213.1428,
                "o": 211.5,
                "c": 213.25,
                "h": 214.86,
                "l": 210.64,
                "t": 1719374400000,
                "n": 769036
            },
            {
                "v": 48631748,
                "vw": 213.9094,
                "o": 214.69,
                "c": 214.1,
                "h": 215.7395,
                "l": 212.35,
                "t": 1719460800000,
                "n": 644311
            },
            {
                "v": 80927625,
                "vw": 212.5954,
                "o": 215.77,
                "c": 210.62,
                "h": 216.07,
                "l": 210.3,
                "t": 1719547200000,
                "n": 729816
            }
        ]);

    const chartRefs = useRef({});

    const [marketIsOpen, setMarketIsOpen] = useState(false);
    const [watchList, setWatchList] = useState([]);

    const [stockSearchQuery, setStockSearchQuery] = useState('')
    const [stockSearchQueryResults, setStockSearchQueryResults] = useState([])

    // /stock/market-status?exchange=US

    const fetchMarketStatus = async () => {
        try {
            const response = await axios.get(`${stockConfig.baseUrl}/stock/market-status?exchange=US&token=${process.env.REACT_APP_WEBSOCKET_TOKEN}`);
            console.log(response.data);
            setMarketIsOpen(response.data.isOpen);
        } catch (error) {
            console.error('Error', error);
        }
    };


    const fetchWatchList = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/apps/stocks/watchlist/`, config);
            console.log(response.data);
            setWatchList(response.data);

        } catch (error) {
            console.error('Error', error);
        }
    };

    useEffect(() => {
        fetchMarketStatus();
        fetchWatchList();
    }, [])


    // Define a function to save console output to a file
    const saveToFile = (data, filename) => {
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    };

    // Extend console to have a save method
    console.save = (data, filename) => {
        if (!data) {
            console.error('Console.save: No data');
            return;
        }

        if (!filename) filename = 'console.json';

        if (typeof data === 'object') {
            data = JSON.stringify(data, undefined, 4);
        }

        saveToFile(data, filename);
    };


    const handleInputChange = (e) => {
        const inputValue = e.target.value;
        setStockSearchQuery(inputValue);

        if (inputValue !== "") {
            handleSubmitSearch(inputValue);
        } else {
            setStockSearchQueryResults([]);
        }
    };

    const handleSubmitSearch = async (symbol) => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/apps/stocks/search/?query=${symbol}`, config);
            // console.log(response.data);
            setStockSearchQueryResults(response.data);
            // console.save(response.data, 'stocks_data.txt');
        } catch (error) {
            console.error('Error', error);
        }
    };

    // add-to-watchlist/
    const handleAddStockToWatchlist = async (stock_id) => {
        try {
            const response = await axios.post(`${API_BASE_URL}api/apps/stocks/add-to-watchlist/${stock_id}/`, null, config);
            console.log(response.data);
            // console.save(response.data, 'stocks_data.txt');
        } catch (error) {
            console.error('Error', error);
        }
    };


    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             // const response = await axios.get('https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2024-06-25/2024-06-28?adjusted=true&sort=asc&apiKey=xweYDCCFAmHWRoG5he7ONfKNnH3Uq3ao');
    //             // console.save(response.data.results);
    //             // console.log(response.data);
    //             setStockData(data);
    //         } catch (error) {
    //             console.error("Error", error);
    //         }
    //     };

    //     fetchData();
    // }, []);

    // Render charts for each stock in watchlist
    useEffect(() => {
        // Iterate through watchlist and render charts
        watchList.forEach(stock => {
            const chartData = getChartData(stock.symbol);
            renderChart(stock.symbol, chartData);
        });
    }, [watchList]);

    // Function to get chart data for a specific symbol
    const getChartData = (symbol) => {
        const prices = stockData.map(data => data.c);
        const times = stockData.map(data => new Date(data.t));
        return {
            labels: times,
            datasets: [
                {
                    label: `${symbol} Price`,
                    data: prices,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1,
                    fill: false,
                },
            ],
        };
    };

    // Function to render a chart for a specific symbol
    const renderChart = (symbol, data) => {
        const ctx = chartRefs.current[symbol].getContext('2d');

        // Destroy existing chart if it exists
        if (chartRefs.current[symbol].chart) {
            chartRefs.current[symbol].chart.destroy();
        }

        // Create new chart instance
        chartRefs.current[symbol].chart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            tooltipFormat: 'PP',
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
        </div >
    );
};

export default TradeView;
