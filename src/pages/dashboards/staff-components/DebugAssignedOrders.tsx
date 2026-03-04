/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { orderService } from '@/services/order.service';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export const DebugAssignedOrders: React.FC = () => {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null);

  // Load current user info from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setCurrentUserInfo({
          fromContext: user,
          fromLocalStorage: userData,
          hasToken: !!token,
          tokenPreview: token ? token.substring(0, 30) + '...' : null,
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [user]);

  const testGetAssignedOrders = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing GET /orders/assigned...');
      const response = await api.get('/orders/assigned', { 
        params: { page: 1, limit: 10 } 
      });
      console.log('✅ Raw response:', response.data);
      setResult({
        success: true,
        endpoint: 'GET /orders/assigned',
        rawResponse: response.data,
        dataStructure: {
          hasData: !!response.data?.data,
          hasItems: !!response.data?.data?.items,
          itemsCount: response.data?.data?.items?.length || 0,
          firstItem: response.data?.data?.items?.[0] || null,
        }
      });
    } catch (error: any) {
      console.error('❌ Error:', error);
      setResult({
        success: false,
        endpoint: 'GET /orders/assigned',
        error: error.response?.data || error.message,
        errorStatus: error.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  const testGetAllOrders = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing GET /orders (all orders)...');
      const response = await api.get('/orders', { 
        params: { page: 1, limit: 10 } 
      });
      console.log('✅ Raw response:', response.data);
      
      // Extract orders
      const payload = response.data?.data ?? response.data;
      const orders = Array.isArray(payload?.data) ? payload.data : 
                     Array.isArray(payload) ? payload : [];
      
      setResult({
        success: true,
        endpoint: 'GET /orders',
        rawResponse: response.data,
        extractedOrders: orders.slice(0, 3), // Show first 3 orders
        ordersCount: orders.length,
        ordersWithStaff: orders.filter((o: any) => o.assignedStaffId || o.staffId || o.assigned_staff_id),
      });
    } catch (error: any) {
      console.error('❌ Error:', error);
      setResult({
        success: false,
        endpoint: 'GET /orders',
        error: error.response?.data || error.message,
        errorStatus: error.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  const testWithService = async () => {
    setLoading(true);
    try {
      console.log('🔍 Testing orderService.getAssignedOrders()...');
      const data = await orderService.getAssignedOrders({ page: 1, limit: 10 });
      console.log('✅ Service returned:', data);
      setResult({
        success: true,
        endpoint: 'orderService.getAssignedOrders()',
        serviceResponse: data,
        itemsCount: data.items?.length || 0,
        firstItem: data.items?.[0] || null,
        allItems: data.items || [],
      });
    } catch (error: any) {
      console.error('❌ Error:', error);
      setResult({
        success: false,
        endpoint: 'orderService.getAssignedOrders()',
        error: error.response?.data || error.message,
        errorStatus: error.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6">
      {/* Current User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>👤 Current User Info</CardTitle>
        </CardHeader>
        <CardContent>
          {currentUserInfo ? (
            <Textarea 
              value={JSON.stringify(currentUserInfo, null, 2)} 
              readOnly 
              rows={15}
              className="font-mono text-xs"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Loading user info...</p>
          )}
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
              🔑 Key Check: Compare <code>fromLocalStorage.id</code> with <code>order.handledBy</code>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              If they don't match, backend will reject your actions!
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Assigned Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testGetAssignedOrders} disabled={loading}>
              {loading ? 'Testing...' : 'Test GET /orders/assigned'}
            </Button>
            <Button onClick={testGetAllOrders} disabled={loading} variant="secondary">
              Test GET /orders (all)
            </Button>
            <Button onClick={testWithService} disabled={loading} variant="outline">
              Test orderService (Final)
            </Button>
          </div>

          <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
            <p className="font-semibold mb-1">ℹ️ Test Instructions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Test orderService</strong> - This is what your app uses. Should show 6 orders.</li>
              <li>If you see <strong className="text-green-600">"Found X orders"</strong> with X &gt; 0, the fix works! ✅</li>
              <li>Now go to <strong>"My Orders"</strong> tab to see the actual list.</li>
            </ul>
          </div>

          {result && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2 text-lg">
                {result.success ? '✅ Success' : '❌ Error'}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Endpoint:</strong> {result.endpoint}
              </p>
              {result.success && result.itemsCount !== undefined && (
                <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    📊 Found {result.itemsCount} orders
                  </p>
                </div>
              )}
              <Textarea 
                value={JSON.stringify(result, null, 2)} 
                readOnly 
                rows={20}
                className="font-mono text-xs"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
