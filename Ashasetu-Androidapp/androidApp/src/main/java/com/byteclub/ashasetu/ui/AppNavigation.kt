package com.byteclub.ashasetu.ui

import androidx.compose.runtime.Composable
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.byteclub.ashasetu.ble.WearableDataSource
import com.byteclub.ashasetu.data.repository.CloudSyncService
import com.byteclub.ashasetu.data.repository.PatientRepository
import com.byteclub.ashasetu.data.repository.ReferralRepository
import com.byteclub.ashasetu.data.repository.TriageRepository
import com.byteclub.ashasetu.domain.nlp.SpeechRecognizerManager
import com.byteclub.ashasetu.ui.dashboard.DashboardScreen
import com.byteclub.ashasetu.ui.dashboard.DashboardViewModel
import com.byteclub.ashasetu.ui.followup.FollowUpScreen
import com.byteclub.ashasetu.ui.guidelines.HealthGuidelinesScreen
import com.byteclub.ashasetu.ui.login.LoginScreen
import com.byteclub.ashasetu.ui.login.LoginViewModel
import com.byteclub.ashasetu.ui.patient.AddPatientScreen
import com.byteclub.ashasetu.ui.patient.PatientDetailScreen
import com.byteclub.ashasetu.ui.patient.PatientListScreen
import com.byteclub.ashasetu.ui.profile.ProfileScreen
import com.byteclub.ashasetu.ui.records.DoctorChatScreen
import com.byteclub.ashasetu.ui.records.RecordsScreen
import com.byteclub.ashasetu.ui.records.TriageRecordDetailScreen
import com.byteclub.ashasetu.ui.referral.ReferralScreen
import com.byteclub.ashasetu.ui.sos.SosInboxScreen
import com.byteclub.ashasetu.ui.splash.SplashScreen
import com.byteclub.ashasetu.ui.triage.TriageCaptureScreen
import com.byteclub.ashasetu.ui.triage.TriageViewModel
import com.byteclub.ashasetu.ui.wearable.WearablePairingScreen

@Composable
fun AppNavigation(
    patientRepository: PatientRepository,
    triageRepository: TriageRepository,
    referralRepository: ReferralRepository,
    wearableDataSource: WearableDataSource,
    cloudSyncService: CloudSyncService,
    speechRecognizerManager: SpeechRecognizerManager
) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = "splash"
    ) {
        composable("splash") {
            SplashScreen(
                onSplashComplete = {
                    navController.navigate("login") {
                        popUpTo("splash") { inclusive = true }
                    }
                }
            )
        }

        composable("login") {
            val loginViewModel: LoginViewModel = hiltViewModel()
            LoginScreen(
                viewModel = loginViewModel,
                onLoginSuccess = {
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }

        composable("dashboard") {
            val dashboardViewModel: DashboardViewModel = hiltViewModel()
            DashboardScreen(
                viewModel = dashboardViewModel,
                onNavigateToTriage = { navController.navigate("triage") },
                onNavigateToAddPatient = { navController.navigate("add_patient") },
                onNavigateToReferrals = { navController.navigate("referrals") },
                onNavigateToSos = { navController.navigate("sos") },
                onNavigateToWearables = { navController.navigate("wearables") },
                onNavigateToGuidelines = { navController.navigate("guidelines") },
                onNavigateToPatientDetail = { patientId ->
                    navController.navigate("patient_detail/$patientId")
                },
                onTabSelected = { tab ->
                    if (tab.route != "dashboard") {
                        navController.navigate(tab.route)
                    }
                }
            )
        }

        composable("triage") {
            val triageViewModel: TriageViewModel = hiltViewModel()
            TriageCaptureScreen(
                viewModel = triageViewModel,
                wearableDataSource = wearableDataSource,
                cloudSyncService = cloudSyncService,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToReferral = { navController.navigate("referrals") },
                onNavigateToSos = { navController.navigate("sos") }
            )
        }

        composable("referrals") {
            ReferralScreen(
                repository = referralRepository,
                cloudSyncService = cloudSyncService,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable("followups") {
            FollowUpScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable("sos") {
            SosInboxScreen(
                cloudSyncService = cloudSyncService,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable("wearables") {
            WearablePairingScreen(
                wearableDataSource = wearableDataSource,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable("patients") {
            PatientListScreen(
                patientRepository = patientRepository,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToAddPatient = { navController.navigate("add_patient") },
                onNavigateToPatientDetail = { patientId ->
                    navController.navigate("patient_detail/$patientId")
                }
            )
        }

        composable("add_patient") {
            AddPatientScreen(
                patientRepository = patientRepository,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(
            route = "patient_detail/{patientId}",
            arguments = listOf(navArgument("patientId") { type = NavType.StringType })
        ) { backStackEntry ->
            val patientId = backStackEntry.arguments?.getString("patientId") ?: ""
            PatientDetailScreen(
                patientId = patientId,
                patientRepository = patientRepository,
                triageRepository = triageRepository,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToTriage = { navController.navigate("triage") },
                onNavigateToRecordDetail = { recordId ->
                    navController.navigate("triage_detail/$recordId")
                }
            )
        }

        composable("records") {
            RecordsScreen(
                triageRepository = triageRepository,
                cloudSyncService = cloudSyncService,
                onNavigateToRecordDetail = { recordId ->
                    navController.navigate("triage_detail/$recordId")
                },
                onTabSelected = { tab ->
                    navController.navigate(tab.route)
                }
            )
        }

        composable(
            route = "triage_detail/{recordId}",
            arguments = listOf(navArgument("recordId") { type = NavType.StringType })
        ) { backStackEntry ->
            val recordId = backStackEntry.arguments?.getString("recordId") ?: ""
            TriageRecordDetailScreen(
                recordId = recordId,
                triageRepository = triageRepository,
                patientRepository = patientRepository,
                cloudSyncService = cloudSyncService,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToDoctorChat = { caseId -> navController.navigate("doctor_chat/$caseId") }
            )
        }

        composable(
            route = "doctor_chat/{caseId}",
            arguments = listOf(navArgument("caseId") { type = NavType.StringType })
        ) { backStackEntry ->
            val caseId = backStackEntry.arguments?.getString("caseId") ?: "PAT-101"
            DoctorChatScreen(
                cloudSyncService = cloudSyncService,
                speechRecognizerManager = speechRecognizerManager,
                caseId = caseId,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable("doctor_chat") {
            DoctorChatScreen(
                cloudSyncService = cloudSyncService,
                speechRecognizerManager = speechRecognizerManager,
                caseId = "PAT-101",
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable("profile") {
            ProfileScreen(
                onLogout = {
                    navController.navigate("login") {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onTabSelected = { tab ->
                    navController.navigate(tab.route)
                }
            )
        }

        composable("guidelines") {
            HealthGuidelinesScreen(
                onTabSelected = { tab ->
                    navController.navigate(tab.route)
                }
            )
        }
    }
}
