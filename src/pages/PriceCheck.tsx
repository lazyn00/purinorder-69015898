import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calculator, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const RATE_KEY = "purin_cny_rate";
const DEFAULT_RATE = 3600;
const SERVICE_FEE = 5000;
const SHIPPING_PER_KG = 37000;

const formatVND = (n: number) =>
  n.toLocaleString("vi-VN") + "đ";

const PriceCheck = () => {
  const [priceCNY, setPriceCNY] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [showRateSetting, setShowRateSetting] = useState(false);
  const [rateInput, setRateInput] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(RATE_KEY);
    if (saved) {
      const parsed = Number(saved);
      if (!isNaN(parsed) && parsed > 0) {
        setRate(parsed);
        setRateInput(String(parsed));
      }
    } else {
      setRateInput(String(DEFAULT_RATE));
    }
  }, []);

  const handleSaveRate = () => {
    const parsed = Number(rateInput);
    if (!isNaN(parsed) && parsed > 0) {
      setRate(parsed);
      localStorage.setItem(RATE_KEY, String(parsed));
      setShowRateSetting(false);
    }
  };

  const cny = parseFloat(priceCNY) || 0;
  const qty = parseInt(quantity) || 1;

  const priceVND = Math.round(cny * rate);
  const totalProduct = priceVND * qty;
  const totalServiceFee = SERVICE_FEE * qty;
  const grandTotal = totalProduct + totalServiceFee;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Check giá sản phẩm</h1>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Quy đổi giá CNY → VND</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setRateInput(String(rate));
                  setShowRateSetting(!showRateSetting);
                }}
                title="Cài đặt tỷ giá"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </CardTitle>

            {showRateSetting && (
              <div className="flex items-end gap-2 mt-2 p-3 rounded-lg bg-muted">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Tỷ giá 1 CNY = ? VND</Label>
                  <Input
                    type="number"
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    placeholder="3600"
                    className="mt-1"
                  />
                </div>
                <Button size="sm" onClick={handleSaveRate}>Lưu</Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="price-cny">Giá sản phẩm (CNY / ¥)</Label>
              <Input
                id="price-cny"
                type="number"
                step="0.01"
                min="0"
                value={priceCNY}
                onChange={(e) => setPriceCNY(e.target.value)}
                placeholder="Nhập giá Tệ, VD: 128"
                className="mt-1 text-lg"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="quantity">Số lượng</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="mt-1"
              />
            </div>

            <Separator />

            {cny > 0 && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tỷ giá áp dụng</span>
                  <span className="font-medium">1 CNY = {rate.toLocaleString("vi-VN")}đ</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Giá quy đổi / sp</span>
                  <span className="font-medium">{formatVND(priceVND)}</span>
                </div>

                {qty > 1 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Thành tiền ({qty} sp)</span>
                    <span className="font-medium">{formatVND(totalProduct)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí dịch vụ ({formatVND(SERVICE_FEE)}/sp × {qty})</span>
                  <span className="font-medium">{formatVND(totalServiceFee)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-base font-bold">
                  <span>Tổng ước tính</span>
                  <span className="text-primary text-lg">{formatVND(grandTotal)}</span>
                </div>

                <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1.5 mt-2">
                  <p>📦 <strong>Chưa bao gồm</strong> phí cân hàng về HCM: <strong>{SHIPPING_PER_KG.toLocaleString("vi-VN")}đ/kg</strong></p>
                  <p>💡 Giá trên chỉ mang tính tham khảo, giá thực tế có thể chênh lệch tùy thời điểm tỷ giá</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PriceCheck;
