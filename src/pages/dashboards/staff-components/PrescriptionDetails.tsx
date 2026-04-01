import React from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Glasses } from 'lucide-react';
import { motion } from 'framer-motion';

interface PrescriptionData {
  rightEyeSphere?: string;
  rightEyeCylinder?: string;
  rightEyeAxis?: number;
  leftEyeSphere?: string;
  leftEyeCylinder?: string;
  leftEyeAxis?: number;
  pupillaryDistance?: string;
  notes?: string;
  prescriptionImageUrl?: string;
}

interface PrescriptionDetailsProps {
  prescription: PrescriptionData | null;
  className?: string;
}

export const PrescriptionDetails: React.FC<PrescriptionDetailsProps> = ({ 
  prescription, 
  className 
}) => {
  if (!prescription) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Glasses className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Đơn hàng này không có thông tin đơn thuốc</p>
        </CardContent>
      </Card>
    );
  }

  const formatValue = (value: string | number | undefined) => {
    if (value === undefined || value === null || value === '') return '-';
    return value;
  };

  return (
    <motion.div 
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Thông Số Đơn Thuốc
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Right Eye */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">Mắt phải (OD)</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Sphere (SPH)</Label>
                <p className="text-lg font-semibold mt-1">{formatValue(prescription.rightEyeSphere)}</p>
                <p className="text-xs text-muted-foreground">Độ cận/viễn</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Cylinder (CYL)</Label>
                <p className="text-lg font-semibold mt-1">{formatValue(prescription.rightEyeCylinder)}</p>
                <p className="text-xs text-muted-foreground">Độ loạn</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Axis (AX)</Label>
                <p className="text-lg font-semibold mt-1">
                  {prescription.rightEyeAxis !== undefined ? `${prescription.rightEyeAxis}°` : '-'}
                </p>
                <p className="text-xs text-muted-foreground">Trục loạn</p>
              </div>
            </div>
          </div>

          {/* Left Eye */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-green-50 text-green-700">Mắt trái (OS)</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Sphere (SPH)</Label>
                <p className="text-lg font-semibold mt-1">{formatValue(prescription.leftEyeSphere)}</p>
                <p className="text-xs text-muted-foreground">Độ cận/viễn</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Cylinder (CYL)</Label>
                <p className="text-lg font-semibold mt-1">{formatValue(prescription.leftEyeCylinder)}</p>
                <p className="text-xs text-muted-foreground">Độ loạn</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Axis (AX)</Label>
                <p className="text-lg font-semibold mt-1">
                  {prescription.leftEyeAxis !== undefined ? `${prescription.leftEyeAxis}°` : '-'}
                </p>
                <p className="text-xs text-muted-foreground">Trục loạn</p>
              </div>
            </div>
          </div>

          {/* Pupillary Distance */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <Label className="text-xs text-muted-foreground">Pupillary Distance (PD)</Label>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {formatValue(prescription.pupillaryDistance)} {prescription.pupillaryDistance ? 'mm' : ''}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Khoảng cách đồng tử</p>
          </div>

          {/* Notes */}
          {prescription.notes && (
            <div>
              <Label className="text-sm font-medium">Ghi chú</Label>
              <p className="text-sm mt-2 p-3 bg-gray-50 border rounded">
                {prescription.notes}
              </p>
            </div>
          )}

          {/* Prescription Image */}
          {prescription.prescriptionImageUrl && (
            <div>
              <Label className="text-sm font-medium">Ảnh đơn thuốc</Label>
              <div className="mt-2">
                <img
                  src={prescription.prescriptionImageUrl}
                  alt="Prescription"
                  className="w-full max-w-md rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(prescription.prescriptionImageUrl, '_blank')}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Click để xem ảnh ở cỡ lớn
                </p>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Giải thích:</strong>
            </p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li><strong>SPH (Sphere):</strong> Số âm (-) = cận thị, Số dương (+) = viễn thị</li>
              <li><strong>CYL (Cylinder):</strong> Độ loạn thị (nếu có)</li>
              <li><strong>AX (Axis):</strong> Trục của loạn thị (0-180°)</li>
              <li><strong>PD:</strong> Khoảng cách giữa 2 đồng tử (thường 58-72mm)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
