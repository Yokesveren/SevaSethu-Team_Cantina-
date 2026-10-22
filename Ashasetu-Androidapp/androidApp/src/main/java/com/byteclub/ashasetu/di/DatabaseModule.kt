package com.byteclub.ashasetu.di

import android.content.Context
import androidx.room.Room
import com.byteclub.ashasetu.data.local.AppDatabase
import com.byteclub.ashasetu.data.local.dao.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import net.sqlcipher.database.SupportFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        val passphrase = "AshaSetuEncryptedKey#2025!".toByteArray()
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
