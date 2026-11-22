package vn.tetcountdown

import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit

/** Trạng thái đếm ngược tại một ngày, dùng chung cho widget. Khớp logic src/pwa/app.js. */
data class TetState(
    val year: Int,
    val tet: LocalDate,
    /** Số ngày tròn còn lại (giống số to trên app). -1 nếu đang trong Tết. */
    val daysLeft: Long,
    /** Đang mùng 1–3: 1, 2, 3; ngoài Tết: 0. */
    val tetDay: Int,
) {
    companion object {
        val ZONE: ZoneId = ZoneId.of("Asia/Ho_Chi_Minh")
        private const val TET_DAYS = 3L

        fun at(today: LocalDate = LocalDate.now(ZONE)): TetState {
            var year = today.year
            var tet = Lunar.tetDate(year)
            if (!today.isBefore(tet.plusDays(TET_DAYS))) {
                year += 1
                tet = Lunar.tetDate(year)
            }
            return if (today.isBefore(tet)) {
                // App đếm (thời điểm Tết - bây giờ) / 24h, làm tròn xuống = số ngày lịch - 1
                TetState(year, tet, ChronoUnit.DAYS.between(today, tet) - 1, 0)
            } else {
                TetState(year, tet, -1, ChronoUnit.DAYS.between(tet, today).toInt() + 1)
            }
        }
    }
}
