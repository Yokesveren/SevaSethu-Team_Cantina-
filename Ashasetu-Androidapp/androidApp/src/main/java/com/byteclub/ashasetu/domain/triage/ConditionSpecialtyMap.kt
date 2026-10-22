package com.byteclub.ashasetu.domain.triage

data class SymptomRule(
    val canonicalName: String,
    val specialty: String,
    val defaultRisk: RiskBand,
    val keywords: List<String>
)

object ConditionSpecialtyMap {
    val rules = listOf(
        SymptomRule(
            canonicalName = "Heavy Vaginal Bleeding",
            specialty = "Obstetrics & Gynecology",
            defaultRisk = RiskBand.RED,
            keywords = listOf("bleeding", "blood", "raktsrav", "raktasrava", "phatna", "srav", "मासिक", "रक्तस्त्राव", "இரத்தப்போக்கு", "ரத்தப்போக்கு", "இரத்தம்")
        ),
        SymptomRule(
            canonicalName = "Severe Abdominal / Pelvic Pain",
            specialty = "Obstetrics & Gynecology",
            defaultRisk = RiskBand.RED,
            keywords = listOf("severe pain", "pet dard", "stomach pain", "pait dard", "पोटदुखी", "पे पोट दर्द", "வயிறு வலி", "அடிவயிறு வலி", "வயிறு")
        ),
        SymptomRule(
            canonicalName = "Severe Chest Pain / Pressure",
            specialty = "Cardiology",
            defaultRisk = RiskBand.RED,
            keywords = listOf("chest pain", "chhati me dard", "chhati dard", "छातीत दुखणे", "heart pain", "pressure in chest", "நெஞ்சு வலி", "மார்பு வலி", "நெஞ்சு")
        ),
        SymptomRule(
            canonicalName = "Severe Breathlessness",
            specialty = "Cardiology / Pulmonology",
            defaultRisk = RiskBand.RED,
            keywords = listOf("breathlessness", "saans phulna", "shortness of breath", "saas me taklif", "दम लागणे", "श्वास", "மூச்சுத் திணறல்", "மூச்சு வாங்குதல்", "மூச்சு")
        ),
        SymptomRule(
            canonicalName = "Fainting / Unconsciousness",
            specialty = "Neurology / Emergency",
            defaultRisk = RiskBand.RED,
            keywords = listOf("fainting", "unconscious", "behosh", "chakkar aana", "सुन्न", "बेहोषी", "மயக்கம்", "மயங்கி விழுதல்")
        ),
        SymptomRule(
            canonicalName = "Convulsions / Seizures",
            specialty = "Neurology",
            defaultRisk = RiskBand.RED,
            keywords = listOf("seizure", "convulsions", "mirgi", "zhatke", "झटके", "मिरगी", "வலிப்பு", "ஜுரம் வலிப்பு")
        ),
        SymptomRule(
            canonicalName = "High Fever (>102 F)",
            specialty = "General Medicine / Pediatrics",
            defaultRisk = RiskBand.YELLOW,
            keywords = listOf("fever", "bukhar", "taap", "ताप", "बुखार", "high temperature", "காய்ச்சல்", "அதிக காய்ச்சல்")
        ),
        SymptomRule(
            canonicalName = "Persistent Vomiting",
            specialty = "General Medicine",
            defaultRisk = RiskBand.YELLOW,
            keywords = listOf("vomiting", "ulti", "vomat", "उलटी", "उलट्या", "வாந்தி", "தொடர் வாந்தி")
        ),
        SymptomRule(
            canonicalName = "Swelling in Feet / Face (Edema)",
            specialty = "Obstetrics / Nephrology",
            defaultRisk = RiskBand.YELLOW,
            keywords = listOf("swelling", "sujan", "sooj", "सूज", "पाय सुजणे", "வீக்கம்", "கால் வீக்கம்")
        ),
        SymptomRule(
            canonicalName = "Mild Headache & Fatigue",
            specialty = "General Medicine",
            defaultRisk = RiskBand.GREEN,
            keywords = listOf("headache", "sir dard", "thakan", "डोकेदुखी", "थकवा", "தலைவலி", "தலை பாரம்", "சோர்வு")
        )
    )
}
