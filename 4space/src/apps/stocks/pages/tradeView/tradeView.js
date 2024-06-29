import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './tradeView.css';
import { useAuthDispatch, useAuthState } from "../../../../general/components/Authentication/utils/AuthProvider";
import GetConfig from "../../../../general/components/Authentication/utils/config";
import stockConfig from '../../utils/config';
import API_BASE_URL from "../../../../config";

// Register chart.js components
Chart.register(...registerables);

const TradeView = () => {
    const { isAuthenticated } = useAuthDispatch();
    const { token } = useAuthState();
    const config = GetConfig(token);

    const [stockData, setStockData] = useState({});
    const [newSymbol, setNewSymbol] = useState('');
    const websocket = useRef(null);
    const isWebSocketInitialized = useRef(false);

    const [marketIsOpen, setMarketIsOpen] = useState(false);

    // useEffect(() => {
    //     if (!isWebSocketInitialized.current) {
    //         console.log('Initializing WebSocket connection...');
    //         websocket.current = new WebSocket(stockConfig.websocketUrl, [], config);
    //         isWebSocketInitialized.current = true;

    //         websocket.current.onopen = () => {
    //             console.log('WebSocket connection established');
    //             // watchList.forEach(symbol => {
    //                 // console.log(symbol);
    //                 websocket.current.send(JSON.stringify({ type: 'subscribe', symbol: 'TSLA' }))
    //             // });
    //         };

    //         websocket.current.onmessage = (event) => {
    //             const data = JSON.parse(event.data);
    //             console.log('WebSocket message received:', data);

    //             if (data.type === 'ping') {
    //                 console.log('Received ping from server');
    //                 websocket.current.send(JSON.stringify({ type: 'pong' })); // Respond to ping
    //             } else if (data.type === 'trade') {
    //                 data.data.forEach(trade => {
    //                     console.log(`Received trade data for ${trade.s}: Price=${trade.p}, Volume=${trade.v}, Time=${trade.t}`);
    //                     setStockData(prevState => {
    //                         const updatedState = { ...prevState };
    //                         if (!updatedState[trade.s]) {
    //                             updatedState[trade.s] = [];
    //                         }
    //                         updatedState[trade.s].push({ price: trade.p, time: trade.t });
    //                         return updatedState;
    //                     });
    //                 });
    //             }
    //         };

    //         websocket.current.onclose = () => {
    //             console.log('WebSocket closed');
    //             websocket.current = null;
    //         };

    //         websocket.current.onerror = (error) => {
    //             console.error('WebSocket error:', error);
    //         };

    //         // Cleanup function
    //         return () => {
    //             if (websocket && websocket.current.readyState === WebSocket.OPEN) {
    //                 websocket.current.close();
    //             }
    //         };
    //     }
    // }, [watchList]);

    // const handleAddSymbol = () => {
    //     if (newSymbol && !watchList.includes(newSymbol)) {
    //         setWatchList([...watchList, newSymbol]);
    //         websocket.current.send(JSON.stringify({ type: 'subscribe', symbol: newSymbol }));
    //     }
    //     setNewSymbol('');
    // };

    // const chartData = (symbol) => {
    //     if (!stockData[symbol]) {
    //         return { labels: [], datasets: [] };
    //     }
    //     const prices = stockData[symbol].map(data => data.price);
    //     const times = stockData[symbol].map(data => new Date(data.time).toLocaleTimeString());
    //     return {
    //         labels: times,
    //         datasets: [
    //             {
    //                 label: `${symbol} Price`,
    //                 data: prices,
    //                 borderColor: 'rgba(75, 192, 192, 1)',
    //                 fill: false,
    //             },
    //         ],
    //     };
    // };

    const [watchList, setWatchList] = useState([
        {
            ticker: 'TSLA',
            name: 'Tesla',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },
        {
            ticker: 'AAPL',
            name: 'Apple',
        },

    ]);

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

useEffect(() => {
    fetchMarketStatus();
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


    const stocksList = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}api/apps/stocks/stocks/`, config);
            console.log(response.data);
            // console.save(response.data, 'stocks_data.txt');
        } catch (error) {
            console.error('Error', error);
        }
    };
    

    useEffect(() => {
        stocksList();
    }, []);


    return (
        <div className="trade-view">
            <div className="trade-view-header">
                <div className="trade-view-header-inner">
                    <h2>Trade View</h2>
                </div>
            </div>
            <div className="trade-view-content">
                <div className="trade-view-content-inner">
                    <div className="trade-view-my-watch-list">
                        <div className="trade-view-my-watch-list-header">
                            <h3>My Watchlist</h3>
                        </div>
                        <div className="trade-view-my-watch-list-content">
                            {watchList.map((per_stock, index) =>
                                <div key={index} className="per-stock-card">
                                    <div className="per-stock-card-inner">
                                        <div className="per-stock-header">
                                            <p className="stock-name-text">{per_stock.name}</p>
                                            <p className="stock-ticker-text">{per_stock.ticker}</p>
                                        </div>
                                        <div className="per-stock-graph">

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
