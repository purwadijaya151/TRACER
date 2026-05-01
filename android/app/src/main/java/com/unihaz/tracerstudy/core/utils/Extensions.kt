package com.unihaz.tracerstudy.core.utils

import android.view.View
import com.google.android.material.snackbar.Snackbar

fun View.showMessage(message: String) {
    Snackbar.make(this, UserMessageSanitizer.snackbar(message), Snackbar.LENGTH_LONG).show()
}

fun String.toInstitutionEmail(): String =
    trim().lowercase().replace(" ", "").let { "$it@${Constants.INSTITUTION_EMAIL_DOMAIN}" }
