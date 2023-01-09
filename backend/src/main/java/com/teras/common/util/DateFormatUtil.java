package com.teras.common.util;

import java.text.SimpleDateFormat;
import java.util.Date;

public class DateFormatUtil {
	static SimpleDateFormat nowFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:SS");
	static SimpleDateFormat dayFormat = new SimpleDateFormat("yyyy-MM-dd");
	static SimpleDateFormat yearFormat = new SimpleDateFormat("yyyy");
	
	public static String now() {
		return nowFormat.format(new Date());
	}

	public static String nowDate() {
		return dayFormat.format(new Date());
	}
	
	public static String nowMonth(int month) {
		Date date = new Date();
		date.setMonth(month);
		return yearFormat.format(date);
	}
}
