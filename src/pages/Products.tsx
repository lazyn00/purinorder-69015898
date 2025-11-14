// ... (các đoạn import và logic khác giữ nguyên)

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* ... (phần tiêu đề giữ nguyên) */}

        {/* --- KHỐI THANH TÌM KIẾM, BỘ LỌC VÀ SẮP XẾP --- */}
        <div className="flex flex-col gap-3 mb-8 max-w-4xl mx-auto">
          {/* HÀNG 1: Thanh tìm kiếm - ĐÃ TINH GIẢN */}
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              // Đổi placeholder thành "Tìm kiếm..." ngắn gọn hơn
              placeholder="Tìm kiếm..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          {/* HÀNG 2: Filters and Sort (Giữ nguyên như phiên bản tối ưu mobile) */}
          <div className="flex items-center justify-between gap-1 w-full flex-nowrap overflow-x-auto pb-1"> 
            
            {/* Artist Filter */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Select value={selectedArtist} onValueChange={setSelectedArtist}>
                <SelectTrigger className="w-[110px] sm:w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Thuộc tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thuộc tính</SelectItem>
                  {uniqueArtists.map((artist) => (
                    <SelectItem key={artist} value={artist}>
                      {artist}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Sort by Price */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[110px] sm:w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Mặc định</SelectItem>
                  <SelectItem value="price-asc">Giá thấp-cao</SelectItem>
                  <SelectItem value="price-desc">Giá cao-thấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {/* ---------------------------------------------------------------- */}

        {/* ... (phần hiển thị sản phẩm giữ nguyên) */}
      </div>
    </Layout>
  );
}
