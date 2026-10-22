package com.byteclub.ashasetu.domain.nlp

import com.byteclub.ashasetu.domain.triage.ConditionSpecialtyMap
import com.byteclub.ashasetu.domain.triage.RiskBand
import com.byteclub.ashasetu.domain.triage.SymptomRule

object SymptomExtractor {

    // Multilingual Mechanism / Trauma Verbs & Injury Keywords
    private val traumaKeywords = listOf(
        // English
        "fell", "fall", "fallen", "injury", "injured", "hit", "hurt", "trauma", "accident", "wound",
        "pain", "damage", "broken", "fracture", "cut", "bleeding", "struck", "collision", "dropped", "impact",
        // Hindi
        "गिर", "गया", "गए", "चोट", "दर्द", "एक्सीडेंट", "जख्म", "टूटा", "लगा", "हादसा", "घाव", "खून",
        // Marathi
        "पडला", "पडली", "दुखापत", "लागली", "अपघात", "जखम", "दुखणे", "पडले", "मार", "रक्त",
        // Tamil
        "விழுந்து", "விழுந்தார்", "காயம்", "அடிபட்டது", "வலி", "விபத்து", "முறிவு", "இரத்தம்", "அடி", "காயமடைந்து"
    )

    // Body Part Vocabulary Map across English, Hindi, Marathi, and Tamil
    private val chestKeywords = listOf(
        "chest", "ribs", "breast", "heart", "thoracic",
        "सीने", "छाती", "दिल",
        "छाती", "छातीत", "हृदय",
        "நெஞ்சு", "மார்பு", "இதயம்"
    )

    private val headKeywords = listOf(
        "head", "brain", "skull", "face", "forehead",
        "सर", "सिर", "माथा",
        "डोके", "डोक्यात",
        "தலை", "தலையில்", "மூளை", "முகம்"
    )

    private val abdomenKeywords = listOf(
        "abdomen", "stomach", "belly", "waist", "pelvis", "womb",
        "पेट", "कोख",
        "पोट", "पोटात",
        "வயிறு", "அடிவயிறு", "இடுப்பு"
    )

    private val spineKeywords = listOf(
        "spine", "back", "neck", "spinal",
        "पीठ", "गर्दन",
        "पाठीत", "मान",
        "முதுகு", "கழுத்து", "தண்டுவடம்"
    )

    private val limbKeywords = listOf(
        "leg", "arm", "hand", "foot", "knee", "bone", "fracture",
        "पैर", "हाथ", "हड्डी",
        "पाय", "हात", "हाड",
        "கால்", "கை", "எலும்பு"
    )

    private val maternalKeywords = listOf(
        "pregnant", "trimester", "anc", "delivery", "fetal",
        "गर्भवती", "गर्भ",
        "गरोदर",
        "கர்ப்பிணி", "கர்ப்பம்", "குழந்தை"
    )

    private val normalKeywords = listOf(
        "normal", "no symptoms", "less symptoms", "fine", "healthy", "fit", "good", "no issue",
        "सामान्य", "नॉर्मल", "काही त्रास नाही", "சாதாரண"
    )

    fun extractSymptomsFromText(text: String): List<SymptomRule> {
        if (text.isBlank()) return emptyList()
        val lowerText = text.lowercase()
        val matchedRules = mutableListOf<SymptomRule>()

        // 1. Direct Rule Matches from ConditionSpecialtyMap
        ConditionSpecialtyMap.rules.forEach { rule ->
            if (rule.keywords.any { keyword -> lowerText.contains(keyword.lowercase()) }) {
                matchedRules.add(rule)
            }
        }

        // 2. Multilingual Semantic & Contextual Injury Analysis
        val hasTraumaContext = traumaKeywords.any { lowerText.contains(it.lowercase()) }

        if (hasTraumaContext) {
            val countBeforeTrauma = matchedRules.size

            // Check Chest Trauma Context
            if (chestKeywords.any { lowerText.contains(it.lowercase()) }) {
                matchedRules.add(
                    SymptomRule(
                        canonicalName = "Chest Injury / Thoracic Trauma",
                        specialty = "Cardiology / Trauma Emergency",
                        defaultRisk = RiskBand.RED,
                        keywords = chestKeywords
                    )
                )
            }

            // Check Head Trauma Context
            if (headKeywords.any { lowerText.contains(it.lowercase()) }) {
                matchedRules.add(
                    SymptomRule(
                        canonicalName = "Head Trauma / Traumatic Brain Injury",
                        specialty = "Neurology / Trauma Emergency",
                        defaultRisk = RiskBand.RED,
                        keywords = headKeywords
                    )
                )
            }

            // Check Abdominal Trauma Context
            if (abdomenKeywords.any { lowerText.contains(it.lowercase()) }) {
                matchedRules.add(
                    SymptomRule(
                        canonicalName = "Abdominal / Pelvic Trauma",
                        specialty = "General Surgery / Emergency",
                        defaultRisk = RiskBand.RED,
                        keywords = abdomenKeywords
                    )
                )
            }

            // Check Spinal / Neck Trauma Context
            if (spineKeywords.any { lowerText.contains(it.lowercase()) }) {
                matchedRules.add(
                    SymptomRule(
                        canonicalName = "Spinal / Cervical Trauma",
                        specialty = "Orthopedics / Trauma Emergency",
                        defaultRisk = RiskBand.RED,
                        keywords = spineKeywords
                    )
                )
            }

            // Check Extremity / Bone Trauma Context
            if (limbKeywords.any { lowerText.contains(it.lowercase()) }) {
                matchedRules.add(
                    SymptomRule(
                        canonicalName = "Extremity Trauma / Suspected Fracture",
                        specialty = "Orthopedics / Trauma",
                        defaultRisk = RiskBand.YELLOW,
                        keywords = limbKeywords
                    )
                )
            }

            // Generic Fall / Acute Mechanism Trauma if no specific body part was matched yet
            if (matchedRules.size == countBeforeTrauma) {
                matchedRules.add(
                    SymptomRule(
                        canonicalName = "Accidental Fall / Acute Trauma Context",
                        specialty = "Trauma Emergency",
                        defaultRisk = RiskBand.YELLOW,
                        keywords = traumaKeywords
                    )
                )
            }
        }

        // 3. Check Maternal / Pregnancy Emergency Context
        val hasMaternalContext = maternalKeywords.any { lowerText.contains(it.lowercase()) }
        if (hasMaternalContext && hasTraumaContext) {
            matchedRules.add(
                SymptomRule(
                    canonicalName = "Maternal Trauma Emergency",
                    specialty = "Obstetrics & Gynecology Emergency",
                    defaultRisk = RiskBand.RED,
                    keywords = maternalKeywords
                )
            )
        }

        // 4. Check Normal / Low Symptom Context
        val hasNormalContext = normalKeywords.any { lowerText.contains(it.lowercase()) }
        if (hasNormalContext && matchedRules.none { it.defaultRisk == RiskBand.RED || it.defaultRisk == RiskBand.YELLOW }) {
            matchedRules.add(
                SymptomRule(
                    canonicalName = "Normal / Low Symptom Observation",
                    specialty = "General Outpatient",
                    defaultRisk = RiskBand.GREEN,
                    keywords = normalKeywords
                )
            )
        }

        // Return distinct rules by canonical name
        return matchedRules.distinctBy { it.canonicalName }
    }
}
