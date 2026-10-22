package com.byteclub.ashasetu.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.byteclub.ashasetu.ui.theme.*

@Composable
fun SyncStatusBar(
    isOnline: Boolean,
    pendingSyncCount: Int,
    onToggleOnline: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    val barBg = if (isOnline) GreenSyncedBg else YellowModerateBg
    val dotColor = if (isOnline) GreenSynced else YellowModerate
    val statusText = if (isOnline) "ONLINE" else "OFFLINE MODE"

    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(barBg)
            .padding(horizontal = 16.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Spacer(
                modifier = Modifier
                    .size(10.dp)
                    .clip(CircleShape)
                    .background(dotColor)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = statusText,
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                color = if (isOnline) GreenSynced else Color(0xFF7A5800)
            )
            if (pendingSyncCount > 0) {
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "($pendingSyncCount pending sync)",
                    fontSize = 11.sp,
                    color = TextSecondary
                )
            }
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "Demo Switch",
                fontSize = 11.sp,
                color = TextSecondary,
                modifier = Modifier.padding(end = 6.dp)
            )
            Switch(
                checked = isOnline,
                onCheckedChange = onToggleOnline,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = CardWhite,
                    checkedTrackColor = GreenSynced,
                    uncheckedThumbColor = CardWhite,
                    uncheckedTrackColor = YellowModerate
                ),
                modifier = Modifier.size(scale = 0.7f, density = 1.0f)
            )
        }
    }
}

private fun Modifier.size(scale: Float, density: Float): Modifier = this
