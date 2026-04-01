import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { productService, Product, CreateProductData } from '@/services/product.service';
import { motion } from 'framer-motion';
import {
  DashboardStatCard,
  EmptyState,
  QuickActionButton,
  StatusBadge,
  EnhancedTable,
  TableColumn,
  TableAction,
  ModernImageUpload,
  SkeletonTable,
} from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Package, Edit, Trash2, Eye, Image as ImageIcon, TrendingUp } from 'lucide-react';

// Map product type to category ID
const TYPE_TO_CATEGORY_ID: Record<'FRAME' | 'LENS' | 'ACCESSORY', string> = {
  FRAME: '00000000-0000-0000-0000-000000000001',
  LENS: '00000000-0000-0000-0000-000000000002',
  ACCESSORY: '00000000-0000-0000-0000-000000000004'
};

const getFullImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseUrl = apiUrl.replace('/api', '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${path}`;
};

export const AdminProductManagement: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formImageFiles, setFormImageFiles] = useState<File[]>([]);
  
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
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getProducts({
        page: 1,
        limit: 100,
        search: searchTerm,
      });
      
      if ('items' in data && Array.isArray(data.items)) {
        setProducts(data.items);
      } else if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate images for new products
    if (!editingProduct && formImageFiles.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please upload at least 1 product image (maximum 5)',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, formData);
        
        if (formImageFiles.length > 0) {
          await productService.uploadProductImages(editingProduct.id, formImageFiles);
          toast({ title: 'Success', description: `Product updated with ${formImageFiles.length} new image(s)` });
        } else {
          toast({ title: 'Success', description: 'Product updated successfully' });
        }
      } else {
        await productService.createProduct(formData, formImageFiles);
        toast({ title: 'Success', description: `Product created with ${formImageFiles.length} image(s)` });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Operation failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
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
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productService.deleteProduct(id);
      toast({ title: 'Success', description: 'Product deleted successfully' });
      loadProducts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete product',
        variant: 'destructive',
      });
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

  // Table configuration
  const columns: TableColumn<Product>[] = [
    {
      key: 'name',
      label: 'Product',
      sortable: true,
      render: (_, product) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted">
            {product.images && product.images.length > 0 ? (
              <img
                src={getFullImageUrl(
                  (product.images[0] as {url?: string; imageUrl?: string}).url || 
                  (product.images[0] as {url?: string; imageUrl?: string}).imageUrl || 
                  ''
                )}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.brand || 'No brand'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      render: (sku) => (
        <span className="text-sm text-muted-foreground">{sku || 'N/A'}</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (type) => <StatusBadge status={type} size="sm" />,
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (price) => (
        <span className="font-semibold text-foreground">
          ₫{Number(price).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'isPreorder',
      label: 'Preorder',
      render: (isPreorder) => (
        <StatusBadge status={isPreorder ? 'active' : 'inactive'} size="sm" />
      ),
    },
  ];

  const actions: TableAction<Product>[] = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: (product) => console.log('View', product.id),
    },
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEdit,
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (product) => handleDelete(product.id),
      variant: 'destructive',
    },
  ];

  // Stats
  const stats = {
    total: products.length,
    frames: products.filter(p => p.type === 'FRAME').length,
    lenses: products.filter(p => p.type === 'LENS').length,
    accessories: products.filter(p => p.type === 'ACCESSORY').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your inventory and product catalog
          </p>
        </div>
        <QuickActionButton
          icon={Plus}
          label="Add Product"
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardStatCard
          title="Total Products"
          value={stats.total}
          icon={Package}
          iconBgColor="bg-blue-100 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <DashboardStatCard
          title="Frames"
          value={stats.frames}
          icon={Package}
          iconBgColor="bg-purple-100 dark:bg-purple-900/20"
          iconColor="text-purple-600 dark:text-purple-400"
        />
        <DashboardStatCard
          title="Lenses"
          value={stats.lenses}
          icon={Package}
          iconBgColor="bg-green-100 dark:bg-green-900/20"
          iconColor="text-green-600 dark:text-green-400"
        />
        <DashboardStatCard
          title="Accessories"
          value={stats.accessories}
          icon={Package}
          iconBgColor="bg-orange-100 dark:bg-orange-900/20"
          iconColor="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* Products Table */}
      {loading ? (
        <SkeletonTable rows={8} columns={5} />
      ) : products.length === 0 && !searchTerm ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Package}
              title="No products yet"
              description="Get started by adding your first product to the inventory"
              actionLabel="Add Product"
              onAction={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <EnhancedTable
          title="All Products"
          description={`${products.length} products in inventory`}
          data={products}
          columns={columns}
          actions={actions}
          searchable
          searchPlaceholder="Search by name, SKU, brand..."
          onSearch={setSearchTerm}
          loading={loading}
          emptyMessage="No products found"
          pageSize={10}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update product information and images'
                : 'Fill in the details to create a new product'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Product Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Ray-Ban Classic Wayfarer"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g., Ray-Ban"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g., RB-2140-001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Product Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => {
                        const type = value as 'FRAME' | 'LENS' | 'ACCESSORY';
                        setFormData({
                          ...formData,
                          type,
                          categoryId: TYPE_TO_CATEGORY_ID[type],
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FRAME">Frame</SelectItem>
                        <SelectItem value="LENS">Lens</SelectItem>
                        <SelectItem value="ACCESSORY">Accessory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Product description..."
                      rows={4}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="price">Price (VND) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="isPreorder" className="text-base">
                        Preorder Product
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Enable if this product requires pre-ordering
                      </p>
                    </div>
                    <Switch
                      id="isPreorder"
                      checked={formData.isPreorder}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isPreorder: checked })
                      }
                    />
                  </div>

                  {formData.isPreorder && (
                    <div>
                      <Label htmlFor="leadTimeDays">Lead Time (Days)</Label>
                      <Input
                        id="leadTimeDays"
                        type="number"
                        value={formData.leadTimeDays || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, leadTimeDays: Number(e.target.value) || undefined })
                        }
                        placeholder="e.g., 7"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="images" className="mt-4">
                <div>
                  <Label>Product Images {!editingProduct && '*'}</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload up to 5 images. First image will be the primary display.
                  </p>
                  <ModernImageUpload
                    images={formImageFiles}
                    onImagesChange={setFormImageFiles}
                    maxImages={5}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminProductManagement;
