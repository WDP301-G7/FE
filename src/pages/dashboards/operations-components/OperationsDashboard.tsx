import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { ShoppingCartOutlined, FileProtectOutlined } from '@ant-design/icons';

const OperationsDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Operations Dashboard</h1>
        <p className="text-muted-foreground">Manage logistics, shipping, and warehouse operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          className="p-4 bg-white rounded-lg shadow hover:bg-gray-50 text-left"
          onClick={() => navigate('/operations/orders')}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <span>Duyệt Đơn Hàng</span>
          </div>
        </button>
        <button
          className="p-4 bg-white rounded-lg shadow hover:bg-gray-50 text-left"
          onClick={() => navigate('/operations/stores')}
        >
          <div className="flex items-center gap-2">
            <ShoppingCartOutlined className="w-6 h-6 text-green-600" />
            <span>Quản Lý Cửa Hàng</span>
          </div>
        </button>
        <button
          className="p-4 bg-white rounded-lg shadow hover:bg-gray-50 text-left"
          onClick={() => navigate('/operations/inventory')}
        >
          <div className="flex items-center gap-2">
            <FileProtectOutlined className="w-6 h-6 text-purple-600" />
            <span>Quản Lý Tồn Kho</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default OperationsDashboard;
