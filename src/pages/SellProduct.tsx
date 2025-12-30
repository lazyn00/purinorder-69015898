import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, X, Search, Edit, Image, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const CATEGORIES = [
  { value: "Outfit & Doll", label: "Outfit & Doll" },
  { value: "Merch", label: "Merch" },
  { value: "Thời trang", label: "Thời trang" },
  { value: "Khác", label: "Khác" },
];

const SUBCATEGORIES: Record<string, string[]> = {
  "Outfit & Doll": ["Doll", "Outfit", "Phụ kiện doll", "Khác"],
  "Merch": ["Photocard", "Sticker", "Poster", "Album", "Lightstick", "Khác"],
  "Thời trang": ["Áo", "Quần", "Váy", "Phụ kiện", "Khác"],
  "Khác": ["Khác"],
};

interface Variant {
  name: string;
  price: number;
}

export default function SellProduct() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"create" | "track">("create");
  
  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [tag, setTag] = useState<"Pass" | "Gom">("Pass");
  const [price, setPrice] = useState<string>("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState("");
  
  // Images
  const [imageUploadType, setImageUploadType] = useState<"link" | "upload">("link");
  const [imageLinks, setImageLinks] = useState<string[]>([""]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  
  // Seller info
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerSocial, setSellerSocial] = useState("");
  const [sellerBankName, setSellerBankName] = useState("");
  const [sellerBankAccount, setSellerBankAccount] = useState("");
  const [sellerAccountName, setSellerAccountName] = useState("");
  
  // Track listing
  const [trackCode, setTrackCode] = useState("");
  const [trackedListing, setTrackedListing] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Result
  const [submittedCode, setSubmittedCode] = useState("");

  const generateListingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'SL';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const addVariant = () => {
    if (newVariantName && newVariantPrice) {
      setVariants([...variants, { name: newVariantName, price: parseInt(newVariantPrice) }]);
      setNewVariantName("");
      setNewVariantPrice("");
    }
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const addImageLink = () => {
    setImageLinks([...imageLinks, ""]);
  };

  const updateImageLink = (index: number, value: string) => {
    const newLinks = [...imageLinks];
    newLinks[index] = value;
    setImageLinks(newLinks);
  };

  const removeImageLink = (index: number) => {
    if (imageLinks.length > 1) {
      setImageLinks(imageLinks.filter((_, i) => i !== index));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedImages([...uploadedImages, ...newFiles]);
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name || !category || !sellerPhone || !sellerSocial || !sellerBankName || !sellerBankAccount || !sellerAccountName) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc.",
        variant: "destructive"
      });
      return;
    }

    const finalSubcategory = subcategory === "Khác" ? customSubcategory || "Khác" : subcategory;
    if (!finalSubcategory) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn danh mục nhỏ.",
        variant: "destructive"
      });
      return;
    }

    // Check images
    const validImageLinks = imageLinks.filter(link => link.trim() !== "");
    if (imageUploadType === "link" && validImageLinks.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng thêm ít nhất 1 ảnh.",
        variant: "destructive"
      });
      return;
    }
    if (imageUploadType === "upload" && uploadedImages.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng tải lên ít nhất 1 ảnh.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImages: string[] = [];

      if (imageUploadType === "link") {
        finalImages = validImageLinks;
      } else {
        // Upload images to storage
        for (const file of uploadedImages) {
          const fileExt = file.name.split('.').pop();
          const fileName = `listings/${Date.now()}_${Math.random()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('payment-proofs')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(fileName);

          finalImages.push(publicUrl);
        }
      }

      if (finalImages.length === 0) {
        throw new Error("Không thể tải ảnh lên");
      }

      const listingCode = generateListingCode();
      const finalPrice = variants.length > 0 ? null : (price ? parseInt(price) : null);

      const { error: insertError } = await (supabase as any)
        .from('user_listings')
        .insert({
          listing_code: listingCode,
          name,
          description,
          images: finalImages,
          variants: variants.length > 0 ? variants : [],
          category,
          subcategory: finalSubcategory,
          tag,
          price: finalPrice,
          seller_phone: sellerPhone,
          seller_social: sellerSocial,
          seller_bank_name: sellerBankName,
          seller_bank_account: sellerBankAccount,
          seller_account_name: sellerAccountName,
          status: 'pending'
        });

      if (insertError) throw insertError;

      setSubmittedCode(listingCode);
      toast({
        title: "Đăng bán thành công!",
        description: `Mã bài đăng của bạn: ${listingCode}. Lưu lại để tra cứu và chỉnh sửa.`,
      });

      // Reset form
      setName("");
      setDescription("");
      setCategory("");
      setSubcategory("");
      setCustomSubcategory("");
      setTag("Pass");
      setPrice("");
      setVariants([]);
      setImageLinks([""]);
      setUploadedImages([]);

    } catch (error) {
      console.error("Error submitting listing:", error);
      toast({
        title: "Lỗi",
        description: "Đã có lỗi xảy ra. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackListing = async () => {
    if (!trackCode.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã bài đăng.",
        variant: "destructive"
      });
      return;
    }

    setIsTracking(true);
    try {
      const { data, error } = await (supabase as any)
        .from('user_listings')
        .select('*')
        .eq('listing_code', trackCode.toUpperCase())
        .single();

      if (error || !data) {
        toast({
          title: "Không tìm thấy",
          description: "Mã bài đăng không tồn tại.",
          variant: "destructive"
        });
        setTrackedListing(null);
      } else {
        setTrackedListing(data);
        // Pre-fill form for editing
        setName(data.name);
        setDescription(data.description || "");
        setCategory(data.category);
        setSubcategory(data.subcategory);
        setTag(data.tag as "Pass" | "Gom");
        setPrice(data.price?.toString() || "");
        setVariants((data.variants as Variant[]) || []);
        const images = data.images as string[];
        setImageLinks(images?.length > 0 ? images : [""]);
        setSellerPhone(data.seller_phone);
        setSellerSocial(data.seller_social);
        setSellerBankName(data.seller_bank_name);
        setSellerBankAccount(data.seller_bank_account);
        setSellerAccountName(data.seller_account_name);
        setImageUploadType("link");
      }
    } catch (error) {
      console.error("Error tracking listing:", error);
      toast({
        title: "Lỗi",
        description: "Đã có lỗi xảy ra.",
        variant: "destructive"
      });
    } finally {
      setIsTracking(false);
    }
  };

  const handleUpdateListing = async () => {
    if (!trackedListing) return;

    setIsSubmitting(true);
    try {
      const finalSubcategory = subcategory === "Khác" ? customSubcategory || "Khác" : subcategory;
      const validImageLinks = imageLinks.filter(link => link.trim() !== "");
      const finalPrice = variants.length > 0 ? null : (price ? parseInt(price) : null);

      const { error } = await (supabase as any)
        .from('user_listings')
        .update({
          name,
          description,
          images: validImageLinks,
          variants: variants.length > 0 ? variants : [],
          category,
          subcategory: finalSubcategory,
          tag,
          price: finalPrice,
          seller_phone: sellerPhone,
          seller_social: sellerSocial,
          seller_bank_name: sellerBankName,
          seller_bank_account: sellerBankAccount,
          seller_account_name: sellerAccountName,
        })
        .eq('id', trackedListing.id);

      if (error) throw error;

      toast({
        title: "Cập nhật thành công!",
        description: "Thông tin bài đăng đã được cập nhật.",
      });
      setIsEditing(false);
      // Refresh listing
      handleTrackListing();
    } catch (error) {
      console.error("Error updating listing:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật bài đăng.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Chờ duyệt</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Đã duyệt</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">Từ chối</span>;
      case 'sold':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Đã bán</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">{status}</span>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Đăng bán sản phẩm</h1>
          <p className="text-muted-foreground">Pass/Gom hàng K-pop, C-pop, Anime cùng Purin Order</p>
        </div>

        {submittedCode && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-green-800 font-semibold mb-2">🎉 Đăng bài thành công!</p>
                <p className="text-sm text-green-700 mb-3">Mã bài đăng của bạn:</p>
                <p className="text-2xl font-bold text-green-900 bg-white px-4 py-2 rounded inline-block">{submittedCode}</p>
                <p className="text-xs text-green-600 mt-3">Lưu lại mã này để tra cứu và chỉnh sửa bài đăng</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "create" | "track")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="create">Đăng bài mới</TabsTrigger>
            <TabsTrigger value="track">Tra cứu bài đăng</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin sản phẩm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Tên sản phẩm *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="VD: Outfit YoSD Blue Dress"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Mô tả (tùy chọn)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Mô tả chi tiết sản phẩm..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Danh mục *</Label>
                      <Select value={category} onValueChange={(v) => { setCategory(v); setSubcategory(""); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Danh mục nhỏ *</Label>
                      <Select value={subcategory} onValueChange={setSubcategory} disabled={!category}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục nhỏ" />
                        </SelectTrigger>
                        <SelectContent>
                          {category && SUBCATEGORIES[category]?.map(sub => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {subcategory === "Khác" && (
                    <div>
                      <Label>Nhập danh mục nhỏ</Label>
                      <Input
                        value={customSubcategory}
                        onChange={(e) => setCustomSubcategory(e.target.value)}
                        placeholder="VD: Móc khoá"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Loại *</Label>
                    <RadioGroup value={tag} onValueChange={(v) => setTag(v as "Pass" | "Gom")} className="flex gap-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Pass" id="pass" />
                        <Label htmlFor="pass" className="cursor-pointer">Pass (Bán lại)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Gom" id="gom" />
                        <Label htmlFor="gom" className="cursor-pointer">Gom (Order chung)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>

              {/* Price & Variants */}
              <Card>
                <CardHeader>
                  <CardTitle>Giá & Phân loại</CardTitle>
                  <CardDescription>Nếu có nhiều phân loại, thêm từng phân loại với giá riêng. Nếu không, nhập giá chung.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {variants.length === 0 && (
                    <div>
                      <Label htmlFor="price">Giá (VNĐ)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="VD: 150000"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Phân loại (nếu có)</Label>
                    {variants.map((v, index) => (
                      <div key={index} className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                        <span className="flex-1">{v.name}</span>
                        <span className="font-medium">{v.price.toLocaleString('vi-VN')}đ</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Tên phân loại"
                        value={newVariantName}
                        onChange={(e) => setNewVariantName(e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Giá"
                        value={newVariantPrice}
                        onChange={(e) => setNewVariantPrice(e.target.value)}
                        className="w-32"
                      />
                      <Button type="button" variant="outline" onClick={addVariant}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Hình ảnh *</CardTitle>
                  <CardDescription>Upload ảnh qua link hoặc tải lên trực tiếp</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={imageUploadType} onValueChange={(v) => setImageUploadType(v as "link" | "upload")} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="link" id="img-link" />
                      <Label htmlFor="img-link" className="cursor-pointer flex items-center gap-1">
                        <LinkIcon className="h-4 w-4" /> Up link
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upload" id="img-upload" />
                      <Label htmlFor="img-upload" className="cursor-pointer flex items-center gap-1">
                        <Image className="h-4 w-4" /> Tải lên
                      </Label>
                    </div>
                  </RadioGroup>

                  {imageUploadType === "link" ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        💡 Tip: Upload ảnh tại <a href="https://uploadimgur.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">uploadimgur.com</a> rồi copy link
                      </p>
                      {imageLinks.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder="https://i.imgur.com/..."
                            value={link}
                            onChange={(e) => updateImageLink(index, e.target.value)}
                          />
                          {imageLinks.length > 1 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeImageLink(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addImageLink}>
                        <Plus className="h-4 w-4 mr-1" /> Thêm ảnh
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                      />
                      {uploadedImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {uploadedImages.map((file, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-20 h-20 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => removeUploadedImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Seller Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin liên hệ *</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sellerPhone">Số điện thoại *</Label>
                    <Input
                      id="sellerPhone"
                      type="tel"
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      placeholder="090..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sellerSocial">Link Facebook/Instagram *</Label>
                    <Input
                      id="sellerSocial"
                      value={sellerSocial}
                      onChange={(e) => setSellerSocial(e.target.value)}
                      placeholder="https://facebook.com/..."
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Bank Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin nhận tiền *</CardTitle>
                  <CardDescription>Tiền bán sẽ được chuyển về tài khoản này sau khi giao dịch hoàn tất</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bankName">Tên ngân hàng *</Label>
                    <Input
                      id="bankName"
                      value={sellerBankName}
                      onChange={(e) => setSellerBankName(e.target.value)}
                      placeholder="VD: Vietcombank"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccount">Số tài khoản *</Label>
                    <Input
                      id="bankAccount"
                      value={sellerBankAccount}
                      onChange={(e) => setSellerBankAccount(e.target.value)}
                      placeholder="VD: 0123456789"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountName">Tên chủ tài khoản *</Label>
                    <Input
                      id="accountName"
                      value={sellerAccountName}
                      onChange={(e) => setSellerAccountName(e.target.value)}
                      placeholder="VD: NGUYEN VAN A"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Đăng bán
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="track">
            <Card>
              <CardHeader>
                <CardTitle>Tra cứu bài đăng</CardTitle>
                <CardDescription>Nhập mã bài đăng để xem trạng thái và chỉnh sửa thông tin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập mã bài đăng (VD: SL123ABC)"
                    value={trackCode}
                    onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
                  />
                  <Button onClick={handleTrackListing} disabled={isTracking}>
                    {isTracking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {trackedListing && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{trackedListing.name}</h3>
                        <p className="text-sm text-muted-foreground">Mã: {trackedListing.listing_code}</p>
                      </div>
                      {getStatusBadge(trackedListing.status)}
                    </div>

                    {trackedListing.images?.[0] && (
                      <img
                        src={trackedListing.images[0]}
                        alt={trackedListing.name}
                        className="w-full max-w-xs h-48 object-cover rounded"
                      />
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Danh mục:</span> {trackedListing.category}</div>
                      <div><span className="text-muted-foreground">Loại:</span> {trackedListing.tag}</div>
                      <div><span className="text-muted-foreground">Giá:</span> {trackedListing.price?.toLocaleString('vi-VN')}đ</div>
                      <div><span className="text-muted-foreground">Ngày đăng:</span> {new Date(trackedListing.created_at).toLocaleDateString('vi-VN')}</div>
                    </div>

                    {trackedListing.admin_note && (
                      <div className="bg-muted p-3 rounded text-sm">
                        <p className="font-medium">Ghi chú từ Admin:</p>
                        <p>{trackedListing.admin_note}</p>
                      </div>
                    )}

                    {trackedListing.status !== 'sold' && (
                      <Button onClick={() => setIsEditing(!isEditing)} variant="outline" className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        {isEditing ? "Huỷ chỉnh sửa" : "Chỉnh sửa thông tin"}
                      </Button>
                    )}

                    {isEditing && (
                      <div className="border-t pt-4 space-y-4">
                        <p className="text-sm text-muted-foreground">Chỉnh sửa thông tin bên tab "Đăng bài mới" rồi bấm nút bên dưới để lưu</p>
                        <Button onClick={handleUpdateListing} disabled={isSubmitting} className="w-full">
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Lưu thay đổi
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}