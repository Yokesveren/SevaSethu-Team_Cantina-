package com.byteclub.ashasetu.ui.guidelines

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.byteclub.ashasetu.ui.components.BottomNavBar
import com.byteclub.ashasetu.ui.components.BottomNavTab
import com.byteclub.ashasetu.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HealthGuidelinesScreen(
    onTabSelected: (BottomNavTab) -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Maternal & Child Guidelines", fontWeight = FontWeight.Bold, color = CardWhite) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NavyPrimary)
            )
        },
        bottomBar = {
            BottomNavBar(currentRoute = "guidelines", onTabSelected = onTabSelected)
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
                Text(
                    text = "Offline Clinical Guidelines (National Health Mission)",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Spacer(modifier = Modifier.height(12.dp))
            }

            item {
                GuidelineCard(
                    title = "1. Preeclampsia & Eclampsia Protocols",
                    bullets = listOf(
                        "Systolic BP >= 160 or Diastolic BP >= 110: Administer Loading dose Magnesium Sulfate (if trained) & refer RED urgent.",
                        "Monitor for severe persistent headache, epigastric pain, or visual disturbances."
                    )
                )
                Spacer(modifier = Modifier.height(12.dp))
            }

            item {
                GuidelineCard(
                    title = "2. Severe Anemia Management in ANC",
                    bullets = listOf(
                        "Hb < 7.0 g/dL: High Risk RED Alert. Urgent referral for parenteral Iron / Blood transfusion.",
                        "Hb 7.0 - 9.9 g/dL: Double dose Iron-Folic Acid (IFA) tablets + dietary counseling."
                    )
                )
                Spacer(modifier = Modifier.height(12.dp))
            }

            item {
                GuidelineCard(
                    title = "3. Postpartum Hemorrhage (PPH) Action Plan",
                    bullets = listOf(
                        "Excessive bleeding after delivery: Uterine massage immediately + call 108 ambulance.",
                        "Keep patient warm, elevate legs, and prepare referral summary."
                    )
                )
            }
        }
    }
}

@Composable
private fun GuidelineCard(title: String, bullets: List<String>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = CardWhite)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = title, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = NavyPrimary)
            Spacer(modifier = Modifier.height(8.dp))
            bullets.forEach { bullet ->
                Text(text = "• $bullet", fontSize = 12.sp, color = TextSecondary)
                Spacer(modifier = Modifier.height(4.dp))
            }
        }
    }
}
