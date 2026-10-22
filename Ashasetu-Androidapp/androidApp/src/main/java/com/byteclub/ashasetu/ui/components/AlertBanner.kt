package com.byteclub.ashasetu.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.byteclub.ashasetu.ui.theme.*

@Composable
fun AlertBanner(
    redCount: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    if (redCount <= 0) return

    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(RedUrgentBg)
            .clickable { onClick() }
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = null,
                tint = RedUrgent,
                modifier = Modifier.size(28.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = "$redCount HIGH RISK RED ALERT(S)",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = RedUrgent
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "Critical vitals detected. Immediate hospital referral advised.",
                    fontSize = 11.sp,
                    color = TextPrimary
                )
            }
        }
        Text(
            text = "VIEW >",
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp,
            color = RedUrgent
        )
    }
}
