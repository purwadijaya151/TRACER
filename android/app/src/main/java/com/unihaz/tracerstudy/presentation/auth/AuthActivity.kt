package com.unihaz.tracerstudy.presentation.auth

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.presentation.auth.login.LoginFragment
import com.unihaz.tracerstudy.presentation.auth.register.RegisterFragment

class AuthActivity : AppCompatActivity(R.layout.activity_auth) {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (savedInstanceState == null) showLogin()
    }

    fun showLogin() {
        supportFragmentManager.beginTransaction()
            .replace(R.id.authContainer, LoginFragment())
            .commit()
    }

    fun showRegister() {
        supportFragmentManager.beginTransaction()
            .replace(R.id.authContainer, RegisterFragment())
            .addToBackStack("register")
            .commit()
    }
}
