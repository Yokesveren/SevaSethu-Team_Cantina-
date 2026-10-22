package com.byteclub.ashasetu.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.byteclub.ashasetu.domain.triage.RiskBand
import com.byteclub.ashasetu.ui.theme.*

@Composable
fun RiskBadge(
    riskBand: RiskBand,
    modifier: Modifier = Modifier,
    displayText: String? = null
) {
    val (bgColor, textColor, icon, label) = when (riskBand) {
        RiskBand.RED -> Quadruple(RedUrgentBg, RedUrgent, Icons.Default.Warning, displayText ?: "RED URGENT")
        RiskBand.YELLOW -> Quadruple(YellowModerateBg, YellowModerate, Icons.Default.Warning, displayText ?: "YELLOW MODERATE")
        RiskBand.GREEN -> Quadruple(GreenLowBg, GreenLow, Icons.Default.CheckCircle, displayText ?: "GREEN LOW")
    }

    Row(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(bgColor)
            .padding(horizontal = 10.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = textColor,
            modifier = Modifier.size(14.dp)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = label,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

private data class Quadruple<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
