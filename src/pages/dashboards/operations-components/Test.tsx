import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  operationsService,
  PrescriptionRequestSummary,
  PrescriptionRequestDetails,
  GetPrescriptionRequestsParams,
} from '@/services/operations.service';
import { productService, Product } from '@/services/product.service';
import { Eye, Phone, FilePlus, XCircle } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const PrescriptionRequestsPage: React.FC = () => {
  const { hasRole } = useAuth();
  if (!hasRole(['operations'])) {
    return <Navigate to="/dashboard" replace />;
  }

  const { toast } = useToast();

  const [requests, setRequests] = useState<PrescriptionRequestSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const totalPages = Math.ceil(totalItems / pageSize);

  // selected request for modals
  const [selected, setSelected] = useState<PrescriptionRequestDetails | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  // contact form
  const [contactStatus, setContactStatus] = useState<string>('');
  const [contactNotes, setContactNotes] = useState<string>('');

  // order form state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  // when the user picks a product, preload some fields
  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      // default to one item, price from product data
      setQuantity(1);
      setUnitPrice(parseFloat(prod.price as any) || 0);
    }
  };

  // prescription data
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

  // close form
  const [closeStatus, setCloseStatus] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');

  useEffect(() => {
    loadRequests();
  }, [statusFilter, currentPage, pageSize]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params: GetPrescriptionRequestsParams = {
        page: currentPage,
        limit: pageSize,
      };
      if (statusFilter && statusFilter !== '__all') params.status = statusFilter;
      const resp = await operationsService.getPrescriptionRequests(params);
      setRequests(resp.requests || []);
      const total = resp.pageInfo?.totalElements || resp.requests.length;
      setTotalItems(total);
    } catch (err: any) {
      console.error('Failed to load prescription requests', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Unable to load requests',
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
        title: 'Error',
        description: err.response?.data?.message || 'Could not fetch details',
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
      toast({ title: 'Error', description: 'Status required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await operationsService.updatePrescriptionContact(selected.id, {
        status: contactStatus,
        contactNotes,
      });
      toast({ title: 'Success', description: 'Contact status updated' });
      setContactOpen(false);
      loadRequests();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update contact',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openOrder = (req: PrescriptionRequestSummary) => {
    setSelected(req as any);
    // Reset form fields
    setSelectedProductId('');
    setQuantity(1);
    setUnitPrice(0);
    setRightSphere(0);
    setRightCylinder(0);
    setRightAxis(0);
    setLeftSphere(0);
    setLeftCylinder(0);
    setLeftAxis(0);
    setPupillaryDistance(62);
    setPrescriptionNotes('');
    setExpiryDays(3);
    setExpectedReadyDate('');
    // Load products
    loadProducts();
    setOrderOpen(true);
  };

  const loadProducts = async () => {
    try {
      const data = await productService.getProducts({ limit: 100 });
      console.log('Raw products response:', data);
      // support various response shapes
      // The API may return several shapes. support:
      // 1. { items: [...] }
      // 2. { data: { items: [...] } }
      // 3. { data: [...] }       <-- our mock response uses this shape
      // 4. { products: [...] }
      // 5. raw array
      let productList: any[] = [];
      if (Array.isArray(data)) {
        productList = data;
      } else if (Array.isArray(data.data)) {
        productList = data.data;
      } else if (data.items) {
        productList = data.items;
      } else if (data.data?.items) {
        productList = data.data.items;
      } else if (data.products) {
        productList = data.products;
      }
      // sort alphabetically by name for a nicer dropdown
      productList = productList.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setProducts(productList);
      console.log('Loaded products for order creation:', productList);
    } catch (err: any) {
      console.error('Failed to load products', err);
      toast({
        title: 'Error',
        description: 'Could not load products',
        variant: 'destructive',
      });
    }
  };

  const submitOrder = async () => {
    if (!selected || !selectedProductId) {
      toast({
        title: 'Error',
        description: 'Vui lòng chọn sản phẩm',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const body = {
        orderItems: [
          {
            productId: selectedProductId,
            quantity,
            unitPrice,
          },
        ],
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
      };
        console.log('Creating order with body:', body);
      await operationsService.createOrderFromPrescription(selected.id, body);
      toast({ title: 'Success', description: 'Order created' });
      setOrderOpen(false);
      loadRequests();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to create order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openClose = (req: PrescriptionRequestSummary) => {
    setSelected(req as any);
    setCloseStatus('');
    setCloseNotes('');
    setCloseOpen(true);
  };

  const submitClose = async () => {
    if (!selected || !closeStatus) {
      toast({ title: 'Error', description: 'Status required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await operationsService.closePrescriptionRequest(selected.id, {
        status: closeStatus,
        contactNotes: closeNotes,
      });
      toast({ title: 'Success', description: 'Request closed' });
      setCloseOpen(false);
      loadRequests();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to close request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yêu cầu đơn thuốc</CardTitle>
        <CardDescription>Quản lý đơn khách gửi lên</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Select
            value={statusFilter || '__all'}
            onValueChange={(v) => setStatusFilter(v === '__all' ? '' : v)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue>Select status</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="verified">Đã xác minh</SelectItem>
              <SelectItem value="processing">Đang xử lý</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="update-required">Cần cập nhật</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{new Date(r.createdDate).toLocaleString()}</TableCell>
                <TableCell><Badge>{r.status}</Badge></TableCell>
                <TableCell className="space-x-1">
                  <Button size="sm" variant="outline" onClick={() => openDetail(r.id)}>
                    <Eye size={16} />
                  </Button>
                      <Button size="sm" variant="outline" onClick={() => openContact(r)}>
                    <Phone size={16} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openOrder(r)}>
                    <FilePlus size={16} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openClose(r)}>
                    <XCircle size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination className="mt-4">
          <PaginationPrevious
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          />
          <PaginationContent>
            {Array.from({ length: totalPages }, (_, i) => (
              <PaginationItem key={i} active={i + 1 === currentPage}>
                <PaginationLink onClick={() => setCurrentPage(i + 1)}>{i + 1}</PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
          <PaginationNext
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          />
        </Pagination>
      </CardContent>

      {/* detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-2">
              <div>ID: {selected.id}</div>
              <div>Status: {selected.status}</div>
              <div>Customer: {selected.customerId}</div>
              <div>Store: {selected.storeId}</div>
              <div>Handled by: {selected.handledBy}</div>
              <div>Contact notes: {selected.contactNotes}</div>
              {selected.images && selected.images.length > 0 && (
                <div>
                  <Label>Ảnh đơn thuốc</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {selected.images.map((img) => (
                      <img
                        key={img.id}
                        src={img.imageUrl}
                        alt="Đơn thuốc"
                        className="w-full h-auto rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* contact dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái liên hệ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Trạng thái</Label>
            <Select value={contactStatus} onValueChange={setContactStatus}>
              <SelectTrigger>
                <SelectValue>Select</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONTACTING">CONTACTING</SelectItem>
                <SelectItem value="CONTACTED">CONTACTED</SelectItem>
                <SelectItem value="FAILED">FAILED</SelectItem>
              </SelectContent>
            </Select>
            <Label>Notes</Label>
            <Textarea
              value={contactNotes}
              onChange={(e) => setContactNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactOpen(false)}>
              Hủy
            </Button>
            <Button onClick={submitContact}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* create order dialog */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo đơn kính từ đơn thuốc</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Chọn sản phẩm */}
            <div>
              <Label>Sản phẩm *</Label>
              <Select value={selectedProductId} onValueChange={handleProductChange}>
                <SelectTrigger>
                  <SelectValue>Chọn sản phẩm</SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.type}) - {p.price?.toLocaleString()}₫
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity and Unit Price */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label>Unit Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Right Eye */}
            <div className="border-t pt-3">
              <Label className="font-semibold">Right Eye</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Label className="text-xs">Sphere</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={rightSphere}
                    onChange={(e) => setRightSphere(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Cylinder</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={rightCylinder}
                    onChange={(e) => setRightCylinder(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Axis</Label>
                  <Input
                    type="number"
                    min="0"
                    max="180"
                    value={rightAxis}
                    onChange={(e) => setRightAxis(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Left Eye */}
            <div className="border-t pt-3">
              <Label className="font-semibold">Left Eye</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Label className="text-xs">Sphere</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={leftSphere}
                    onChange={(e) => setLeftSphere(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Cylinder</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={leftCylinder}
                    onChange={(e) => setLeftCylinder(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Axis</Label>
                  <Input
                    type="number"
                    min="0"
                    max="180"
                    value={leftAxis}
                    onChange={(e) => setLeftAxis(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Other Prescription Data */}
            <div className="border-t pt-3">
              <div>
                <Label>Pupillary Distance (mm)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={pupillaryDistance}
                  onChange={(e) => setPupillaryDistance(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="mt-2">
                <Label>Notes</Label>
                <Textarea
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            {/* Ngày sẵn sàng dự kiến */}
            <div className="border-t pt-3">
              <div>
                <Label>Ngày sẵn sàng dự kiến</Label>
                <Input
                  type="datetime-local"
                  value={expectedReadyDate}
                  onChange={(e) => setExpectedReadyDate(e.target.value)}
                />
              </div>
            </div>

            {/* Số ngày hiệu lực */}
            <div className="border-t pt-3">
              <div>
                <Label>Số ngày hiệu lực</Label>
                <Input
                  type="number"
                  min="0"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value) || 3)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderOpen(false)}>
              Hủy
            </Button>
            <Button onClick={submitOrder}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* close dialog */}
      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Status</Label>
            <Select value={closeStatus} onValueChange={setCloseStatus}>
              <SelectTrigger>
                <SelectValue>Select</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOST">LOST</SelectItem>
                <SelectItem value="REJECTED">REJECTED</SelectItem>
              </SelectContent>
            </Select>
            <Label>Notes</Label>
            <Textarea
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>
              Hủy
            </Button>
            <Button onClick={submitClose}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Card>
  );
};

export default PrescriptionRequestsPage;
