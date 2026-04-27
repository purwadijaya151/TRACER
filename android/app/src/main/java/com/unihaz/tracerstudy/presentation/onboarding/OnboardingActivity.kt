package com.unihaz.tracerstudy.presentation.onboarding

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.annotation.DrawableRes
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.RecyclerView
import androidx.viewpager2.widget.ViewPager2
import com.google.android.material.button.MaterialButton
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.presentation.auth.AuthActivity
import kotlinx.coroutines.launch
import org.koin.androidx.viewmodel.ext.android.viewModel

class OnboardingActivity : AppCompatActivity(R.layout.activity_onboarding) {
    private val viewModel: OnboardingViewModel by viewModel()
    private val slides = listOf(
        Slide(
            "Ceritakan Perjalananmu",
            "Bagikan pengalamanmu setelah lulus kepada almamater tercinta.",
            R.drawable.onboarding_asset_story
        ),
        Slide(
            "Data Alumni Bermakna",
            "Tracer study membantu kampus meningkatkan kualitas pendidikan.",
            R.drawable.onboarding_asset_data
        ),
        Slide(
            "Mulai Sekarang",
            "Hanya butuh 5 menit untuk mengisi data tracer study kamu.",
            R.drawable.onboarding_asset_graduate
        )
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val pager = findViewById<ViewPager2>(R.id.onboardingPager)
        val next = findViewById<MaterialButton>(R.id.btnOnboardingNext)
        val login = findViewById<TextView>(R.id.tvOnboardingLogin)
        val dots = findViewById<LinearLayout>(R.id.dotContainer)

        pager.adapter = OnboardingAdapter(slides)
        renderDots(dots, 0)
        pager.registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
            override fun onPageSelected(position: Int) {
                renderDots(dots, position)
                next.text = if (position == slides.lastIndex) "Mulai Isi Tracer Study" else "Lanjut"
            }
        })
        next.setOnClickListener {
            if (pager.currentItem == slides.lastIndex) openAuth() else pager.currentItem += 1
        }
        login.setOnClickListener { openAuth() }
    }

    private fun openAuth() {
        lifecycleScope.launch {
            viewModel.markOnboardingShown()
            startActivity(Intent(this@OnboardingActivity, AuthActivity::class.java))
            finish()
        }
    }

    private fun renderDots(container: LinearLayout, active: Int) {
        container.removeAllViews()
        slides.indices.forEach { index ->
            val dot = TextView(this)
            dot.text = "\u2022"
            dot.textSize = 28f
            dot.setTextColor(
                ContextCompat.getColor(
                    this,
                    if (index == active) R.color.onboarding_dot_active else R.color.onboarding_dot_inactive
                )
            )
            container.addView(dot)
        }
    }
}

private data class Slide(
    val title: String,
    val description: String,
    @param:DrawableRes val imageRes: Int
)

private class OnboardingAdapter(private val slides: List<Slide>) : RecyclerView.Adapter<OnboardingAdapter.Holder>() {
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_onboarding, parent, false)
        return Holder(view)
    }

    override fun onBindViewHolder(holder: Holder, position: Int) = holder.bind(slides[position])

    override fun getItemCount(): Int = slides.size

    class Holder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        fun bind(slide: Slide) {
            itemView.findViewById<ImageView>(R.id.ivIllustration).apply {
                setImageResource(slide.imageRes)
                contentDescription = slide.title
            }
            itemView.findViewById<TextView>(R.id.tvOnboardingTitle).text = slide.title
            itemView.findViewById<TextView>(R.id.tvOnboardingDesc).text = slide.description
        }
    }
}
