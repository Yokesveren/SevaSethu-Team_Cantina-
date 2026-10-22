package com.byteclub.ashasetu.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.byteclub.ashasetu.ui.components.BottomNavBar
import com.byteclub.ashasetu.ui.components.BottomNavTab
import com.byteclub.ashasetu.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onLogout: () -> Unit,
    onTabSelected: (BottomNavTab) -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("ASHA Worker Profile", fontWeight = FontWeight.Bold, color = CardWhite) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NavyPrimary)
            )
        },
        bottomBar = {
            BottomNavBar(currentRoute = "profile", onTabSelected = onTabSelected)
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(OffWhiteBg)
                .padding(16.dp)
        ) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = CardWhite)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Person, contentDescription = null, tint = NavyPrimary)
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(text = "Sunita Tai Patil", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = TextPrimary)
                                Text(text = "Accredited Social Health Activist (ASHA)", fontSize = 12.sp, color = TextSecondary)
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Badge, contentDescription = null, tint = OrangeAccent)
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(text = "ASHA ID: MH-PALGHAR-7892", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, tint = GreenSynced)
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(text = "Block: Palghar • Sub-Centre: Wada Rural", fontSize = 13.sp, color = TextPrimary)
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Lock, contentDescription = null, tint = NavyPrimary)
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(text = "Vault: SQLCipher 256-bit AES Encrypted", fontSize = 12.sp, color = TextMuted)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = onLogout,
                    colors = ButtonDefaults.buttonColors(containerColor = RedUrgent),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Text("LOGOUT & LOCK VAULT", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
