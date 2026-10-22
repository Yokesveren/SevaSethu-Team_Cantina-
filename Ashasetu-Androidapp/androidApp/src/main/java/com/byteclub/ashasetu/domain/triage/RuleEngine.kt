package com.byteclub.ashasetu.domain.triage

import com.byteclub.ashasetu.data.local.entity.Patient
import kotlin.math.min

object RuleEngine {

    fun evaluate(
        patient: Patient?,
        symptoms: List<SymptomRule>,
        bpSystolic: Int?,
        bpDiastolic: Int?,
        heartRateBpm: Int?,
        spo2Percent: Int?,
        tempCelsius: Float?,
        bloodSugar: Int?,
        fetalHeartRate: Int?,
        hemoglobin: Float?
    ): TriageResult? {
        val hasVitalsInput = bpSystolic != null || bpDiastolic != null || heartRateBpm != null || spo2Percent != null ||
                tempCelsius != null || fetalHeartRate != null || hemoglobin != null
        val hasSymptomInput = symptoms.isNotEmpty()

        if (!hasVitalsInput && !hasSymptomInput) {
            return null
        }

        val tempF = tempCelsius?.let { (it * 9f / 5f) + 32f }

        val detectedNames = symptoms.map { it.canonicalName }
        var highestRisk = RiskBand.GREEN
        var primarySpecialty = "General Outpatient"
        var recommendedFacility = "PHC"

        // Clinical Vitals Risk Thresholds
        val isCriticalHypertension = (bpSystolic != null && bpSystolic >= 160) || (bpDiastolic != null && bpDiastolic >= 110)
        val isHypotensionCrisis = (bpSystolic != null && bpSystolic < 90)
        val isCriticalHypoxia = spo2Percent != null && spo2Percent < 90
        val isSevereAnemia = hemoglobin != null && hemoglobin < 7.0f
        val isFetalDistress = patient?.isPregnant == true && fetalHeartRate != null && (fetalHeartRate < 110 || fetalHeartRate > 160)
        val isExtremePulse = heartRateBpm != null && (heartRateBpm > 120 || heartRateBpm < 50)
        val isHighFever = tempCelsius != null && tempCelsius >= 38.9f // ~102°F

        val hasRedSymptom = symptoms.any { it.defaultRisk == RiskBand.RED }

        // Count severe and moderate factors to calculate precise Priority Score
        var severeFactorCount = 0
        var moderateFactorCount = 0

        if (isCriticalHypertension) severeFactorCount++
        if (isHypotensionCrisis) severeFactorCount++
        if (isCriticalHypoxia) severeFactorCount++
        if (isSevereAnemia) severeFactorCount++
        if (isFetalDistress) severeFactorCount++
        if (isExtremePulse) severeFactorCount++
        if (isHighFever) severeFactorCount++
        symptoms.forEach {
            if (it.defaultRisk == RiskBand.RED) severeFactorCount++
            else if (it.defaultRisk == RiskBand.YELLOW) moderateFactorCount++
        }

        val isElevatedBP = (bpSystolic != null && bpSystolic in 140..159) || (bpDiastolic != null && bpDiastolic in 90..109)
        val isMildHypoxia = spo2Percent != null && spo2Percent in 90..94
        val isModerateAnemia = hemoglobin != null && hemoglobin in 7.0f..9.9f
        val isModerateFever = tempCelsius != null && tempCelsius in 38.0f..38.8f
        val isModeratePulse = heartRateBpm != null && heartRateBpm in 100..120

        if (isElevatedBP) moderateFactorCount++
        if (isMildHypoxia) moderateFactorCount++
        if (isModerateAnemia) moderateFactorCount++
        if (isModerateFever) moderateFactorCount++
        if (isModeratePulse) moderateFactorCount++

        val hasYellowSymptom = symptoms.any { it.defaultRisk == RiskBand.YELLOW }

        val priorityScore: Int

        if (severeFactorCount > 0 || hasRedSymptom) {
            highestRisk = RiskBand.RED
            recommendedFacility = "DH / Trauma Centre"

            val redSymptom = symptoms.firstOrNull { it.defaultRisk == RiskBand.RED }
            primarySpecialty = when {
                patient?.isPregnant == true || isFetalDistress || redSymptom?.specialty?.contains("Obstetrics") == true -> "Obstetrics & Gynecology Emergency"
                isCriticalHypoxia || redSymptom?.specialty?.contains("Cardiology") == true -> "Cardiology / Emergency"
                redSymptom?.specialty?.contains("Neurology") == true -> "Neurology Emergency"
                else -> redSymptom?.specialty ?: "Emergency Medicine"
            }

            // RED Priority Score: 85 to 100
            priorityScore = min(100, 85 + (severeFactorCount * 3) + (moderateFactorCount * 1))
        } else if (moderateFactorCount > 0 || hasYellowSymptom) {
            highestRisk = RiskBand.YELLOW
            recommendedFacility = "SDH / CHC"

            val yellowSymptom = symptoms.firstOrNull { it.defaultRisk == RiskBand.YELLOW }
            primarySpecialty = yellowSymptom?.specialty ?: "General Internal Medicine"

            // YELLOW Priority Score: 50 to 84
            priorityScore = min(84, 50 + (moderateFactorCount * 6))
        } else {
            highestRisk = RiskBand.GREEN
            recommendedFacility = "PHC Sub-Centre"
            primarySpecialty = "General Outpatient"

            // GREEN Priority Score: strictly in range 10-19 (below 20) for no/minimal symptom patients
            val baseScore = 10 + min(9, symptoms.size * 2)
            priorityScore = baseScore.coerceIn(10, 19)
        }

        // Generate AI Clinical Assessment
        val summaryBuilder = StringBuilder()
        if (patient != null) {
            summaryBuilder.append("${patient.name} (${patient.age}y, ${patient.gender})")
            if (patient.isPregnant) summaryBuilder.append(" [Pregnant Trimester ${patient.trimester}]")
            summaryBuilder.append(": ")
        }

        if (detectedNames.isNotEmpty()) {
            summaryBuilder.append("Symptom Conditions: ${detectedNames.joinToString(", ")}. ")
        }

        val vitalsList = mutableListOf<String>()
        if (bpSystolic != null && bpDiastolic != null) vitalsList.add("BP $bpSystolic/$bpDiastolic mmHg")
        if (spo2Percent != null) vitalsList.add("SpO2 $spo2Percent%")
        if (heartRateBpm != null) vitalsList.add("Pulse $heartRateBpm bpm")
        if (tempCelsius != null) vitalsList.add("Temp ${String.format("%.1f", tempCelsius)}°C")
        if (hemoglobin != null) vitalsList.add("Hb ${String.format("%.1f", hemoglobin)} g/dL")
        if (fetalHeartRate != null) vitalsList.add("FHR $fetalHeartRate bpm")

        if (vitalsList.isNotEmpty()) {
            summaryBuilder.append("Vitals: ${vitalsList.joinToString(", ")}.")
        }

        val actionAdvice = when (highestRisk) {
            RiskBand.RED -> "CRITICAL (Priority Score $priorityScore/100): Immediate referral to $recommendedFacility ($primarySpecialty). Dispatch 108 Ambulance."
            RiskBand.YELLOW -> "URGENT (Priority Score $priorityScore/100): Refer to $recommendedFacility within 24 hours for evaluation."
            RiskBand.GREEN -> "ROUTINE (Priority Score $priorityScore/100): Provide standard PHC primary care and monitoring."
        }

        return TriageResult(
            riskBand = highestRisk,
            priorityScore = priorityScore,
            primarySpecialty = primarySpecialty,
            detectedSymptoms = detectedNames,
            aiSummary = summaryBuilder.toString(),
            actionAdvice = actionAdvice,
            recommendedFacilityType = recommendedFacility
        )
    }
}
