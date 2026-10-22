package com.byteclub.ashasetu.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "facilities")
data class Facility(
    @PrimaryKey val id: String,
    val name: String,
    val facilityType: String, // "DH" (District Hospital), "SDH", "CHC", "PHC"
    val district: String,
    val specialtiesCsv: String, // e.g. "Obstetrics,Cardiology,Pediatrics,Trauma"
    val icuBedsAvailable: Int,
    val totalIcuBeds: Int,
    val oxygenAvailable: Boolean,
    val bloodBankAvailable: Boolean,
    val distanceKm: Float,
    val phone: String,
    val stalenessMinutes: Int // Age of facility data in minutes (e.g. 12 mins ago)
)
