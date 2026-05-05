HAM10000_CLASSES = {
    "akiec": {
        "code": "akiec",
        "name_en": "Actinic Keratoses / Intraepithelial Carcinoma",
        "name_uz": "Aktinik keratoz / Intraepitelial karsinoma",
        "name_ru": "Актинический кератоз",
        "icd10": "L57.0",
        "risk_level": "high",
        "color": "#FF6B35",
        "description_uz": "Quyosh nuri ta'siridan rivojlanadigan teri kasalligi. Kansерга aylanish xavfi mavjud.",
    },
    "bcc": {
        "code": "bcc",
        "name_en": "Basal Cell Carcinoma",
        "name_uz": "Bazal hujayra karsinomasi",
        "name_ru": "Базально-клеточная карцинома",
        "icd10": "C44",
        "risk_level": "high",
        "color": "#FF4444",
        "description_uz": "Eng keng tarqalgan teri saratoni turi. Erta aniqlansa, davolanishi yaxshi.",
    },
    "bkl": {
        "code": "bkl",
        "name_en": "Benign Keratosis-like Lesions",
        "name_uz": "Xavfsiz keratoz-o'xshash shikastlanishlar",
        "name_ru": "Доброкачественные кератозоподобные поражения",
        "icd10": "L82",
        "risk_level": "low",
        "color": "#4CAF50",
        "description_uz": "Xavfsiz teri o'smalari. Odatda davolash talab qilinmaydi.",
    },
    "df": {
        "code": "df",
        "name_en": "Dermatofibroma",
        "name_uz": "Dermatofibroma",
        "name_ru": "Дерматофиброма",
        "icd10": "D23",
        "risk_level": "low",
        "color": "#2196F3",
        "description_uz": "Xavfsiz biriktiruvchi to'qima o'smasi. Ko'pincha oyoqlarda uchraydi.",
    },
    "mel": {
        "code": "mel",
        "name_en": "Melanoma",
        "name_uz": "Melanoma",
        "name_ru": "Меланома",
        "icd10": "C43",
        "risk_level": "critical",
        "color": "#9C27B0",
        "description_uz": "XAVFLI: Eng xatarli teri saratoni. Darhol mutaxassisga murojaat qiling!",
    },
    "nv": {
        "code": "nv",
        "name_en": "Melanocytic Nevi (Moles)",
        "name_uz": "Melanositar nevus (xollar)",
        "name_ru": "Меланоцитарные невусы (родинки)",
        "icd10": "D22",
        "risk_level": "low",
        "color": "#8BC34A",
        "description_uz": "Oddiy xollar. Odatda xavfsiz, lekin o'zgarishlar kuzatilishi lozim.",
    },
    "vasc": {
        "code": "vasc",
        "name_en": "Vascular Lesions",
        "name_uz": "Qon-tomir shikastlanishlari",
        "name_ru": "Сосудистые поражения",
        "icd10": "D18",
        "risk_level": "medium",
        "color": "#F44336",
        "description_uz": "Qon tomirlar bilan bog'liq teri o'zgarishlari.",
    },
}

CLASS_ORDER = ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"]

RISK_COLORS = {
    "critical": "#9C27B0",
    "high": "#FF4444",
    "medium": "#FF9800",
    "low": "#4CAF50",
}

RISK_LABELS_UZ = {
    "critical": "JUDA XAVFLI — Darhol shifokorga murojaat qiling!",
    "high": "Xavfli — Mutaxassisga ko'rining",
    "medium": "O'rtacha xavf — Nazorat qilish lozim",
    "low": "Past xavf — Kuzatib boring",
}
