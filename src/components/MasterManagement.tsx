import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Trash2, Image, ChevronDown, ChevronUp, Package, Store, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface MasterShop {
  id?: string;
  master_name: string;
  display_name: string;
  slug: string;
  avatar_url: string | null;
  shop_link: string | null;
  description: string | null;
  is_visible: boolean;
  sort_order: number;
}

const slugify = (s: string) => {
  if (!s) return "shop";
  
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^\p{L}\p{N}]+/gu, "-") 
    .replace(/(^-|-$)/g, "")
    .slice(0, 100);
};

interface MasterUpdate {
  id: string;
  master_name: string;
  message: string;
  images: string[];
  created_at: string;
}

interface MasterProduct {
  id: number;
  name: string;
  master?: string;
  status: string;
  price: number;
  images: string[];
}

export default function MasterManagement() {
  const [masters, setMasters] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<MasterProduct[]>([]);
  const [selectedMaster, setSelectedMaster] = useState<string | null>(null);
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [updates, setUpdates] = useState<MasterUpdate[]>([]);
  const [message, setMessage] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [shopInfo, setShopInfo] = useState<MasterShop | null>(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopSaving, setShopSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    if (selectedMaster) {
      fetchMasterProducts(selectedMaster);
      fetchMasterUpdates(selectedMaster);
      fetchShopInfo(selectedMaster);
    }
  }, [selectedMaster]);

  const fetchMasters = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, master, status, price, images")
      .not("master", "is", null)
      .neq("master", "");
    if (data) {
      setAllProducts(data.map((p: any) => ({ ...p, images: (p.images as string[]) || [] })));
      const uniqueMasters = [...new Set(data.map((p: any) => p.master as string).filter(Boolean))].sort();
      setMasters(uniqueMasters);
    }
    setLoading(false);
  };

  const fetchMasterProducts = async (master: string) => {
    const { data } = await supabase
      .from("products")
      .select("id, name, status, price, images")
      .eq("master", master)
      .order("created_at", { ascending: false });
    if (data) setProducts(data.map((p: any) => ({ ...p, images: (p.images as string[]) || [] })));
  };

  const fetchMasterUpdates = async (master: string) => {
    const { data } = await (supabase as any)
      .from("master_updates")
      .select("*")
      .eq("master_name", master)
      .order("created_at", { ascending: false });
    if (data) setUpdates(data.map((u: any) => ({ ...u, images: (u.images as string[]) || [] })));
  };

  const fetchShopInfo = async (master: string) => {
    setShopLoading(true);
    setAvatarFile(null);
    const { data } = await (supabase as any)
      .from("master_shops")
      .select("*")
      .eq("master_name", master)
      .maybeSingle();
    if (data) {
      setShopInfo(data as MasterShop);
    } else {
      setShopInfo({
        master_name: master,
        display_name: master,
        slug: slugify(master),
        avatar_url: null,
        shop_link: null,
        description: null,
        is_visible: true,
        sort_order: 0,
      });
    }
    setShopLoading(false);
  };

  const uploadToR2 = async (file: File, prefix: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const safeName = Date.now() + "-" + Math.random().toString(36).slice(2);
    const path = `${prefix}/${safeName}.${ext}`;
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const r2 = new S3Client({
      region: "auto",
      endpoint: import.meta.env.VITE_R2_ENDPOINT,
      credentials: {
        accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY,
        secretAccessKey: import.meta.env.VITE_R2_SECRET_KEY,
      },
    });
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await r2.send(new PutObjectCommand({ Bucket: "product-images", Key: path, Body: uint8Array, ContentType: file.type }));
    return `${import.meta.env.VITE_R2_PUBLIC_URL}/${path}`;
  };

  const handleSaveShop = async () => {
    if (!shopInfo || !selectedMaster) return;
    setShopSaving(true);
    try {
      let avatarUrl = shopInfo.avatar_url;
      if (avatarFile) {
        avatarUrl = await uploadToR2(avatarFile, "master-avatars");
      }
      const payload = {
        master_name: selectedMaster,
        display_name: shopInfo.display_name.trim() || selectedMaster,
        slug: (shopInfo.slug || slugify(shopInfo.display_name || selectedMaster)).trim(),
        avatar_url: avatarUrl,
        shop_link: shopInfo.shop_link?.trim() || null,
        description: shopInfo.description?.trim() || null,
        is_visible: shopInfo.is_visible,
        sort_order: shopInfo.sort_order || 0,
      };
      const { error } = await (supabase as any)
        .from("master_shops")
        .upsert(payload, { onConflict: "master_name" });
      if (error) throw error;
      toast({ title: "Đã lưu", description: "Thông tin shop được cập nhật." });
      setAvatarFile(null);
      fetchShopInfo(selectedMaster);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setShopSaving(false);
    }
  };

  const handleSendUpdate = async () => {
    if (!selectedMaster || !message.trim()) return;
    setSending(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadToR2(file, "master-updates");
        uploadedUrls.push(url);
      }

      const { error } = await (supabase as any).from("master_updates").insert({
        master_name: selectedMaster,
        message: message.trim(),
        images: uploadedUrls,
      });
      if (error) throw error;

      toast({ title: "Đã đăng", description: "Cập nhật tiến độ thành công." });
      setMessage("");
      setImageFiles([]);
      fetchMasterUpdates(selectedMaster);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    if (!confirm("Xoá cập nhật này?")) return;
    await (supabase as any).from("master_updates").delete().eq("id", id);
    if (selectedMaster) fetchMasterUpdates(selectedMaster);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const filteredMasters = masters.filter(m => {
    const term = searchTerm.toLowerCase();
    if (m.toLowerCase().includes(term)) return true;
    return allProducts.some(p => p.master === m && p.name.toLowerCase().includes(term));
  });

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Tìm master hoặc tên sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Badge variant="secondary">{masters.length} master</Badge>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-4">
        <div className="space-y-1 max-h-[70vh] overflow-y-auto border rounded-lg p-2">
          {filteredMasters.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMaster(m)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedMaster === m ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {m}
            </button>
          ))}
          {filteredMasters.length === 0 && <p className="text-sm text-muted-foreground p-3">Không có master nào.</p>}
        </div>

        {selectedMaster ? (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">{selectedMaster}</h3>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Package className="h-4 w-4" /> Sản phẩm ({products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center"><Package className="h-3 w-3" /></div>
                      )}
                      <span className="flex-1 truncate">{p.name}</span>
                      <Badge variant="outline" className="text-[10px]">{p.status || "Sẵn"}</Badge>
                      <span className="text-muted-foreground">{p.price?.toLocaleString("vi-VN")}đ</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Store className="h-4 w-4" /> Thông tin shop
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shopLoading || !shopInfo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                        {avatarFile ? (
                          <img src={URL.createObjectURL(avatarFile)} className="w-full h-full object-cover" />
                        ) : shopInfo.avatar_url ? (
                          <img src={shopInfo.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          <Store className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Ảnh đại diện</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Tên hiển thị</Label>
                        <Input
                          value={shopInfo.display_name}
                          onChange={(e) => setShopInfo({ ...shopInfo, display_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Slug (URL)</Label>
                        <Input
                          value={shopInfo.slug}
                          onChange={(e) => setShopInfo({ ...shopInfo, slug: e.target.value })}
                          placeholder="ten-shop-tieng-trung"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Link shop (tuỳ chọn)</Label>
                      <Input
                        value={shopInfo.shop_link || ""}
                        onChange={(e) => setShopInfo({ ...shopInfo, shop_link: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Mô tả</Label>
                      <Textarea
                        rows={2}
                        value={shopInfo.description || ""}
                        onChange={(e) => setShopInfo({ ...shopInfo, description: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={shopInfo.is_visible}
                          onCheckedChange={(v) => setShopInfo({ ...shopInfo, is_visible: v })}
                        />
                        <Label className="text-xs">Hiển thị</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Thứ tự</Label>
                        <Input
                          type="number"
                          value={shopInfo.sort_order}
                          onChange={(e) => setShopInfo({ ...shopInfo, sort_order: parseInt(e.target.value) || 0 })}
                          className="w-20"
                        />
                      </div>
                      <Button onClick={handleSaveShop} disabled={shopSaving} size="sm" className="ml-auto">
                        {shopSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu shop"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">📢 Đăng cập nhật tiến độ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Nhập nội dung cập nhật..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                    className="flex-1"
                  />
                  <Button onClick={handleSendUpdate} disabled={sending || !message.trim()} size="sm">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Lịch sử cập nhật ({updates.length})</h4>
              {updates.map((u) => (
                <Card key={u.id}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs text-muted-foreground">{formatDate(u.created_at)}</p>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteUpdate(u.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{u.message}</p>
                    {u.images.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {u.images.map((img, i) => (
                          <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                            <img src={img} className="w-20 h-20 object-cover rounded border hover:opacity-80 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center text-muted-foreground text-sm py-20">
            Chọn một master để xem chi tiết
          </div>
        )}
      </div>
    </div>
  );
}
