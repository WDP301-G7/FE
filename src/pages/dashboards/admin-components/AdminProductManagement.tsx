import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { productService, Product, CreateProductData, ProductImage } from '@/services/product.service';
import { inventoryService, Inventory } from '@/services/inventory.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Search, Package, Image, UploadCloud, Star } from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';

// Map product type to category ID from database
const TYPE_TO_CATEGORY_ID: Record<'FRAME' | 'LENS' | 'ACCESSORY', string> = {
  FRAME: '00000000-0000-0000-0000-000000000001',    // Gọng kính
  LENS: '00000000-0000-0000-0000-000000000002',     // Tròng kính
  ACCESSORY: '00000000-0000-0000-0000-000000000004' // Phụ kiện
};

// Helper function to construct full image URL
const getFullImageUrl = (url: string | undefined | null): string => {
  // Handle undefined or null URLs
  if (!url) {
    console.log('⚠️ getFullImageUrl: URL is null/undefined');
    return ''; // Return empty string for broken images
  }
  
  // If already absolute URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('✅ getFullImageUrl: Already absolute URL:', url);
    return url;
  }
  
  // Get base URL from environment or use default
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseUrl = apiUrl.replace('/api', ''); // Remove /api to get base URL
  
  // Ensure URL starts with /
  const path = url.startsWith('/') ? url : `/${url}`;
  
  const fullUrl = `${baseUrl}${path}`;
  console.log(`🔗 getFullImageUrl: "${url}" -> "${fullUrl}"`);
  return fullUrl;
};

export const AdminProductManagement: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Image management state
  const [imagesDialogOpen, setImagesDialogOpen] = useState(false);
  const [selectedProductImages, setSelectedProductImages] = useState<ProductImage[]>([]);
  const [selectedProductForImages, setSelectedProductForImages] = useState<Product | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  
  // Form image files (for create/edit dialog)
  const [formImageFiles, setFormImageFiles] = useState<File[]>([]);

  // Inventory/Stock state
  const [inventoryMap, setInventoryMap] = useState<Record<string, number>>({});
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Debug: Log when formImageFiles changes
  useEffect(() => {
    console.log('🖼️ formImageFiles changed:', formImageFiles.length, 'images');
    formImageFiles.forEach((file, idx) => {
      console.log(`  - Image ${idx + 1}: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    });
  }, [formImageFiles]);

  const [formData, setFormData] = useState<CreateProductData>({
    categoryId: TYPE_TO_CATEGORY_ID.FRAME,
    name: '',
    description: '',
    type: 'FRAME',
    price: 0,
    isPreorder: false,
    leadTimeDays: undefined,
    sku: '',
    brand: '',
  });

  useEffect(() => {
    loadProducts();
  }, [pagination.page, searchTerm]);

  // Load inventory data when products change
  useEffect(() => {
    if (products.length > 0) {
      loadInventoryData();
    }
  }, [products]);

  const loadInventoryData = async () => {
    setLoadingInventory(true);
    try {
      // Fetch inventory for all products
      const inventoryPromises = products.map(product => 
        inventoryService.getInventoryByProduct(product.id)
          .then(inventories => {
            // Calculate total quantity across all stores
            const totalQuantity = inventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
            return { productId: product.id, totalQuantity };
          })
          .catch(error => {
            console.warn(`Failed to load inventory for product ${product.id}:`, error);
            return { productId: product.id, totalQuantity: 0 };
          })
      );

      const inventoryResults = await Promise.all(inventoryPromises);
      
      // Create a map of productId -> total quantity
      const invMap: Record<string, number> = {};
      inventoryResults.forEach(result => {
        invMap[result.productId] = result.totalQuantity;
      });
      
      setInventoryMap(invMap);
    } catch (error) {
      console.error('Error loading inventory data:', error);
      toast({
        title: 'Cảnh Báo',
        description: 'Không thể tải dữ liệu tồn kho',
        variant: 'default',
      });
    } finally {
      setLoadingInventory(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data: any = await productService.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      });
      console.log('Products data received:', data);
      
      // API returns: { data: Product[], pagination: {...} }
      if (data && Array.isArray(data.data)) {
        console.log('📦 Number of products:', data.data.length);
        if (data.data.length > 0) {
          console.log('📦 First product:', data.data[0]);
          console.log('📦 First product images field:', data.data[0].images);
        }
        setProducts(data.data);
        setPagination(prev => ({ 
          ...prev, 
          total: data.pagination?.total || data.data.length 
        }));
      } else if (Array.isArray(data)) {
        setProducts(data);
        setPagination(prev => ({ ...prev, total: data.length }));
      } else {
        console.warn('Unexpected data structure:', data);
        setProducts([]);
      }
    } catch (error: any) {
      console.error('Load products error:', error);
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải danh sách sản phẩm',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('Form data being sent:', formData);
    console.log('Form image files:', formImageFiles);
    console.log('Number of images:', formImageFiles.length);
    console.log('Is editing?', !!editingProduct);

    // Validate images for new products
    if (!editingProduct && formImageFiles.length === 0) {
      toast({
        title: 'Lỗi Xác Thực',
        description: 'Vui lòng tải ít nhất 1 hình ảnh sản phẩm (tối đa 5)',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      let productId: string;
      
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, formData);
        productId = editingProduct.id;
        
        // Upload images if any for update
        if (formImageFiles.length > 0) {
          try {
            await productService.uploadProductImages(productId, formImageFiles);
            toast({ title: 'Thành Công', description: `Sản phẩm đã cập nhật với ${formImageFiles.length} hình ảnh mới` });
          } catch (imgError: any) {
            console.error('Image upload error:', imgError);
            toast({ 
              title: 'Cảnh Báo', 
              description: 'Sản phẩm đã cập nhật nhưng tải hình ảnh thất bại: ' + (imgError.response?.data?.message || imgError.message),
              variant: 'destructive'
            });
          }
        } else {
          toast({ title: 'Thành Công', description: 'Cập nhật sản phẩm thành công' });
        }
      } else {
        // Create product with images in the same request
        const newProduct = await productService.createProduct(formData, formImageFiles);
        productId = newProduct.id;
        toast({ title: 'Thành Công', description: `Tạo sản phẩm thành công với ${formImageFiles.length} hình ảnh` });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error: any) {
      console.error('❌ Error creating/updating product:');
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.response?.data?.message);
      console.error('Validation details:', error.response?.data?.error?.details);
      
      const details = error.response?.data?.error?.details;
      let errorMsg = error.response?.data?.message || 'Thao tác thất bại';
      
      if (details && Array.isArray(details)) {
        errorMsg += '\n' + details.map((d: any) => `- ${d.field}: ${d.message}`).join('\n');
      }
      
      toast({ 
        title: 'Lỗi', 
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    console.log('Editing product:', product);
    const productType: 'FRAME' | 'LENS' | 'ACCESSORY' = product.type || 'FRAME';
    setFormData({
      categoryId: product.category && typeof product.category === 'object' 
        ? product.category.id 
        : TYPE_TO_CATEGORY_ID[productType],
      name: product.name,
      description: product.description || '',
      type: productType,
      price: product.price,
      isPreorder: product.isPreorder || false,
      leadTimeDays: product.leadTimeDays,
      sku: product.sku || '',
      brand: product.brand || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    try {
      await productService.deleteProduct(id);
      toast({ title: 'Thành Công', description: 'Đã xóa sản phẩm thành công' });
      loadProducts();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xóa sản phẩm',
        variant: 'destructive',
      });
    }
  };

  // Image management helpers
  const loadImages = async (productId: string) => {
    setImagesLoading(true);
    try {
      const imgs = await productService.getProductImages(productId);
      console.log('📸 Loaded images for product:', imgs);
      console.log('📸 Number of images:', imgs.length);
      if (imgs.length > 0) {
        console.log('📸 First image structure:', imgs[0]);
        console.log('📸 First image keys:', Object.keys(imgs[0]));
      }
      setSelectedProductImages(imgs);
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.response?.data?.message || 'Không thể tải hình ảnh', variant: 'destructive' });
    } finally {
      setImagesLoading(false);
    }
  };

  const openImagesDialog = async (product: Product) => {
    setSelectedProductForImages(product);
    setImagesDialogOpen(true);
    await loadImages(product.id);
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setImageFiles(files);
  };

  const handleUploadImages = async () => {
    if (!selectedProductForImages || imageFiles.length === 0) return;
    setImagesLoading(true);
    try {
      await productService.uploadProductImages(selectedProductForImages.id, imageFiles);
      toast({ title: 'Thành Công', description: 'Đã tải lên hình ảnh thành công' });
      setImageFiles([]);
      await loadImages(selectedProductForImages.id);

      // Fetch updated product and update products list so thumbnail updates immediately
      try {
        const updatedProduct = await productService.getProduct(selectedProductForImages.id);
        setSelectedProductForImages(updatedProduct);
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      } catch (err) {
        console.warn('Failed to refresh product after upload', err);
      }
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.response?.data?.message || 'Tải lên thất bại', variant: 'destructive' });
    } finally {
      setImagesLoading(false);
    }
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    if (!selectedProductForImages) return;
    try {
      await productService.setPrimaryImage(selectedProductForImages.id, imageId);
      toast({ title: 'Thành Công', description: 'Đã đặt hình ảnh chính' });
      await loadImages(selectedProductForImages.id);

      // Refresh product to update thumbnail
      try {
        const updatedProduct = await productService.getProduct(selectedProductForImages.id);
        setSelectedProductForImages(updatedProduct);
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      } catch (err) {
        console.warn('Failed to refresh product after setting primary', err);
      }
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.response?.data?.message || 'Thao tác thất bại', variant: 'destructive' });
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!selectedProductForImages) return;
    if (!confirm('Xóa hình ảnh này?')) return;
    try {
      await productService.deleteProductImage(selectedProductForImages.id, imageId);
      toast({ title: 'Thành Công', description: 'Đã xóa hình ảnh' });
      await loadImages(selectedProductForImages.id);

      // Refresh product to update thumbnail
      try {
        const updatedProduct = await productService.getProduct(selectedProductForImages.id);
        setSelectedProductForImages(updatedProduct);
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      } catch (err) {
        console.warn('Failed to refresh product after delete image', err);
      }
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.response?.data?.message || 'Thao tác thất bại', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormImageFiles([]);
    setFormData({
      categoryId: TYPE_TO_CATEGORY_ID.FRAME,
      name: '',
      description: '',
      type: 'FRAME',
      price: 0,
      isPreorder: false,
      leadTimeDays: undefined,
      sku: '',
      brand: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      ACTIVE: 'default',
      INACTIVE: 'secondary',
      OUT_OF_STOCK: 'destructive',
    };
    const labels: Record<string, string> = {
      ACTIVE: 'Đang bán',
      INACTIVE: 'Ngừng bán',
      OUT_OF_STOCK: 'Hết hàng',
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Quản Lý Sản Phẩm
        </CardTitle>
        <CardDescription>Quản lý danh mục sản phẩm của cửa hàng</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm Sản Phẩm
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên Sản Phẩm</TableHead>
                <TableHead>Danh Mục</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Tồn Kho</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead className="text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Đang tải...</TableCell>
                </TableRow>
              ) : !products || products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Không tìm thấy sản phẩm</TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium flex items-center gap-3">
                      <div className="h-10 w-10 rounded overflow-hidden bg-muted-foreground/5 flex items-center justify-center">
                        {product.primaryImage ? (
                          <img src={product.primaryImage} alt={product.name} className="h-full w-full object-cover" />
                        ) : (product.images && product.images.length > 0 ? (
                          <img src={product.images.find(i => i.isPrimary)?.imageUrl || product.images[0]?.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <Image className="h-5 w-5 text-muted-foreground" />
                        ))}
                      </div>
                      <div>{product.name}</div>
                    </TableCell>
                    <TableCell>{typeof product.category === 'object' ? product.category?.name : product.category || '-'}</TableCell>
                    <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                    <TableCell>
                      {loadingInventory ? (
                        <span className="text-muted-foreground text-sm">Đang tải...</span>
                      ) : (
                        <Badge variant={
                          inventoryMap[product.id] === undefined ? 'secondary' :
                          inventoryMap[product.id] === 0 ? 'destructive' :
                          inventoryMap[product.id] < 10 ? 'outline' : 'default'
                        }>
                          {inventoryMap[product.id] !== undefined ? inventoryMap[product.id] : product.stockQuantity || 0}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openImagesDialog(product)}
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            Hiển thị {products?.length || 0} / {pagination.total} sản phẩm
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Sau
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">       <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update the product information below.' : 'Fill in the details to create a new product.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên Sản Phẩm *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="sku">Mã SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Mã sản phẩm"
                  required
                  disabled={!!editingProduct}
                />
              </div>

              <div>
                <Label htmlFor="brand">Thương Hiệu</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Thương hiệu sản phẩm"
                  disabled={!!editingProduct}
                />
              </div>

              <div>
                <Label htmlFor="description">Mô Tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="type">Loại Sản Phẩm *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'FRAME' | 'LENS' | 'ACCESSORY') => {
                    setFormData({ 
                      ...formData, 
                      type: value,
                      categoryId: TYPE_TO_CATEGORY_ID[value]
                    });
                  }}
                  disabled={!!editingProduct}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FRAME">Gọng Kính</SelectItem>
                    <SelectItem value="LENS">Tròng Kính</SelectItem>
                    <SelectItem value="ACCESSORY">Phụ Kiện</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Danh mục sẽ được gán tự động: {formData.categoryId}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Giá *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="leadTimeDays">Thời Gian Chờ (Ngày) {formData.isPreorder && '*'}</Label>
                  <Input
                    id="leadTimeDays"
                    type="number"
                    min="1"
                    value={formData.leadTimeDays || ''}
                    onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || undefined })}
                    disabled={!formData.isPreorder}
                    required={formData.isPreorder}
                    placeholder={formData.isPreorder ? "Ngày" : "Không áp dụng"}
                  />
                  {formData.isPreorder && (
                    <p className="text-xs text-muted-foreground mt-1">Ít nhất 1 ngày</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPreorder"
                  checked={formData.isPreorder}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setFormData({ 
                      ...formData, 
                      isPreorder: isChecked,
                      leadTimeDays: isChecked ? 1 : undefined
                    });
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor="isPreorder" className="cursor-pointer">
                  Đây là sản phẩm đặt trước
                </Label>
              </div>

              {/* Product Images */}
              <div className={!editingProduct ? 'p-3 border-2 border-dashed rounded-lg border-orange-200 bg-orange-50/30' : ''}>
                <div className="flex items-center justify-between mb-2">
                  <Label>Hình Ảnh Sản Phẩm (1-5 ảnh) {!editingProduct && <span className="text-red-500">*</span>}</Label>
                  {formImageFiles.length > 0 && (
                    <Badge variant="default" className="bg-green-500">
                      {formImageFiles.length} ảnh đã chọn
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {!editingProduct 
                    ? 'Bắt buộc: Tải lên 1-5 ảnh cho sản phẩm mới. Tối đa 5MB mỗi ảnh.' 
                    : 'Tùy chọn: Tải thêm ảnh. Tối đa 5 ảnh, 5MB mỗi ảnh.'}
                </p>
                <ImageUploader
                  images={formImageFiles}
                  onChange={(files) => {
                    console.log('📸 ImageUploader onChange called with', files.length, 'files');
                    setFormImageFiles(files);
                  }}
                  maxImages={5}
                  maxSizeMB={5}
                  disabled={loading}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Đang lưu...' : editingProduct ? 'Cập Nhật' : 'Tạo Mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Images Dialog */}
      <Dialog open={imagesDialogOpen} onOpenChange={(open) => {
        setImagesDialogOpen(open);
        if (!open) {
          setSelectedProductForImages(null);
          setSelectedProductImages([]);
          setImageFiles([]);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Hình ảnh - {selectedProductForImages?.name}</DialogTitle>
            <DialogDescription>Tải lên và quản lý hình ảnh cho sản phẩm này.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <input type="file" multiple accept="image/*" onChange={handleFilesChange} />
              <Button onClick={handleUploadImages} disabled={imageFiles.length === 0 || imagesLoading}>
                <UploadCloud className="h-4 w-4 mr-2" /> Tải Lên
              </Button>
              {imageFiles.length > 0 && <span className="text-sm text-muted-foreground">{imageFiles.length} tệp đã chọn</span>}
            </div>

            {imagesLoading ? (
              <div>Đang tải hình ảnh...</div>
            ) : selectedProductImages.length === 0 ? (
              <div className="text-sm text-muted-foreground">Chưa có hình ảnh nào được tải lên.</div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {selectedProductImages.map(img => (
                  <div key={img.id} className="border p-2 rounded flex flex-col items-center">
                    <img 
                      src={img.imageUrl} 
                      className="h-28 w-28 object-cover rounded" 
                      alt="product"
                      onError={(e) => {
                        console.error('❌ Image failed to load:', img.imageUrl);
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EKhông có ảnh%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className="flex items-center gap-2 mt-2">
                      {img.isPrimary && <Badge>Ảnh Chính</Badge>}
                      {!img.isPrimary && <Button size="sm" onClick={() => handleSetPrimaryImage(img.id)}><Star className="h-4 w-4" /></Button>}
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteImage(img.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImagesDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};