import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  inventoryService,
  Inventory,
  CreateInventoryData,
  UpdateInventoryData,
} from '@/services/inventory.service';
import { productService, Product } from '@/services/product.service';
import { storeService, Store } from '@/services/store.service';
import {
  Card,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
} from 'antd';
import { motion } from 'framer-motion';
import {
  SearchOutlined,
  PlusOutlined,
  FilterOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

export const AdminInventoryManagement: React.FC = () => {
  const { hasRole } = useAuth();
  if (!hasRole(['ADMIN', 'admin'])) {
    return <Navigate to="/dashboard" replace />;
  }

  const { toast } = useToast();

  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  const [filterProductId, setFilterProductId] = useState<string | undefined>(undefined);
  const [filterStoreId, setFilterStoreId] = useState<string | undefined>(undefined);
  const [filterLowStock, setFilterLowStock] = useState<'ALL' | 'LOW' | 'OK'>('ALL');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<Inventory | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const [pendingActions, setPendingActions] = useState<Record<string, boolean>>({});

  const retryAsync = async <T,>(fn: () => Promise<T>, retries = 2, delay = 300): Promise<T> => {
    let attempt = 0;
    while (true) {
      try {
        return await fn();
      } catch (err) {
        if (attempt >= retries) throw err;
        attempt++;
        await new Promise((res) => setTimeout(res, delay * Math.pow(2, attempt - 1)));
      }
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadInventories();
  }, [pagination.page, search, filterProductId, filterStoreId, filterLowStock]);

  const loadLookups = async () => {
    try {
      const [prodRes, storeRes] = await Promise.all([
        productService.getProducts({ page: 1, limit: 1000 }),
        storeService.getStores({ page: 1, limit: 1000 }),
      ]);
      const prodList = (prodRes as any).data || prodRes;
      const storeList = (storeRes as any).data || storeRes;
      setProducts(Array.isArray(prodList) ? prodList : prodList.items || prodList.data || []);
      setStores(Array.isArray(storeList) ? storeList : storeList.items || storeList.data || []);
    } catch {
      toast({ title: 'Lỗi', description: 'Tải sản phẩm hoặc cửa hàng thất bại', variant: 'destructive' });
    }
  };

  const loadInventories = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.page, limit: pagination.limit };
      if (filterProductId) params.productId = filterProductId;
      if (filterStoreId) params.storeId = filterStoreId;
      if (filterLowStock === 'LOW') params.lowStock = true;

      const res: any = await inventoryService.getInventories(params);

      let items: Inventory[] = [];
      let total = 0;
      if (res && Array.isArray(res.data)) {
        items = res.data;
        total = res.pagination?.total || res.data.length;
      } else if (res && Array.isArray(res)) {
        items = res;
        total = res.length;
      } else if (res?.items && Array.isArray(res.items)) {
        items = res.items;
        total = res.total || res.items.length;
      } else if (res?.data && Array.isArray(res.data.data)) {
        items = res.data.data;
        total = res.data.pagination?.total || items.length;
      } else {
        items = res?.data || [];
      }

      setInventories(items);
      setPagination((prev) => ({ ...prev, total }));
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Tải dữ liệu tồn kho thất bại',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const data: CreateInventoryData = {
        productId: values.productId,
        storeId: values.storeId,
        quantity: values.quantity,
        reservedQuantity: values.reservedQuantity ?? 0,
      };
      await inventoryService.createInventory(data);
      toast({ title: 'Thành công', description: 'Tạo tồn kho thành công' });
      setIsCreateOpen(false);
      createForm.resetFields();
      loadInventories();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Tạo tồn kho thất bại';
      toast({ title: 'Lỗi', description: msg, variant: 'destructive' });
    }
  };

  const openEdit = (inv: Inventory) => {
    setEditing(inv);
    editForm.setFieldsValue({
      quantity: inv.quantity,
      reservedQuantity: inv.reservedQuantity,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (values: any) => {
    if (!editing) return;
    try {
      const data: UpdateInventoryData = {
        quantity: values.quantity,
        reservedQuantity: values.reservedQuantity,
      };
      await inventoryService.updateInventory(editing.id, data);
      toast({ title: 'Thành công', description: 'Cập nhật tồn kho thành công' });
      setIsEditOpen(false);
      editForm.resetFields();
      setEditing(null);
      loadInventories();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Cập nhật tồn kho thất bại';
      toast({ title: 'Lỗi', description: msg, variant: 'destructive' });
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xoá',
      content: 'Bạn có chắc muốn xoá bản ghi tồn kho này không?',
      okText: 'Xoá',
      okType: 'danger',
      cancelText: 'Huỷ',
      onOk: async () => {
        try {
          await inventoryService.deleteInventory(id);
          toast({ title: 'Thành công', description: 'Xoá tồn kho thành công' });
          loadInventories();
        } catch (error: any) {
          toast({
            title: 'Lỗi',
            description: error.response?.data?.message || 'Xoá thất bại',
            variant: 'destructive',
          });
        }
      },
    });
  };

  const doRelease = (inv: Inventory) => {
    let inputValue = 1;
    Modal.confirm({
      title: 'Giải phóng tồn kho',
      content: (
        <div style={{ marginTop: 12 }}>
          <Text>Nhập số lượng cần giải phóng:</Text>
          <InputNumber
            min={1}
            max={inv.reservedQuantity}
            defaultValue={1}
            style={{ width: '100%', marginTop: 8 }}
            onChange={(val) => { inputValue = val as number; }}
          />
        </div>
      ),
      okText: 'Giải phóng',
      cancelText: 'Huỷ',
      onOk: async () => {
        const q = inputValue;
        if (!q || q <= 0) return;
        const id = inv.id;
        const prev = inventories;
        setInventories((list) =>
          list.map((it) =>
            it.id === id ? { ...it, reservedQuantity: Math.max(0, it.reservedQuantity - q) } : it
          )
        );
        setPendingActions((p) => ({ ...p, [id]: true }));
        try {
          const updated = await retryAsync(() => inventoryService.adjustReserved(id, -q));
          setInventories((list) => list.map((it) => (it.id === id ? updated : it)));
          toast({ title: 'Thành công', description: 'Giải phóng tồn kho thành công' });
        } catch (error: any) {
          setInventories(prev);
          const msg = error.response?.data?.message || error.message;
          toast({ title: 'Lỗi', description: msg || 'Giải phóng thất bại', variant: 'destructive' });
        } finally {
          setPendingActions((p) => { const c = { ...p }; delete c[id]; return c; });
          loadInventories();
        }
      },
    });
  };

  const getProductName = (productId: string) =>
    products.find((p) => p.id === productId)?.name || productId;
  const getStoreName = (storeId: string) =>
    stores.find((s) => s.id === storeId)?.name || storeId;

  const getStockTag = (inv: Inventory) => {
    const available = Math.max(0, inv.quantity - inv.reservedQuantity);
    if (available === 0) return <Tag color="red">Hết hàng</Tag>;
    if (available <= 5) return <Tag color="orange">Còn ít</Tag>;
    return <Tag color="green">Bình thường</Tag>;
  };

  // Derived stats
  const totalInventories = inventories.length;
  const lowStockCount = inventories.filter(
    (inv) => Math.max(0, inv.quantity - inv.reservedQuantity) <= 5
  ).length;
  const totalReserved = inventories.reduce((sum, inv) => sum + inv.reservedQuantity, 0);
  const totalAvailable = inventories.reduce(
    (sum, inv) => sum + Math.max(0, inv.quantity - inv.reservedQuantity),
    0
  );

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_: unknown, record: Inventory) => (
        <Text strong>{getProductName(record.productId)}</Text>
      ),
    },
    {
      title: 'Cửa hàng',
      key: 'store',
      render: (_: unknown, record: Inventory) => (
        <Text>{getStoreName(record.storeId)}</Text>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val: number) => <Text strong>{val}</Text>,
    },
    {
      title: 'Đã đặt trước',
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      render: (val: number) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: 'Khả dụng',
      key: 'available',
      render: (_: unknown, record: Inventory) => {
        const available = Math.max(0, record.quantity - record.reservedQuantity);
        return <Text strong>{available}</Text>;
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: unknown, record: Inventory) => getStockTag(record),
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, record: Inventory) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEdit(record)}
            disabled={!!pendingActions[record.id]}
          >
            Sửa
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
            disabled={!!pendingActions[record.id]}
          >
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng bản ghi', value: totalInventories },
          { label: 'Hàng sắp hết', value: lowStockCount },
          { label: 'Tổng đặt trước', value: totalReserved },
          { label: 'Tổng khả dụng', value: totalAvailable },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          >
            <Card className="stat-card">
              <div className="space-y-2">
                <Text className="text-muted-foreground">{stat.label}</Text>
                <Title level={3} className="!mb-0 !text-foreground">
                  {stat.value}
                </Title>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card className="dashboard-section">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <Title level={4} className="!text-foreground !mb-0">
              Quản lý tồn kho
            </Title>
            <Space wrap>
              <Input
                placeholder="Tìm kiếm..."
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select
                style={{ width: 180 }}
                value={filterProductId ?? '__ALL__'}
                onChange={(v) => setFilterProductId(v === '__ALL__' ? undefined : v)}
              >
                <Option value="__ALL__">Tất cả sản phẩm</Option>
                {products.map((p) => (
                  <Option key={p.id} value={p.id}>
                    {p.name}
                  </Option>
                ))}
              </Select>
              <Select
                style={{ width: 180 }}
                value={filterStoreId ?? '__ALL__'}
                onChange={(v) => setFilterStoreId(v === '__ALL__' ? undefined : v)}
              >
                <Option value="__ALL__">Tất cả cửa hàng</Option>
                {stores.map((s) => (
                  <Option key={s.id} value={s.id}>
                    {s.name}
                  </Option>
                ))}
              </Select>
              <Select
                style={{ width: 150 }}
                value={filterLowStock}
                onChange={(v) => setFilterLowStock(v as any)}
              >
                <Option value="ALL">Tất cả</Option>
                <Option value="LOW">Còn ít</Option>
                <Option value="OK">Bình thường</Option>
              </Select>
              <Button icon={<FilterOutlined />}>Lọc</Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  createForm.resetFields();
                  setIsCreateOpen(true);
                }}
              >
                Thêm tồn kho
              </Button>
            </Space>
          </div>

          <Table
            dataSource={inventories}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} bản ghi`,
              onChange: (page, pageSize) =>
                setPagination((prev) => ({ ...prev, page, limit: pageSize })),
            }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </motion.div>

      {/* Create Modal */}
      <Modal
        title="Tạo tồn kho"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ quantity: 0, reservedQuantity: 0 }}
        >
          <Form.Item
            label="Sản phẩm"
            name="productId"
            rules={[{ required: true, message: 'Chưa chọn sản phẩm' }]}
          >
            <Select placeholder="Chọn sản phẩm">
              {products.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Cửa hàng"
            name="storeId"
            rules={[{ required: true, message: 'Chưa chọn cửa hàng' }]}
          >
            <Select placeholder="Chọn cửa hàng">
              {stores.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Số lượng"
            name="quantity"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng' },
              { type: 'number', min: 0, message: 'Số lượng phải >= 0' },
            ]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Số lượng đã đặt trước"
            name="reservedQuantity"
            rules={[
              { type: 'number', min: 0, message: 'Số lượng đã đặt trước phải >= 0' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value === undefined || value <= getFieldValue('quantity')) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Số lượng đặt trước không thể lớn hơn tổng số lượng')
                  );
                },
              }),
            ]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsCreateOpen(false)}>Huỷ</Button>
            <Button type="primary" htmlType="submit">
              Tạo
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Chỉnh sửa tồn kho"
        open={isEditOpen}
        onCancel={() => { setIsEditOpen(false); setEditing(null); }}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <Form.Item label="Sản phẩm">
            <Input value={editing ? getProductName(editing.productId) : ''} readOnly />
          </Form.Item>

          <Form.Item label="Cửa hàng">
            <Input value={editing ? getStoreName(editing.storeId) : ''} readOnly />
          </Form.Item>

          <Form.Item
            label="Số lượng"
            name="quantity"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng' },
              { type: 'number', min: 0, message: 'Số lượng phải >= 0' },
            ]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Số lượng đã đặt trước"
            name="reservedQuantity"
            rules={[
              { type: 'number', min: 0, message: 'Số lượng đã đặt trước phải >= 0' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value === undefined || value <= getFieldValue('quantity')) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Số lượng đặt trước không thể lớn hơn tổng số lượng')
                  );
                },
              }),
            ]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => { setIsEditOpen(false); setEditing(null); }}>Huỷ</Button>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default AdminInventoryManagement;