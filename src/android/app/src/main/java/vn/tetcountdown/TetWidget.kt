package vn.tetcountdown

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/** Widget màn hình chính: số ngày còn lại đến Tết. Tự cập nhật lúc 0h mỗi ngày. */
class TetWidget : AppWidgetProvider() {

    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        ids.forEach { render(context, manager, it) }
        scheduleMidnight(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        when (intent.action) {
            ACTION_TICK,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED,
            Intent.ACTION_BOOT_COMPLETED -> updateAll(context)
        }
    }

    override fun onDisabled(context: Context) {
        alarmManager(context).cancel(tickIntent(context))
    }

    companion object {
        private const val ACTION_TICK = "vn.tetcountdown.TICK"
        private val DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy")

        fun updateAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, TetWidget::class.java))
            if (ids.isEmpty()) return
            ids.forEach { render(context, manager, it) }
            scheduleMidnight(context)
        }

        private fun render(context: Context, manager: AppWidgetManager, id: Int) {
            val s = TetState.at()
            val v = RemoteViews(context.packageName, R.layout.widget_tet)

            v.setTextViewText(R.id.tv_title, "TẾT " + Lunar.canChi(s.year).uppercase())
            if (s.tetDay == 0) {
                v.setViewVisibility(R.id.tv_days, View.VISIBLE)
                v.setTextViewText(R.id.tv_days, s.daysLeft.toString())
                v.setTextViewText(
                    R.id.tv_label,
                    if (s.daysLeft == 0L) "Đêm nay Giao thừa" else "ngày nữa là Tết"
                )
                v.setTextViewText(R.id.tv_date, s.tet.format(DATE_FMT))
            } else {
                v.setViewVisibility(R.id.tv_days, View.GONE)
                v.setTextViewText(R.id.tv_label, "Chúc Mừng Năm Mới")
                v.setTextViewText(R.id.tv_date, "Mùng ${s.tetDay} Tết · Năm con ${Lunar.conGiap(s.year)}")
            }

            val open = PendingIntent.getActivity(
                context, 0, Intent(context, MainActivity::class.java),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            v.setOnClickPendingIntent(R.id.root, open)
            manager.updateAppWidget(id, v)
        }

        /** Hẹn cập nhật lúc 0h (giờ VN). Báo thức không chính xác tuyệt đối, không cần quyền đặc biệt. */
        private fun scheduleMidnight(context: Context) {
            val next = LocalDate.now(TetState.ZONE).plusDays(1)
                .atStartOfDay(TetState.ZONE).toInstant().toEpochMilli() + 5_000
            alarmManager(context).set(AlarmManager.RTC, next, tickIntent(context))
        }

        private fun tickIntent(context: Context): PendingIntent = PendingIntent.getBroadcast(
            context, 1,
            Intent(context, TetWidget::class.java).setAction(ACTION_TICK),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        private fun alarmManager(context: Context) =
            context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    }
}
