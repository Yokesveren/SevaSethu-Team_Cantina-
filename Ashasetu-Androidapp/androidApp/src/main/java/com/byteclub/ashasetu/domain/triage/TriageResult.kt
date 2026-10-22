package com.byteclub.ashasetu.domain.triage

data class TriageResult(
    val riskBand: RiskBand,
    val priorityScore: Int, // 85-100 for RED, 50-84 for YELLOW, <50 for GREEN
    val primarySpecialty: String,
    val detectedSymptoms: List<String>,
    val aiSummary: String,
    val actionAdvice: String,
    val recommendedFacilityType: String // "DH", "SDH", "CHC", "PHC"
)
