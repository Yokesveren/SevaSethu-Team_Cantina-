package com.byteclub.ashasetu.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = NavyPrimary,
    onPrimary = CardWhite,
    primaryContainer = NavyDark,
    secondary = OrangeAccent,
    onSecondary = CardWhite,
    background = OffWhiteBg,
    surface = CardWhite,
    onBackground = TextPrimary,
    onSurface = TextPrimary
)

@Composable
fun SevaSethuTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography,
        content = content
    )
}
