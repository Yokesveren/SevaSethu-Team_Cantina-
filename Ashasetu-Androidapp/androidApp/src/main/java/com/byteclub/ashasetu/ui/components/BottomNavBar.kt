package com.byteclub.ashasetu.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.byteclub.ashasetu.ui.theme.*

sealed class BottomNavTab(val route: String, val label: String, val icon: ImageVector) {
    object Home : BottomNavTab("dashboard", "Home", Icons.Default.Home)
    object Records : BottomNavTab("records", "Records", Icons.Default.Folder)
    object Guidelines : BottomNavTab("guidelines", "Guidelines", Icons.Default.Book)
    object Profile : BottomNavTab("profile", "Profile", Icons.Default.Person)
}

@Composable
fun BottomNavBar(
    currentRoute: String,
    onTabSelected: (BottomNavTab) -> Unit,
    modifier: Modifier = Modifier
) {
    val tabs = listOf(
        BottomNavTab.Home,
        BottomNavTab.Records,
        BottomNavTab.Guidelines,
        BottomNavTab.Profile
    )

    NavigationBar(
        containerColor = CardWhite,
        modifier = modifier
    ) {
        tabs.forEach { tab ->
            val isSelected = currentRoute == tab.route
            NavigationBarItem(
                selected = isSelected,
                onClick = { onTabSelected(tab) },
                icon = {
                    Icon(
                        imageVector = tab.icon,
                        contentDescription = tab.label
                    )
                },
                label = {
                    Text(
                        text = tab.label,
                        fontSize = 11.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = NavyPrimary,
                    selectedTextColor = NavyPrimary,
                    indicatorColor = OrangeLight,
                    unselectedIconColor = TextMuted,
                    unselectedTextColor = TextMuted
                )
            )
        }
    }
}
