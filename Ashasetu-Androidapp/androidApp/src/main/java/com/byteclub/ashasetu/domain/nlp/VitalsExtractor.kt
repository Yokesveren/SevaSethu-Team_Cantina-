package com.byteclub.ashasetu.domain.nlp

data class ExtractedVitals(
    val bpSystolic: String? = null,
    val bpDiastolic: String? = null,
    val spo2Percent: String? = null,
    val heartRateBpm: String? = null,
    val tempF: String? = null,
    val respRatePerMin: String? = null,
    val bloodSugar: String? = null,
    val fetalHeartRate: String? = null,
    val hemoglobin: String? = null
)

object VitalsExtractor {

    // Helper to convert Devanagari and Tamil digits to standard ASCII digits
    private fun normalizeDigits(text: String): String {
        val sb = StringBuilder()
        for (ch in text) {
            when (ch) {
                // Devanagari digits ०-९
                in '०'..'९' -> sb.append((ch - '०' + '0'.code).toChar())
                // Tamil digits ௦-௯
                in '௦'..'௯' -> sb.append((ch - '௦' + '0'.code).toChar())
                else -> sb.append(ch)
            }
        }
        return sb.toString()
    }

    fun extractVitalsFromText(rawText: String): ExtractedVitals {
        if (rawText.isBlank()) return ExtractedVitals()

        val text = normalizeDigits(rawText.lowercase())

        var bpSys: String? = null
        var bpDia: String? = null
        var spo2: String? = null
        var pulse: String? = null
        var temp: String? = null
        var respRate: String? = null
        var sugar: String? = null
        var fhr: String? = null
        var hb: String? = null

        // 1. Blood Pressure Extraction
        // Look for BP keyword with slash/by/hyphen "BP 110/70", "BP 120 by 80"
        val bpSlashRegex = Regex("""(?i)(?:bp|blood pressure|b\.p\.|बीपी|बी पी|ब्लड प्रेशर|रक्तचाप|रक्तदाब|பிபி|பி\.பி\.)\s*[:=-]?\s*(\d{2,3})\s*(?:/|by|-)\s*(\d{2,3})""")
        val bpSlashMatch = bpSlashRegex.find(text)
        if (bpSlashMatch != null) {
            val sys = bpSlashMatch.groupValues[1].toIntOrNull()
            val dia = bpSlashMatch.groupValues[2].toIntOrNull()
            if (sys != null && sys in 60..250 && dia != null && dia in 30..150) {
                bpSys = sys.toString()
                bpDia = dia.toString()
            }
        }

        // Look for standalone slash format "120/80"
        if (bpSys == null) {
            val standaloneSlashBpRegex = Regex("""\b(\d{2,3})\s*/\s*(\d{2,3})\b""")
            val standaloneMatch = standaloneSlashBpRegex.find(text)
            if (standaloneMatch != null) {
                val sys = standaloneMatch.groupValues[1].toIntOrNull()
                val dia = standaloneMatch.groupValues[2].toIntOrNull()
                if (sys != null && sys in 60..250 && dia != null && dia in 30..150) {
                    bpSys = sys.toString()
                    bpDia = dia.toString()
                }
            }
        }

        // If no slash/combined BP, look for BP keyword followed by number(s)
        if (bpSys == null) {
            val bpKeywordRegex = Regex("""(?i)(?:bp|blood pressure|b\.p\.|बीपी|बी पी|ब्लड प्रेशर|रक्तचाप|रक्तदाब|பிபி|பி\.பி\.)\s*([a-z\s:अ-हा-्\u0B80-\u0BFF]*?)\s*(\d{2,3})(?:\s*[\s,/-]\s*(\d{2,3}))?""")
            val bpMatch = bpKeywordRegex.find(text)
            if (bpMatch != null) {
                val val1 = bpMatch.groupValues[2].toIntOrNull()
                val val2 = bpMatch.groupValues[3].toIntOrNull()
                if (val1 != null && val1 in 60..250) {
                    bpSys = val1.toString()
                    if (val2 != null && val2 in 30..150) {
                        bpDia = val2.toString()
                    }
                }
            }
        }

        // 2. SpO2 / Oxygen Extraction
        val spo2Regex = Regex("""(?i)(?:spo2|sp o2|sp02|oxygen|o2|ऑक्सीजन|ऑक्सिजन|एसपीओ२|एसपीओ2|एस पी ओ 2|எஸ்பிஓ2|எஸ்\.பி\.ஓ2|ஆக்ஸிஜன்|ஆக்சிஜன்)\s*([a-z\s:अ-हा-्\u0B80-\u0BFF]*?)\s*(\d{2,3})\s*%?""")
        val spo2Match = spo2Regex.find(text)
        if (spo2Match != null) {
            val valSpo2 = spo2Match.groupValues[2].toIntOrNull()
            if (valSpo2 != null && valSpo2 in 50..100) {
                spo2 = valSpo2.toString()
            }
        } else {
            val percentRegex = Regex("""(\d{2,3})\s*%""")
            val percentMatch = percentRegex.find(text)
            if (percentMatch != null) {
                val valSpo2 = percentMatch.groupValues[1].toIntOrNull()
                if (valSpo2 != null && valSpo2 in 50..100) {
                    spo2 = valSpo2.toString()
                }
            }
        }

        // 3. Pulse / Heart Rate Extraction
        val pulseRegex = Regex("""(?i)(?:pulse|bpm|heart rate|heartrate|pulse rate|पल्स|हार्ट रेट|धड़कन|नाडी|हृदयगती|பல்ஸ்|நாடித் துடிப்பு|இதயத் துடிப்பு)\s*([a-z\s:अ-हा-्\u0B80-\u0BFF]*?)\s*(\d{2,3})""")
        val pulseMatch = pulseRegex.find(text)
        if (pulseMatch != null) {
            val valPulse = pulseMatch.groupValues[2].toIntOrNull()
            if (valPulse != null && valPulse in 30..220) {
                pulse = valPulse.toString()
            }
        }

        // 4. Temperature Extraction
        val tempRegex = Regex("""(?i)(?:temp|temperature|fever|तापमान|बुखार|टेंपरेचर|ताप|காய்ச்சல்|வெப்பநிலை|டெம்பரேச்சர்)\s*([a-z\s:अ-हा-्\u0B80-\u0BFF]*?)\s*(\d{2,3}(?:\.\d)?)""")
        val tempMatch = tempRegex.find(text)
        if (tempMatch != null) {
            val valTemp = tempMatch.groupValues[2].toFloatOrNull()
            if (valTemp != null && (valTemp in 90.0f..110.0f || valTemp in 34.0f..43.0f)) {
                temp = tempMatch.groupValues[2]
            }
        }

        // 5. Hemoglobin (Hb) Extraction
        val hbRegex = Regex("""(?i)(?:hb|hemoglobin|haemoglobin|एचबी|हीमोग्लोबिन|हिमोग्लोबिन|எச்பி|ஹீமோகுளோபின்)\s*([a-z\s:अ-हा-्\u0B80-\u0BFF]*?)\s*(\d{1,2}(?:\.\d)?)""")
        val hbMatch = hbRegex.find(text)
        if (hbMatch != null) {
            val valHb = hbMatch.groupValues[2].toFloatOrNull()
            if (valHb != null && valHb in 3.0f..22.0f) {
                hb = hbMatch.groupValues[2]
            }
        }

        // 6. Fetal Heart Rate (FHR) Extraction
        val fhrRegex = Regex("""(?i)(?:fhr|fetal heart rate|fetal pulse|एफएचआर|गर्भ धड़कन|गर्भाची धडधड|எஃப்எச்ஆர்|கருவின் இதயத் துடிப்பு)\s*([a-z\s:अ-हा-्\u0B80-\u0BFF]*?)\s*(\d{2,3})""")
        val fhrMatch = fhrRegex.find(text)
        if (fhrMatch != null) {
            val valFhr = fhrMatch.groupValues[2].toIntOrNull()
            if (valFhr != null && valFhr in 80..220) {
                fhr = valFhr.toString()
            }
        }

        // 7. Blood Sugar Extraction
        val sugarRegex = Regex("""(?i)(?:sugar|blood sugar|glucose|शुगर|ब्लड शुगर|साखर|சர்க்கரை)\s*([a-z\s:अ-हा-्\u0B80-\u0BFF]*?)\s*(\d{2,3})""")
        val sugarMatch = sugarRegex.find(text)
        if (sugarMatch != null) {
            val valSugar = sugarMatch.groupValues[2].toIntOrNull()
            if (valSugar != null && valSugar in 40..600) {
                sugar = valSugar.toString()
            }
        }

        // 8. Respiratory Rate Extraction
        val respRegex = Regex("""(?i)(?:respiratory rate|resp rate|rr|श्वसन दर)\s*([a-z\s:अ-हा-्\u0B80-\u0BFF]*?)\s*(\d{2})""")
        val respMatch = respRegex.find(text)
        if (respMatch != null) {
            val valResp = respMatch.groupValues[2].toIntOrNull()
            if (valResp != null && valResp in 8..60) {
                respRate = valResp.toString()
            }
        }

        return ExtractedVitals(
            bpSystolic = bpSys,
            bpDiastolic = bpDia,
            spo2Percent = spo2,
            heartRateBpm = pulse,
            tempF = temp,
            respRatePerMin = respRate,
            bloodSugar = sugar,
            fetalHeartRate = fhr,
            hemoglobin = hb
        )
    }
}
