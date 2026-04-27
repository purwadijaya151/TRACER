package com.unihaz.tracerstudy.presentation.main

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.presentation.home.HomeFragment
import com.unihaz.tracerstudy.presentation.notification.NotificationFragment
import com.unihaz.tracerstudy.presentation.profile.ProfileFragment
import com.unihaz.tracerstudy.presentation.tracerstudy.TracerStudyFragment

class MainActivity : AppCompatActivity(R.layout.activity_main) {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val nav = findViewById<BottomNavigationView>(R.id.bottomNavigation)
        if (savedInstanceState == null) showFragment(HomeFragment())
        nav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> showFragment(HomeFragment())
                R.id.nav_tracer -> showFragment(TracerStudyFragment())
                R.id.nav_profile -> showFragment(ProfileFragment())
                R.id.nav_notifications -> showFragment(NotificationFragment())
                else -> false
            }
        }
    }

    fun openTracerStudy() {
        findViewById<BottomNavigationView>(R.id.bottomNavigation).selectedItemId = R.id.nav_tracer
    }

    fun openProfile() {
        findViewById<BottomNavigationView>(R.id.bottomNavigation).selectedItemId = R.id.nav_profile
    }

    fun openNotifications() {
        findViewById<BottomNavigationView>(R.id.bottomNavigation).selectedItemId = R.id.nav_notifications
    }

    private fun showFragment(fragment: Fragment): Boolean {
        supportFragmentManager.beginTransaction()
            .replace(R.id.mainContainer, fragment)
            .commit()
        return true
    }
}
