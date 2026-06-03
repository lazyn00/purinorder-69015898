import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, LogOut, Trash2, ShoppingCart, ExternalLink, Search, Copy, FileDown, Bell, Mail, Eye, CalendarIcon, Tag, Merge, Settings, BoxIcon, Layers, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog"; // Thêm import này
import ProductManagement from "@/components/ProductManagement";
import { DiscountCodeManagement } from "@/components/DiscountCodeManagement";
import { OrderMerging } from "@/components/OrderMerging";
import AdminSettings from "@/components/AdminSettings";
import ProductTrackingFiltered from "@/components/ProductTrackingFiltered";
import MasterManagement from "@/components/MasterManagement";
import * as XLSX from 'xlsx';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { SHIPPING_PROVIDERS, findProviderByName, getTrackingUrlFromProvider } from "@/data/shippingProviders";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// ... (Các const ADMIN_CREDENTIALS, PAYMENT_STATUSES, ORDER_PROGRESS giữ nguyên như cũ)

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State mới cho Popup Bill
  const [billUrl, setBillUrl] = useState<string | null>(null);

  // ... (Toàn bộ các state và useEffect logic giữ nguyên như code bạn đã gửi)
  // [GIAI ĐOẠN ĐẦU CỦA FILE GIỮ NGUYÊN...]

  // Tại phần render Table, hãy sửa các thẻ <a> của bill thành:
  /*
    {order.payment_proof_url && (
      <button onClick={() => setBillUrl(order.payment_proof_url)} className="text-xs text-primary hover:underline flex items-center justify-end gap-1">
        Bill 1 <Eye className="h-3 w-3" />
      </button>
    )}
    {order.second_payment_proof_url && (
      <button onClick={() => setBillUrl(order.second_payment_proof_url)} className="text-xs text-primary hover:underline flex items-center justify-end gap-1">
        Bill 2 <Eye className="h-3 w-3" />
      </button>
    )}
  */

  return (
    <Layout>
      {/* ... (Các phần nội dung Header và Tabs giữ nguyên) ... */}

      {/* THÊM DIALOG NÀY VÀO CUỐI RETURN CỦA COMPONENT */}
      <Dialog open={!!billUrl} onOpenChange={(open) => !open && setBillUrl(null)}>
        <DialogContent className="w-[95vw] max-w-4xl h-[80vh] p-0 overflow-hidden">
          {billUrl && (
            <iframe 
              src={billUrl} 
              className="w-full h-full border-0" 
              title="Bill Preview"
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
