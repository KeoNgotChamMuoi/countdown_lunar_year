package vn.tetcountdown

import java.time.LocalDate
import kotlin.math.PI
import kotlin.math.floor
import kotlin.math.sin

/**
 * Tính ngày Tết Nguyên Đán theo giờ Việt Nam (UTC+7).
 * Thuật toán âm lịch của Hồ Ngọc Đức, port 1-1 từ src/pwa/lunar.js.
 */
object Lunar {
    private const val TZ = 7.0

    private fun int(x: Double): Int = floor(x).toInt()

    private fun jdFromDate(dd: Int, mm: Int, yy: Int): Int {
        val a = (14 - mm) / 12
        val y = yy + 4800 - a
        val m = mm + 12 * a - 3
        return dd + (153 * m + 2) / 5 + 365 * y + y / 4 - y / 100 + y / 400 - 32045
    }

    private fun jdToDate(jd: Int): LocalDate {
        val a = jd + 32044
        val b = (4 * a + 3) / 146097
        val c = a - (b * 146097) / 4
        val d = (4 * c + 3) / 1461
        val e = c - (1461 * d) / 4
        val m = (5 * e + 2) / 153
        val day = e - (153 * m + 2) / 5 + 1
        val month = m + 3 - 12 * (m / 10)
        val year = b * 100 + d - 4800 + m / 10
        return LocalDate.of(year, month, day)
    }

    private fun newMoon(k: Int): Double {
        val t = k / 1236.85
        val t2 = t * t
        val t3 = t2 * t
        val dr = PI / 180
        var jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3
        jd1 += 0.00033 * sin((166.56 + 132.87 * t - 0.009173 * t2) * dr)
        val m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3
        val mpr = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3
        val f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3
        var c1 = (0.1734 - 0.000393 * t) * sin(m * dr) + 0.0021 * sin(2 * dr * m)
        c1 -= 0.4068 * sin(mpr * dr) - 0.0161 * sin(dr * 2 * mpr)
        c1 -= 0.0004 * sin(dr * 3 * mpr)
        c1 += 0.0104 * sin(dr * 2 * f) - 0.0051 * sin(dr * (m + mpr))
        c1 -= 0.0074 * sin(dr * (m - mpr)) - 0.0004 * sin(dr * (2 * f + m))
        c1 -= 0.0004 * sin(dr * (2 * f - m)) + 0.0006 * sin(dr * (2 * f + mpr))
        c1 += 0.0010 * sin(dr * (2 * f - mpr)) + 0.0005 * sin(dr * (2 * mpr + m))
        val deltat = if (t < -11)
            0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3
        else
            -0.000278 + 0.000265 * t + 0.000262 * t2
        return jd1 + c1 - deltat
    }

    private fun sunLongitude(jdn: Double): Double {
        val t = (jdn - 2451545.0) / 36525
        val t2 = t * t
        val dr = PI / 180
        val m = 357.52910 + 35999.05030 * t - 0.0001559 * t2 - 0.00000048 * t * t2
        val l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2
        var dl = (1.914600 - 0.004817 * t - 0.000014 * t2) * sin(dr * m)
        dl += (0.019993 - 0.000101 * t) * sin(dr * 2 * m) + 0.000290 * sin(dr * 3 * m)
        val l = (l0 + dl) * dr
        return l - PI * 2 * floor(l / (PI * 2))
    }

    private fun getNewMoonDay(k: Int): Int = int(newMoon(k) + 0.5 + TZ / 24)

    private fun getSunLongitude(dayNumber: Int): Int =
        int(sunLongitude(dayNumber - 0.5 - TZ / 24) / PI * 6)

    private fun getLunarMonth11(yy: Int): Int {
        val off = jdFromDate(31, 12, yy) - 2415021
        val k = int(off / 29.530588853)
        var nm = getNewMoonDay(k)
        if (getSunLongitude(nm) >= 9) nm = getNewMoonDay(k - 1)
        return nm
    }

    private fun getLeapMonthOffset(a11: Int): Int {
        val k = int((a11 - 2415021.076998695) / 29.530588853 + 0.5)
        var i = 1
        var arc = getSunLongitude(getNewMoonDay(k + i))
        var last: Int
        do {
            last = arc
            i++
            arc = getSunLongitude(getNewMoonDay(k + i))
        } while (arc != last && i < 14)
        return i - 1
    }

    /** Ngày dương lịch của mùng 1 Tết năm âm lịch [year]. */
    fun tetDate(year: Int): LocalDate {
        val a11 = getLunarMonth11(year - 1)
        val b11 = getLunarMonth11(year)
        val k = int(0.5 + (a11 - 2415021.076998695) / 29.530588853)
        var off = 2
        if (b11 - a11 > 365 && off >= getLeapMonthOffset(a11)) off += 1
        return jdToDate(getNewMoonDay(k + off))
    }

    private val CAN = arrayOf("Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ")
    private val CHI = arrayOf("Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi")
    private val CON = arrayOf("Khỉ", "Gà", "Chó", "Lợn", "Chuột", "Trâu", "Hổ", "Mèo", "Rồng", "Rắn", "Ngựa", "Dê")

    fun canChi(year: Int): String = CAN[year % 10] + " " + CHI[year % 12]
    fun conGiap(year: Int): String = CON[year % 12]
}
