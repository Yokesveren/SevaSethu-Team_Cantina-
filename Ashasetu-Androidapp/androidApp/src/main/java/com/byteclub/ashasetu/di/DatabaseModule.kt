package com.byteclub.ashasetu.di

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import androidx.room.Room
import com.byteclub.ashasetu.data.local.AppDatabase
import com.byteclub.ashasetu.data.local.dao.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import net.sqlcipher.database.SupportFactory
import java.security.KeyStore
import java.security.SecureRandom
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    private const val KEY_ALIAS = "AshaSetuVaultAlias"
    private const val PREFS_NAME = "asha_setu_secure_vault"
    private const val KEY_PASSPHRASE_HEX = "encrypted_db_key_hex"

    private fun getOrCreatePassphrase(context: Context): ByteArray {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val savedHex = prefs.getString(KEY_PASSPHRASE_HEX, null)
        if (savedHex != null) {
            return hexToBytes(savedHex)
        }

        val dbFile = context.getDatabasePath("asha_setu_encrypted.db")
        val passphrase = if (dbFile.exists()) {
            "AshaSetuEncryptedKey#2025!".toByteArray()
        } else {
            generateSecurePassphrase()
        }

        val hex = bytesToHex(passphrase)
        prefs.edit().putString(KEY_PASSPHRASE_HEX, hex).apply()
        return passphrase
    }

    private fun generateSecurePassphrase(): ByteArray {
        return try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
            if (!keyStore.containsAlias(KEY_ALIAS)) {
                val keyGenerator = KeyGenerator.getInstance(
                    KeyProperties.KEY_ALGORITHM_AES,
                    "AndroidKeyStore"
                )
                val keySpec = KeyGenParameterSpec.Builder(
                    KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
                )
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .setKeySize(256)
                    .build()
                keyGenerator.init(keySpec)
                keyGenerator.generateKey()
            }
            val secretKey = keyStore.getKey(KEY_ALIAS, null) as SecretKey
            secretKey.encoded ?: random32Bytes()
        } catch (e: Exception) {
            random32Bytes()
        }
    }

    private fun random32Bytes(): ByteArray {
        val bytes = ByteArray(32)
        SecureRandom().nextBytes(bytes)
        return bytes
    }

    private fun bytesToHex(bytes: ByteArray): String {
        return bytes.joinToString("") { "%02x".format(it) }
    }

    private fun hexToBytes(hex: String): ByteArray {
        val result = ByteArray(hex.length / 2)
        for (i in result.indices) {
            result[i] = hex.substring(i * 2, i * 2 + 2).toInt(16).toByte()
        }
        return result
    }

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        val passphrase = getOrCreatePassphrase(context)
        val factory = SupportFactory(passphrase)

        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "asha_setu_encrypted.db"
        )
            .openHelperFactory(factory)
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    fun providePatientDao(database: AppDatabase): PatientDao = database.patientDao()

    @Provides
    fun provideTriageDao(database: AppDatabase): TriageDao = database.triageDao()

    @Provides
    fun provideReferralDao(database: AppDatabase): ReferralDao = database.referralDao()

    @Provides
    fun provideSyncQueueDao(database: AppDatabase): SyncQueueDao = database.syncQueueDao()

    @Provides
    fun provideFollowUpDao(database: AppDatabase): FollowUpDao = database.followUpDao()

    @Provides
    fun provideFacilityDao(database: AppDatabase): FacilityDao = database.facilityDao()

    @Provides
    fun provideActivityLogDao(database: AppDatabase): ActivityLogDao = database.activityLogDao()
}
