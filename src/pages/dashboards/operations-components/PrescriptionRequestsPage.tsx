import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  operationsService,
  PrescriptionRequestSummary,
  PrescriptionRequestDetails,
  GetPrescriptionRequestsParams,
} from '@/services/operations.service';
import { productService, Product } from '@/services/product.service';
import StatusBadge from '@/components/StatusBadge';
import {
  Card,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Select,
  Modal,
  Form,
  Input,
  InputNumber,
  Divider,
} from 'antd';
import { motion } from 'framer-motion';
import {
  EyeOutlined,
  PhoneOutlined,
  FileAddOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PrescriptionRequestsPage: React.FC = () => {
  const { hasRole } = useAuth();
  if (!hasRole(['operations'])) {
    return <Navigate to="/dashboard" replace />;
  }

  const { toast } = useToast();

  const [requests, setRequests] = useState<PrescriptionRequestSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  const [selected, setSelected] = useState<PrescriptionRequestDetails | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const [contactStatus, setContactStatus] = useState<string>('');
  const [contactNotes, setContactNotes] = useState<string>('');

  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<
    { productId: string; name: string; quantity: number; unitPrice: number }[]
  >([]);

  const [rightSphere, setRightSphere] = useState<number>(0);
  const [rightCylinder, setRightCylinder] = useState<number>(0);
  const [rightAxis, setRightAxis] = useState<number>(0);
  const [leftSphere, setLeftSphere] = useState<number>(0);
  const [leftCylinder, setLeftCylinder] = useState<number>(0);
  const [leftAxis, setLeftAxis] = useState<number>(0);
  const [pupillaryDistance, setPupillaryDistance] = useState<number>(62);
  const [prescriptionNotes, setPrescriptionNotes] = useState<string>('');
  const [expiryDays, setExpiryDays] = useState<number>(3);
  const [expectedReadyDate, setExpectedReadyDate] = useState<string>('');

  const [closeStatus, setCloseStatus] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');

  useEffect(() => {
    loadRequests();
  }, [statusFilter, currentPage, pageSize]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params: GetPrescriptionRequestsParams = { page: currentPage, limit: pageSize };
      if (statusFilter && statusFilter !== '__all') params.status = statusFilter;
      const resp = await operationsService.getPrescriptionRequests(params);
      setRequests(resp.requests || []);
      setTotalItems(resp.pageInfo?.totalElements || resp.requests.length);
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Tải dữ liệu thất bại',
        variant: 'destructive',
      });
      setRequests([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const data = await operationsService.getPrescriptionRequestById(id);
      setSelected(data);
      setDetailOpen(true);
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Không thể tải chi tiết',
        variant: 'destructive',
      });
    }
  };

  const openContact = (req: PrescriptionRequestSummary) => {
    setSelected(req as any);
    setContactStatus('');
    setContactNotes('');
    setContactOpen(true);
  };

  const submitContact = async () => {
    if (!selected || !contactStatus) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn trạng thái', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await operationsService.updatePrescriptionContact(selected.id, { status: contactStatus, contactNotes });
      toast({ title: 'Thành công', description: 'Cập nhật trạng thái liên hệ thành công' });
      setContactOpen(false);
      loadRequests();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || 'Cập nhật thất bại', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openOrder = async (req: PrescriptionRequestSummary) => {
    setLoading(true);
    try {
      const data = await operationsService.getPrescriptionRequestById(req.id);
      setSelected(data);
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err.response?.data?.message || 'Không thể tải chi tiết đơn thuốc',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    setOrderItems([]);
    setRightSphere(0); setRightCylinder(0); setRightAxis(0);
    setLeftSphere(0); setLeftCylinder(0); setLeftAxis(0);
    setPupillaryDistance(62); setPrescriptionNotes('');
    setExpiryDays(3); setExpectedReadyDate('');
    await loadProducts();
    setOrderOpen(true);
    setLoading(false);
  };

  const loadProducts = async () => {
    try {
      const data = await productService.getProducts({ limit: 100 });
      let list: any[] = Array.isArray(data)
        ? data
        : data.data
        ? Array.isArray(data.data) ? data.data : data.data.items || []
        : data.items || data.products || [];
      list = list.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setProducts(list);
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải sản phẩm', variant: 'destructive' });
    }
  };

  const handleAddProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    if (orderItems.find((i) => i.productId === id)) {
      toast({ title: 'Sản phẩm đã tồn tại', description: 'Bạn có thể chỉnh sửa số lượng bên dưới' });
      return;
    }
    setOrderItems((prev) => [
      ...prev,
      { productId: id, name: prod.name, quantity: 1, unitPrice: parseFloat(prod.price as any) || 0 },
    ]);
  };

  const submitOrder = async () => {
    if (!selected || orderItems.length === 0) {
      toast({ title: 'Lỗi', description: 'Vui lòng thêm ít nhất 1 sản phẩm', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await operationsService.createOrderFromPrescription(selected.id, {
        orderItems: orderItems.map(({ productId, quantity, unitPrice }) => ({ productId, quantity, unitPrice })),
        prescriptionData: {
          rightEyeSphere: rightSphere || undefined,
          rightEyeCylinder: rightCylinder || undefined,
          rightEyeAxis: rightAxis || undefined,
          leftEyeSphere: leftSphere || undefined,
          leftEyeCylinder: leftCylinder || undefined,
          leftEyeAxis: leftAxis || undefined,
          pupillaryDistance: pupillaryDistance || undefined,
          notes: prescriptionNotes || undefined,
        },
        expectedReadyDate: expectedReadyDate ? new Date(expectedReadyDate).toISOString() : undefined,
        expiryDays: expiryDays || undefined,
      });
      toast({ title: 'Thành công', description: 'Tạo đơn kính thành công' });
      setOrderOpen(false);
      loadRequests();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || 'Tạo đơn thất bại', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openClose = (req: PrescriptionRequestSummary) => {
    setSelected(req as any);
    setCloseStatus(''); setCloseNotes('');
    setCloseOpen(true);
  };

  const submitClose = async () => {
    if (!selected || !closeStatus) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn trạng thái', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await operationsService.closePrescriptionRequest(selected.id, { status: closeStatus, contactNotes: closeNotes });
      toast({ title: 'Thành công', description: 'Đóng yêu cầu thành công' });
      setCloseOpen(false);
      loadRequests();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || 'Đóng yêu cầu thất bại', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Derived stats
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const verifiedCount = requests.filter((r) => r.status === 'verified').length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      render: (val: string) => <Text strong style={{ fontSize: 12 }}>{val}</Text>,
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_: unknown, record: PrescriptionRequestSummary) => (
        <Text>{record.customer?.fullName || 'N/A'}</Text>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => <Text>{new Date(val).toLocaleString('vi-VN')}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <StatusBadge status={val} />,
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, record: PrescriptionRequestSummary) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => openDetail(record.id)}>
            Xem
          </Button>
          <Button icon={<PhoneOutlined />} size="small" onClick={() => openContact(record)}>
            Liên hệ
          </Button>
          <Button icon={<FileAddOutlined />} size="small" type="primary" onClick={() => openOrder(record)}>
            Tạo đơn
          </Button>
          <Button icon={<CloseCircleOutlined />} size="small" danger onClick={() => openClose(record)}>
            Đóng
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
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng yêu cầu', value: totalItems },
          { label: 'Chờ duyệt', value: pendingCount },
          { label: 'Đã xác minh', value: verifiedCount },
          { label: 'Hoàn thành', value: completedCount },
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
                <Title level={3} className="!mb-0 !text-foreground">{stat.value}</Title>
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
            <Title level={4} className="!text-foreground !mb-0">Yêu cầu đơn thuốc</Title>
            <Space wrap>
              <Select
                style={{ width: 180 }}
                value={statusFilter || '__all'}
                onChange={(v) => { setStatusFilter(v === '__all' ? '' : v); setCurrentPage(1); }}
              >
                <Option value="__all">Tất cả trạng thái</Option>
                <Option value="pending">Chờ duyệt</Option>
                <Option value="verified">Đã xác minh</Option>
                <Option value="processing">Đang xử lý</Option>
                <Option value="completed">Hoàn thành</Option>
                <Option value="update-required">Cần cập nhật</Option>
              </Select>
              <Button icon={<ReloadOutlined />} onClick={() => { setCurrentPage(1); loadRequests(); }} loading={loading}>
                Làm mới
              </Button>
            </Space>
          </div>

          <Table
            dataSource={requests}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalItems,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} yêu cầu`,
              onChange: (page, size) => { setCurrentPage(page); setPageSize(size); },
            }}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      </motion.div>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết đơn thuốc"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>Đóng</Button>}
        destroyOnClose
      >
        {selected && (
          <div className="space-y-3 py-2">
            {[
              { label: 'Mã đơn', value: selected.id },
              { label: 'Khách hàng', value: selected.customer?.fullName || 'N/A' },
              { label: 'Ghi chú', value: selected.contactNotes || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                <div><Text strong>{value}</Text></div>
              </div>
            ))}
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Trạng thái</Text>
              <div><StatusBadge status={selected.status} /></div>
            </div>
            {selected.images && selected.images.length > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Ảnh đơn thuốc</Text>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {selected.images.map((img) => (
                    <img key={img.id} src={img.imageUrl} alt="Đơn thuốc" className="w-full h-auto rounded border" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Contact Modal */}
      <Modal
        title="Cập nhật trạng thái liên hệ"
        open={contactOpen}
        onCancel={() => setContactOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" className="pt-2">
          <Form.Item label="Trạng thái" required>
            <Select
              placeholder="Chọn trạng thái"
              value={contactStatus || undefined}
              onChange={setContactStatus}
              style={{ width: '100%' }}
            >
              <Option value="CONTACTING">Đang liên hệ</Option>
              <Option value="CONTACTED">Đã liên hệ</Option>
              <Option value="FAILED">Liên hệ thất bại</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Ghi chú">
            <TextArea
              placeholder="Nhập ghi chú liên hệ..."
              value={contactNotes}
              onChange={(e) => setContactNotes(e.target.value)}
              rows={3}
            />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setContactOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={submitContact} loading={loading}>Lưu</Button>
          </div>
        </Form>
      </Modal>

      {/* Create Order Modal */}
      <Modal
        title="Tạo đơn kính từ đơn thuốc"
        open={orderOpen}
        onCancel={() => setOrderOpen(false)}
        footer={null}
        destroyOnClose
        width={900}
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto' } }}
      >
        <Form layout="vertical" className="py-2" style={{ rowGap: 16 }}>
          <div>
            <Text strong>Ghi chú sau liên hệ khách hàng</Text>
            <div className="mt-1 p-3 rounded border bg-gray-50">
              <Text>{selected?.contactNotes?.trim() || 'Chưa có ghi chú liên hệ'}</Text>
            </div>
          </div>

          {/* Prescription images */}
          {selected?.images && selected.images.length > 0 && (
            <div>
              <Text strong>Ảnh đơn thuốc</Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {selected.images.map((img) => (
                  <img key={img.id} src={img.imageUrl} alt="Đơn thuốc" className="w-full h-auto rounded border object-cover" />
                ))}
              </div>
            </div>
          )}

          {/* Product selector */}
          <div>
            <Text strong>Thêm sản phẩm <span style={{ color: 'red' }}>*</span></Text>
            <Select
              placeholder="Chọn sản phẩm để thêm"
              style={{ width: '100%', marginTop: 6 }}
              onChange={handleAddProduct}
              showSearch
              optionFilterProp="children"
            >
              {products.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name} ({p.type}) — {Number(p.price).toLocaleString('vi-VN')}₫
                </Option>
              ))}
            </Select>
          </div>

          {/* Selected products */}
          {orderItems.length > 0 && (
            <Card size="small" title="Sản phẩm đã chọn">
              {orderItems.map((item, index) => (
                <div key={item.productId} className="grid grid-cols-1 md:grid-cols-[2fr_88px_132px_36px] gap-2 items-center mb-2">
                  <Text style={{ fontSize: 13 }}>{item.name}</Text>
                  <InputNumber
                    min={1}
                    value={item.quantity}
                    style={{ width: '100%' }}
                    onChange={(val) =>
                      setOrderItems((prev) =>
                        prev.map((i, idx) => (idx === index ? { ...i, quantity: val as number } : i))
                      )
                    }
                  />
                  <InputNumber
                    min={0}
                    value={item.unitPrice}
                    style={{ width: '100%' }}
                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    onChange={(val) =>
                      setOrderItems((prev) =>
                        prev.map((i, idx) => (idx === index ? { ...i, unitPrice: val as number } : i))
                      )
                    }
                  />
                  <Button
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                    onClick={() => setOrderItems((prev) => prev.filter((_, idx) => idx !== index))}
                  />
                </div>
              ))}
            </Card>
          )}

          <Divider orientation="left" orientationMargin={0}><Text strong>Mắt phải (Right Eye)</Text></Divider>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Độ cầu (SPH)', val: rightSphere, set: setRightSphere, step: 0.25 },
              { label: 'Độ loạn (CYL)', val: rightCylinder, set: setRightCylinder, step: 0.25 },
              { label: 'Trục (Axis)', val: rightAxis, set: setRightAxis, step: 1 },
            ].map(({ label, val, set, step }) => (
              <Form.Item key={label} label={<Text style={{ fontSize: 12 }}>{label}</Text>} style={{ marginBottom: 0 }}>
                <InputNumber step={step} value={val} onChange={(v) => set(v as number)} style={{ width: '100%' }} />
              </Form.Item>
            ))}
          </div>

          <Divider orientation="left" orientationMargin={0}><Text strong>Mắt trái (Left Eye)</Text></Divider>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Độ cầu (SPH)', val: leftSphere, set: setLeftSphere, step: 0.25 },
              { label: 'Độ loạn (CYL)', val: leftCylinder, set: setLeftCylinder, step: 0.25 },
              { label: 'Trục (Axis)', val: leftAxis, set: setLeftAxis, step: 1 },
            ].map(({ label, val, set, step }) => (
              <Form.Item key={label} label={<Text style={{ fontSize: 12 }}>{label}</Text>} style={{ marginBottom: 0 }}>
                <InputNumber step={step} value={val} onChange={(v) => set(v as number)} style={{ width: '100%' }} />
              </Form.Item>
            ))}
          </div>

          <Divider />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Khoảng cách đồng tử (PD)" style={{ marginBottom: 0 }}>
              <InputNumber value={pupillaryDistance} onChange={(v) => setPupillaryDistance(v as number)} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Ngày hết hạn (ngày)" style={{ marginBottom: 0 }}>
              <InputNumber min={1} value={expiryDays} onChange={(v) => setExpiryDays(v as number)} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item label="Ghi chú đơn thuốc" style={{ marginBottom: 0 }}>
            <TextArea value={prescriptionNotes} onChange={(e) => setPrescriptionNotes(e.target.value)} rows={2} />
          </Form.Item>

          <Form.Item label="Ngày dự kiến hoàn thành" style={{ marginBottom: 0 }}>
            <Input type="datetime-local" value={expectedReadyDate} onChange={(e) => setExpectedReadyDate(e.target.value)} />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setOrderOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={submitOrder} loading={loading}>Tạo đơn</Button>
          </div>
        </Form>
      </Modal>

      {/* Close Request Modal */}
      <Modal
        title="Đóng yêu cầu"
        open={closeOpen}
        onCancel={() => setCloseOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" className="pt-2">
          <Form.Item label="Trạng thái" required>
            <Select
              placeholder="Chọn trạng thái"
              value={closeStatus || undefined}
              onChange={setCloseStatus}
              style={{ width: '100%' }}
            >
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
              <Option value="update-required">Cần cập nhật</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Ghi chú">
            <TextArea
              placeholder="Nhập ghi chú..."
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              rows={3}
            />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setCloseOpen(false)}>Hủy</Button>
            <Button danger onClick={submitClose} loading={loading}>Xác nhận đóng</Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default PrescriptionRequestsPage;