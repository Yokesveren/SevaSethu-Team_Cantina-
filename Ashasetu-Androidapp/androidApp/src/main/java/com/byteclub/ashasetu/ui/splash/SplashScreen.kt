package com.byteclub.ashasetu.ui.splash

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.HealthAndSafety
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.byteclub.ashasetu.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    onSplashComplete: () -> Unit,
    modifier: Modifier = Modifier
) {
    LaunchedEffect(Unit) {
        delay(2000)
        onSplashComplete()
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(NavyPrimary),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.HealthAndSafety,
                contentDescription = null,
                tint = OrangeAccent,
                modifier = Modifier.size(80.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "ASHA Setu",
                fontWeight = FontWeight.Bold,
                fontSize = 32.sp,
                color = CardWhite
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "आशा सेतू • Rural Health & Offline Triage",
                fontWeight = FontWeight.Medium,
                fontSize = 14.sp,
                color = OrangeLight
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Govt. of Maharashtra Health Mission",
                fontSize = 12.sp,
                color = TextMuted
            )

            Spacer(modifier = Modifier.height(48.dp))

            CircularProgressIndicator(
                color = OrangeAccent,
                modifier = Modifier.size(32.dp),
                strokeWidth = 3.dp
            )
        }
    }
}
