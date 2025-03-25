import React, { useState, useEffect } from "react";
import MikrotikDashboard from "./components/MikrotikDashboard";

function App() {
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Kiểm tra kết nối đến backend
    fetch('http://0.0.0.0:3001/api/routers')
      .then(response => {
        if (response.ok) {
          setIsBackendConnected(true);
        } else {
          setErrorMessage('Không thể kết nối với API. Lỗi phản hồi: ' + response.status);
        }
      })
      .catch(error => {
        console.error('Lỗi kết nối:', error);
        setErrorMessage('Không thể kết nối với backend API: ' + error.message);
      });
  }, []);

  return (
    <div className="App">
      {errorMessage ? (
        <div className="error-container" style={{ padding: '20px', margin: '20px', color: 'red', border: '1px solid red', borderRadius: '4px' }}>
          <h2>Lỗi kết nối</h2>
          <p>{errorMessage}</p>
          <p>Vui lòng kiểm tra xem backend server đã chạy chưa và cổng 3001 đã mở chưa.</p>
        </div>
      ) : isBackendConnected ? (
        <MikrotikDashboard />
      ) : (
        <div style={{ padding: '20px', margin: '20px' }}>
          <h2>Đang kết nối đến backend server...</h2>
          <p>Vui lòng đợi trong giây lát...</p>
        </div>
      )}
    </div>
  );
}

export default App;
