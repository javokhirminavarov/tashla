export interface Milestone {
  habit_type: "sigaret" | "nos" | "alkogol";
  hours_after: number;
  title_uz: string;
  description_uz: string;
  icon: string;
}

export const milestones: Milestone[] = [
  // Sigaret
  {
    habit_type: "sigaret",
    hours_after: 0.33,
    title_uz: "Qon bosimi normallashadi",
    description_uz: "Qon bosimi va yurak urishi normallashadi",
    icon: "❤️",
  },
  {
    habit_type: "sigaret",
    hours_after: 8,
    title_uz: "Kislorod darajasi tiklanadi",
    description_uz: "Qondagi kislorod darajasi normallashadi",
    icon: "🫁",
  },
  {
    habit_type: "sigaret",
    hours_after: 24,
    title_uz: "Yurak xavfi kamayadi",
    description_uz: "Yurak xurujiga uchrash xavfi kamaya boshlaydi",
    icon: "💓",
  },
  {
    habit_type: "sigaret",
    hours_after: 48,
    title_uz: "Sezgi organlari tiklanadi",
    description_uz: "Ta'm va hid sezish yaxshilanadi",
    icon: "👃",
  },
  {
    habit_type: "sigaret",
    hours_after: 72,
    title_uz: "Nafas olish osonlashadi",
    description_uz: "Nafas olish osonlashadi, bronxlar bo'shashadi",
    icon: "🌬️",
  },
  {
    habit_type: "sigaret",
    hours_after: 720,
    title_uz: "Teri holati yaxshilanadi",
    description_uz: "Teri rangi va elastikligi yaxshilanadi",
    icon: "✨",
  },
  {
    habit_type: "sigaret",
    hours_after: 2160,
    title_uz: "O'pka ishlashi yaxshilanadi",
    description_uz: "O'pka ishlashi 30% gacha yaxshilanadi",
    icon: "🫁",
  },
  {
    habit_type: "sigaret",
    hours_after: 8760,
    title_uz: "Yurak kasalligi xavfi kamayadi",
    description_uz: "Yurak kasalligi xavfi 50% kamayadi",
    icon: "❤️‍🩹",
  },
  {
    habit_type: "sigaret",
    hours_after: 43800,
    title_uz: "Insult xavfi yo'qoladi",
    description_uz: "Insult xavfi chekmaydigan odamnikidek bo'ladi",
    icon: "🏆",
  },

  // Nos
  {
    habit_type: "nos",
    hours_after: 24,
    title_uz: "Og'iz tiklana boshlaydi",
    description_uz: "Og'iz shilliq qavatini tiklash boshlanadi",
    icon: "👄",
  },
  {
    habit_type: "nos",
    hours_after: 72,
    title_uz: "Jarohatlar bitadi",
    description_uz: "Og'izdagi yara va jarohatlar bita boshlaydi",
    icon: "🩹",
  },
  {
    habit_type: "nos",
    hours_after: 168,
    title_uz: "Tish miltigi tiklanadi",
    description_uz: "Tish miltigi yallig'lanishi sezilarli kamayadi",
    icon: "🦷",
  },
  {
    habit_type: "nos",
    hours_after: 720,
    title_uz: "Og'iz to'liq tiklanadi",
    description_uz: "Og'iz bo'shlig'i to'liq tiklanadi",
    icon: "😊",
  },
  {
    habit_type: "nos",
    hours_after: 2160,
    title_uz: "Saraton xavfi kamayadi",
    description_uz: "Og'iz bo'shlig'i saraton xavfi kamaya boshlaydi",
    icon: "🛡️",
  },
  {
    habit_type: "nos",
    hours_after: 8760,
    title_uz: "Oshqozon holati yaxshilanadi",
    description_uz: "Oshqozon va qizilo'ngach holati yaxshilanadi",
    icon: "🏆",
  },

  // Alkogol
  {
    habit_type: "alkogol",
    hours_after: 24,
    title_uz: "Qon shakari normallashadi",
    description_uz: "Qondagi shakar darajasi normallashadi",
    icon: "🩸",
  },
  {
    habit_type: "alkogol",
    hours_after: 72,
    title_uz: "Detoksifikatsiya tugaydi",
    description_uz: "Detoksifikatsiya jarayoni tugaydi",
    icon: "🧹",
  },
  {
    habit_type: "alkogol",
    hours_after: 168,
    title_uz: "Uyqu yaxshilanadi",
    description_uz: "Uyqu sifati sezilarli yaxshilanadi",
    icon: "😴",
  },
  {
    habit_type: "alkogol",
    hours_after: 720,
    title_uz: "Jigar tiklana boshlaydi",
    description_uz: "Jigar yog'lanishi kamaya boshlaydi",
    icon: "🫀",
  },
  {
    habit_type: "alkogol",
    hours_after: 2160,
    title_uz: "Qon bosimi normallashadi",
    description_uz: "Qon bosimi normallashadi",
    icon: "💓",
  },
  {
    habit_type: "alkogol",
    hours_after: 4380,
    title_uz: "Jigar hujayralari tiklanadi",
    description_uz: "Jigar hujayralari tiklanadi",
    icon: "🫀",
  },
  {
    habit_type: "alkogol",
    hours_after: 8760,
    title_uz: "Jigar kasalligi xavfi kamayadi",
    description_uz: "Jigar kasalligi xavfi sezilarli kamayadi",
    icon: "🏆",
  },
];
