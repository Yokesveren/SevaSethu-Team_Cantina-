package com.byteclub.ashasetu.domain.nlp

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class VitalsAndSymptomExtractorTest {

    @Test
    fun testEnglishSpeechExtraction() {
        val transcript = "The patient fell down and his bp is 110, spo2 is 99, pulse is 80"

        val symptoms = SymptomExtractor.extractSymptomsFromText(transcript)
        val vitals = VitalsExtractor.extractVitalsFromText(transcript)

        assertTrue(symptoms.any { it.canonicalName == "Accidental Fall / Acute Trauma Context" })
        assertEquals("110", vitals.bpSystolic)
        assertEquals("99", vitals.spo2Percent)
        assertEquals("80", vitals.heartRateBpm)
    }

    @Test
    fun testHindiSpeechExtraction() {
        val transcript = "मरीज़ गिर गया और उसका बीपी 110/70, एसपीओ2 99, पल्स 80 है"

        val symptoms = SymptomExtractor.extractSymptomsFromText(transcript)
        val vitals = VitalsExtractor.extractVitalsFromText(transcript)

        assertTrue(symptoms.any { it.canonicalName == "Accidental Fall / Acute Trauma Context" })
        assertEquals("110", vitals.bpSystolic)
        assertEquals("70", vitals.bpDiastolic)
        assertEquals("99", vitals.spo2Percent)
        assertEquals("80", vitals.heartRateBpm)
    }

    @Test
    fun testMarathiSpeechExtraction() {
        val transcript = "रुग्ण खाली पडला आणि त्याचा बीपी 110, एसपीओ2 99, पल्स 80 आहे"

        val symptoms = SymptomExtractor.extractSymptomsFromText(transcript)
        val vitals = VitalsExtractor.extractVitalsFromText(transcript)

        assertTrue(symptoms.any { it.canonicalName == "Accidental Fall / Acute Trauma Context" })
        assertEquals("110", vitals.bpSystolic)
        assertEquals("99", vitals.spo2Percent)
        assertEquals("80", vitals.heartRateBpm)
    }

    @Test
    fun testTamilSpeechExtraction() {
        val transcript = "நோயாளி கீழே விழுந்தார், பிபி 110, எஸ்பிஓ2 99, பல்ஸ் 80"

        val symptoms = SymptomExtractor.extractSymptomsFromText(transcript)
        val vitals = VitalsExtractor.extractVitalsFromText(transcript)

        assertTrue(symptoms.any { it.canonicalName == "Accidental Fall / Acute Trauma Context" })
        assertEquals("110", vitals.bpSystolic)
        assertEquals("99", vitals.spo2Percent)
        assertEquals("80", vitals.heartRateBpm)
    }

    @Test
    fun testDevanagariDigitsExtraction() {
        val transcript = "बीपी ११०, एसपीओ२ ९९, पल्स ८०"

        val vitals = VitalsExtractor.extractVitalsFromText(transcript)

        assertEquals("110", vitals.bpSystolic)
        assertEquals("99", vitals.spo2Percent)
        assertEquals("80", vitals.heartRateBpm)
    }

    @Test
    fun testSpeechWithoutVitalsDoesNotFillVitals() {
        val transcript = "The patient fell down"

        val symptoms = SymptomExtractor.extractSymptomsFromText(transcript)
        val vitals = VitalsExtractor.extractVitalsFromText(transcript)

        assertTrue(symptoms.any { it.canonicalName == "Accidental Fall / Acute Trauma Context" })
        assertEquals(null, vitals.bpSystolic)
        assertEquals(null, vitals.spo2Percent)
        assertEquals(null, vitals.heartRateBpm)
    }
}
