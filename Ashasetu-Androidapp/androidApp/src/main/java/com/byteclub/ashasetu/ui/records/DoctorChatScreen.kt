package com.byteclub.ashasetu.ui.records

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import coil.compose.AsyncImage
import com.byteclub.ashasetu.data.repository.CloudSyncService
import com.byteclub.ashasetu.domain.nlp.SpeechRecognizerManager
import com.byteclub.ashasetu.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DoctorChatScreen(
    cloudSyncService: CloudSyncService,
    speechRecognizerManager: SpeechRecognizerManager,
    caseId: String = "PAT-101",
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val observedTeleconsult by cloudSyncService.observeTeleconsultRequest(caseId).collectAsState(initial = null)
    val teleconsultMap by cloudSyncService.teleconsultState.collectAsState()
    val teleconsultReq = observedTeleconsult ?: teleconsultMap[caseId]

    val liveMessages by cloudSyncService.observeChatMessages(caseId).collectAsState(initial = emptyList())
    val defaultMessages by cloudSyncService.chatMessages.collectAsState()
    val messages = if (liveMessages.isNotEmpty()) liveMessages else defaultMessages

    val isListening by speechRecognizerManager.isListening.collectAsState()
    val recognizedText by speechRecognizerManager.recognizedText.collectAsState()

    var inputText by remember { mutableStateOf("") }
    var selectedImageUri by remember { mutableStateOf<String?>(null) }
    var isUploadingImage by remember { mutableStateOf(false) }
    var selectedLanguage by remember { mutableStateOf("Marathi (मराठी)") }
    var languageMenuExpanded by remember { mutableStateOf(false) }
    var showDoctorConnectedPopup by remember { mutableStateOf(true) }

    val scope = rememberCoroutineScope()

    val languages = listOf("Marathi (मराठी)", "Hindi (हिंदी)", "Tamil (தமிழ்)", "English")

    val isApproved = teleconsultReq?.status == "APPROVED_CONNECTED"

    if (isApproved && showDoctorConnectedPopup) {
        AlertDialog(
            onDismissRequest = { showDoctorConnectedPopup = false },
            icon = {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = GreenSynced,
                    modifier = Modifier.size(48.dp)
                )
            },
            title = {
                Text(
                    text = "Doctor Connected & Approved",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = GreenSynced
                )
            },
            text = {
                Column {
                    Text(
                        text = "Connected Doctor Details:",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("• Name: Dr. Aravind Kumar", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                    Text("• Doctor ID: DOC-PHC-0001", fontSize = 12.sp, color = TextSecondary)
                    Text("• Role: PHC Medical Officer", fontSize = 12.sp, color = TextSecondary)
                    Text("• Specialty: General Medicine & Trauma", fontSize = 12.sp, color = TextSecondary)
                    Text("• Cloud Status: Approved & Live stream connected", fontSize = 11.sp, color = GreenSynced)
                }
            },
            confirmButton = {
                TextButton(onClick = { showDoctorConnectedPopup = false }) {
                    Text("OPEN CHATBOX", fontWeight = FontWeight.Bold, color = NavyPrimary)
                }
            }
        )
    }

    LaunchedEffect(recognizedText) {
        if (recognizedText.isNotBlank()) {
            inputText = recognizedText
            speechRecognizerManager.resetRecognizedText()
        }
    }

    val selectedLangCode = when {
        selectedLanguage.contains("Tamil") -> "ta-IN"
        selectedLanguage.contains("Hindi") -> "hi-IN"
        selectedLanguage.contains("Marathi") -> "mr-IN"
        else -> "en-IN"
    }

    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            selectedImageUri = uri.toString()
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            speechRecognizerManager.startListening(selectedLangCode)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (isApproved) "Dr. Aravind Kumar (DOC-PHC-0001)" else "Connecting to Doctor...",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = CardWhite
                        )
                        Text(
                            text = if (isApproved) "PHC Medical Officer Connected • Case $caseId" else "Awaiting Doctor Approval • Case $caseId",
                            fontSize = 11.sp,
                            color = if (isApproved) GreenLow else YellowModerate
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null, tint = CardWhite)
                    }
                },
                actions = {
                    Box {
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(16.dp))
                                .background(OrangeAccent)
                                .clickable { languageMenuExpanded = true }
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Language, contentDescription = null, tint = NavyPrimary, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = selectedLanguage.split(" ")[0],
                                color = NavyPrimary,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        DropdownMenu(
                            expanded = languageMenuExpanded,
                            onDismissRequest = { languageMenuExpanded = false }
                        ) {
                            languages.forEach { lang ->
                                DropdownMenuItem(
                                    text = { Text(lang, fontSize = 13.sp) },
                                    onClick = {
                                        selectedLanguage = lang
                                        languageMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NavyPrimary)
            )
        }
    ) { innerPadding ->
        if (!isApproved) {
            Box(
                modifier = modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(OffWhiteBg)
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = CardWhite)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(
                            color = NavyPrimary,
                            strokeWidth = 3.dp,
                            modifier = Modifier.size(52.dp)
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "Connecting to Doctor Dashboard...",
                            fontWeight = FontWeight.Bold,
                            fontSize = 17.sp,
                            color = NavyPrimary
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "Buffering tele-consultation stream until doctor accepts the request in `teleconsult_requests`.",
                            fontSize = 12.sp,
                            color = TextSecondary,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Card(
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.cardColors(containerColor = OffWhiteBg),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text("• Assigned Doctor ID: DOC-PHC-0001", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text("• Assigned Doctor Name: Dr. Aravind Kumar", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text("• Case ID: $caseId", fontSize = 12.sp, color = TextSecondary)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text("• Connection Status: PENDING_DOCTOR_APPROVAL", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = OrangeAccent)
                            }
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        Text(
                            text = "Please wait while Dr. Aravind Kumar approves the request on the PHC Doctor Dashboard. Chatbox will open automatically once approved.",
                            fontSize = 12.sp,
                            color = TextMuted,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        } else {
            Column(
                modifier = modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(OffWhiteBg)
            ) {
                // Notification Banner with Language Indicator
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(GreenSyncedBg)
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "🟢 Live Chat Stream: triage_cases/$caseId/stream",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = GreenSynced
                        )
                        Text(
                            text = "Voice: $selectedLanguage",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = NavyPrimary
                        )
                    }
                }

                // Message Stream
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (messages.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 40.dp, start = 20.dp, end = 20.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No chat messages yet.\nType a message or use voice input ($selectedLanguage) below to speak with Dr. Aravind Kumar.",
                                    fontSize = 13.sp,
                                    color = TextMuted,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }
                    } else {
                        items(messages) { msg ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = if (msg.isFromDoctor) Arrangement.Start else Arrangement.End
                            ) {
                                Card(
                                    shape = RoundedCornerShape(14.dp),
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (msg.isFromDoctor) CardWhite else NavyPrimary
                                    ),
                                    modifier = Modifier.fillMaxWidth(0.85f)
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text(
                                            text = if (msg.senderName.isBlank()) (if (msg.isFromDoctor) "Dr. Aravind Kumar" else "Sunita Tai (ASHA)") else msg.senderName,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (msg.isFromDoctor) NavyPrimary else OrangeAccent
                                        )
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = msg.text,
                                            fontSize = 13.sp,
                                            color = if (msg.isFromDoctor) TextPrimary else CardWhite
                                        )
                                    if (msg.imageUri != null) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(180.dp)
                                                .clip(RoundedCornerShape(10.dp))
                                                .background(BorderLight)
                                        ) {
                                            AsyncImage(
                                                model = msg.imageUri,
                                                contentDescription = "Patient Photo",
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier.fillMaxSize()
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Message Input Bar with Voice-to-Text & Image Attachment
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
                colors = CardDefaults.cardColors(containerColor = CardWhite)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    if (selectedImageUri != null) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(BorderLight)
                                ) {
                                    AsyncImage(
                                        model = selectedImageUri,
                                        contentDescription = "Attached Preview",
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("📷 1 Medical Image Attached", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = GreenSynced)
                            }
                            Text("Remove", fontSize = 12.sp, color = RedUrgent, fontWeight = FontWeight.Bold, modifier = Modifier.clickable { selectedImageUri = null })
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    if (isUploadingImage) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = NavyPrimary, strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Uploading medical image to Firebase Storage...", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = NavyPrimary)
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Image Attachment Launcher
                        IconButton(
                            onClick = { photoPickerLauncher.launch("image/*") },
                            enabled = !isUploadingImage
                        ) {
                            Icon(Icons.Default.AddPhotoAlternate, contentDescription = "Attach Photo", tint = if (isUploadingImage) TextMuted else NavyPrimary)
                        }

                        // Voice-to-Text Mic Button
                        IconButton(
                            onClick = {
                                if (isListening) {
                                    speechRecognizerManager.stopListening()
                                } else {
                                    val hasPermission = ContextCompat.checkSelfPermission(
                                        context,
                                        Manifest.permission.RECORD_AUDIO
                                    ) == PackageManager.PERMISSION_GRANTED

                                    if (hasPermission) {
                                        speechRecognizerManager.startListening(selectedLangCode)
                                    } else {
                                        permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                                    }
                                }
                            },
                            enabled = !isUploadingImage
                        ) {
                            Icon(
                                imageVector = if (isListening) Icons.Default.Stop else Icons.Default.Mic,
                                contentDescription = "Voice to text",
                                tint = if (isListening) RedUrgent else OrangeAccent
                            )
                        }

                        Spacer(modifier = Modifier.width(4.dp))

                        // Text Field for typing or voice conversion
                        OutlinedTextField(
                            value = inputText,
                            onValueChange = { inputText = it },
                            placeholder = { Text(if (isListening) "Listening in $selectedLanguage..." else "Type message...") },
                            singleLine = false,
                            enabled = !isUploadingImage,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = NavyPrimary,
                                unfocusedBorderColor = BorderLight
                            ),
                            shape = RoundedCornerShape(20.dp),
                            modifier = Modifier.weight(1f)
                        )

                        Spacer(modifier = Modifier.width(6.dp))

                        val canSend = (inputText.isNotBlank() || selectedImageUri != null) && !isUploadingImage

                        // Send Button
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape)
                                .background(if (canSend) NavyPrimary else TextMuted)
                                .clickable(enabled = canSend) {
                                    val messageText = if (inputText.isBlank()) "Medical Photo Attached" else inputText
                                    val imagePath = selectedImageUri

                                    if (imagePath != null) {
                                        isUploadingImage = true
                                        scope.launch {
                                            val downloadUrl = cloudSyncService.uploadImageToStorage(
                                                caseId = caseId,
                                                imageUri = Uri.parse(imagePath)
                                            )
                                            cloudSyncService.sendMessage(
                                                caseId = caseId,
                                                text = messageText,
                                                imageUri = downloadUrl
                                            )
                                            inputText = ""
                                            selectedImageUri = null
                                            speechRecognizerManager.resetRecognizedText()
                                            isUploadingImage = false
                                        }
                                    } else {
                                        cloudSyncService.sendMessage(
                                            caseId = caseId,
                                            text = messageText,
                                            imageUri = null
                                        )
                                        inputText = ""
                                        speechRecognizerManager.resetRecognizedText()
                                    }
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            if (isUploadingImage) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), color = CardWhite, strokeWidth = 2.dp)
                            } else {
                                Icon(Icons.Default.Send, contentDescription = "Send", tint = CardWhite, modifier = Modifier.size(20.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}
}
