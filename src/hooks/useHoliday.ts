// Vietnamese Holiday Detection Hook
// Supports lunar calendar approximations for Tết and Trung Thu

interface Holiday {
  name: string;
  emoji: string;
  particles: string[];
  favicon: string;
  colors: string[];
}

// Approximate lunar new year dates (2024-2030)
const TET_DATES: Record<number, [number, number]> = {
  2024: [2, 10],  // Feb 10
  2025: [1, 29],  // Jan 29
  2026: [2, 17],  // Feb 17
  2027: [2, 6],   // Feb 6
  2028: [1, 26],  // Jan 26
  2029: [2, 13],  // Feb 13
  2030: [2, 3],   // Feb 3
};

// Approximate mid-autumn dates (2024-2030)
const TRUNG_THU_DATES: Record<number, [number, number]> = {
  2024: [9, 17],
  2025: [10, 6],
  2026: [9, 25],
  2027: [9, 15],
  2028: [10, 3],
  2029: [9, 22],
  2030: [9, 12],
};

const HOLIDAYS: Record<string, Holiday> = {
  tet: {
    name: "Tết Nguyên Đán",
    emoji: "🧧",
    particles: ["🧧", "🎋", "🌸", "🎆", "🏮", "💮"],
    favicon: "🧧",
    colors: ["#e74c3c", "#f1c40f", "#e67e22"],
  },
  christmas_newyear: {
    name: "Giáng sinh & Năm mới",
    emoji: "🎄",
    particles: ["❄️", "🎄", "⭐", "🎅", "🎁", "✨"],
    favicon: "🎄",
    colors: ["#27ae60", "#e74c3c", "#f1c40f"],
  },
  valentine: {
    name: "Valentine",
    emoji: "💝",
    particles: ["💕", "💗", "💖", "🌹", "💝", "❤️"],
    favicon: "💝",
    colors: ["#e91e63", "#f06292", "#ec407a"],
  },
  women_intl: {
    name: "Quốc tế Phụ nữ",
    emoji: "💐",
    particles: ["🌷", "💐", "🌸", "🌺", "💕", "✨"],
    favicon: "💐",
    colors: ["#e91e63", "#f48fb1", "#ce93d8"],
  },
  reunification: {
    name: "Ngày Giải phóng & Quốc tế Lao động",
    emoji: "🇻🇳",
    particles: ["🇻🇳", "⭐", "🎆", "🎉", "✨", "🌟"],
    favicon: "🇻🇳",
    colors: ["#e74c3c", "#f1c40f"],
  },
  children: {
    name: "Quốc tế Thiếu nhi",
    emoji: "🎈",
    particles: ["🎈", "🎉", "🧸", "🍭", "⭐", "🎀"],
    favicon: "🎈",
    colors: ["#3498db", "#e74c3c", "#f1c40f", "#2ecc71"],
  },
  independence: {
    name: "Quốc khánh",
    emoji: "🇻🇳",
    particles: ["🇻🇳", "⭐", "🎆", "🎇", "🎉", "✨"],
    favicon: "🇻🇳",
    colors: ["#e74c3c", "#f1c40f"],
  },
  women_vn: {
    name: "Phụ nữ Việt Nam",
    emoji: "🌹",
    particles: ["🌹", "💐", "🌸", "💕", "🌺", "✨"],
    favicon: "🌹",
    colors: ["#e91e63", "#f48fb1", "#ce93d8"],
  },
  mid_autumn: {
    name: "Trung thu",
    emoji: "🏮",
    particles: ["🏮", "🥮", "🌕", "⭐", "🎋", "✨"],
    favicon: "🏮",
    colors: ["#e67e22", "#f39c12", "#e74c3c"],
  },
};

function isInRange(now: Date, month: number, startDay: number, endDay: number): boolean {
  return now.getMonth() + 1 === month && now.getDate() >= startDay && now.getDate() <= endDay;
}

export function getActiveHoliday(): Holiday | null {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Tết Nguyên Đán: 5 days before to 5 days after (lunar new year)
  const tetDate = TET_DATES[year];
  if (tetDate) {
    const tetStart = new Date(year, tetDate[0] - 1, tetDate[1] - 5);
    const tetEnd = new Date(year, tetDate[0] - 1, tetDate[1] + 5);
    if (now >= tetStart && now <= tetEnd) return HOLIDAYS.tet;
  }

  // Christmas & New Year: Dec 20 - Jan 3
  if ((month === 12 && day >= 20) || (month === 1 && day <= 3)) {
    return HOLIDAYS.christmas_newyear;
  }

  // Valentine: Feb 12-16
  if (isInRange(now, 2, 12, 16)) return HOLIDAYS.valentine;

  // Quốc tế Phụ nữ: Mar 6-10
  if (isInRange(now, 3, 6, 10)) return HOLIDAYS.women_intl;

  // 30/4 - 1/5: Apr 28 - May 3
  if ((month === 4 && day >= 28) || (month === 5 && day <= 3)) {
    return HOLIDAYS.reunification;
  }

  // Quốc tế Thiếu nhi: May 30 - Jun 3
  if ((month === 5 && day >= 30) || (month === 6 && day <= 3)) {
    return HOLIDAYS.children;
  }

  // Quốc khánh 2/9: Sep 1-4
  if (isInRange(now, 9, 1, 4)) return HOLIDAYS.independence;

  // Phụ nữ Việt Nam 20/10: Oct 18-22
  if (isInRange(now, 10, 18, 22)) return HOLIDAYS.women_vn;

  // Trung thu
  const ttDate = TRUNG_THU_DATES[year];
  if (ttDate) {
    const ttStart = new Date(year, ttDate[0] - 1, ttDate[1] - 3);
    const ttEnd = new Date(year, ttDate[0] - 1, ttDate[1] + 1);
    if (now >= ttStart && now <= ttEnd) return HOLIDAYS.mid_autumn;
  }

  return null;
}
