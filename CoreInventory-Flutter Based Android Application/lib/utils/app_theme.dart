import 'package:flutter/material.dart';

class AppTheme {
  // ── Color constants (dark premium palette) ─────────────────────────────────
  static const Color primary         = Color(0xFF0F172A); // slate-900
  static const Color accent          = Color(0xFF22C55E); // green-500
  static const Color background      = Color(0xFF0F172A); // slate-900
  static const Color surface         = Color(0xFF1E293B); // slate-800
  static const Color surfaceVariant  = Color(0xFF162032); // slightly different card bg
  static const Color cardDark        = Color(0xFF1E293B); // alias for surface
  static const Color border          = Color(0xFF334155); // slate-700
  static const Color textPrimary     = Color(0xFFF1F5F9); // slate-100
  static const Color textSecondary   = Color(0xFF94A3B8); // slate-400
  static const Color error           = Color(0xFFEF4444); // red-500
  static const Color warning         = Color(0xFFF59E0B); // amber-500
  static const Color info            = Color(0xFF3B82F6); // blue-500

  static ThemeData get theme => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: const ColorScheme.dark(
          primary: accent,
          secondary: accent,
          surface: surface,
          error: error,
          onPrimary: Colors.white,
          onSecondary: Colors.white,
          onSurface: textPrimary,
          onError: Colors.white,
          outline: border,
        ),
        scaffoldBackgroundColor: background,

        // ── AppBar ──────────────────────────────────────────────────────────
        appBarTheme: const AppBarTheme(
          backgroundColor: surface,
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: false,
          surfaceTintColor: Colors.transparent,
          titleTextStyle: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
          iconTheme: IconThemeData(color: Colors.white),
          actionsIconTheme: IconThemeData(color: Colors.white),
        ),

        // ── Cards ───────────────────────────────────────────────────────────
        cardTheme: CardThemeData(
          color: surface,
          elevation: 0,
          shadowColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: border, width: 1),
          ),
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        ),

        // ── ElevatedButton ──────────────────────────────────────────────────
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: accent,
            foregroundColor: Colors.white,
            disabledBackgroundColor: border,
            disabledForegroundColor: textSecondary,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
            textStyle: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        // ── OutlinedButton ──────────────────────────────────────────────────
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: textPrimary,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            side: const BorderSide(color: border),
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
            textStyle: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        // ── TextButton ──────────────────────────────────────────────────────
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: accent,
            textStyle: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        // ── InputDecoration ─────────────────────────────────────────────────
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: surface,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: accent, width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: error),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: error, width: 2),
          ),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          hintStyle: const TextStyle(color: textSecondary, fontSize: 14),
          labelStyle: const TextStyle(color: textSecondary, fontSize: 14),
          floatingLabelStyle: const TextStyle(color: accent, fontSize: 13),
          prefixIconColor: textSecondary,
          suffixIconColor: textSecondary,
        ),

        // ── Typography ──────────────────────────────────────────────────────
        textTheme: const TextTheme(
          headlineLarge: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: textPrimary,
          ),
          headlineMedium: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: textPrimary,
          ),
          headlineSmall: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: textPrimary,
          ),
          titleLarge: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: textPrimary,
          ),
          titleMedium: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: textPrimary,
          ),
          titleSmall: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: textPrimary,
          ),
          bodyLarge: TextStyle(fontSize: 16, color: textPrimary),
          bodyMedium: TextStyle(fontSize: 14, color: textSecondary),
          bodySmall: TextStyle(fontSize: 12, color: textSecondary),
          labelLarge: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: textPrimary,
          ),
          labelMedium: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: textSecondary,
          ),
          labelSmall: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: textSecondary,
          ),
        ),

        // ── BottomNavigationBar ─────────────────────────────────────────────
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: surface,
          selectedItemColor: accent,
          unselectedItemColor: textSecondary,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          selectedLabelStyle:
              TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          unselectedLabelStyle: TextStyle(fontSize: 12),
        ),

        // ── Chip ────────────────────────────────────────────────────────────
        chipTheme: ChipThemeData(
          backgroundColor: surfaceVariant,
          selectedColor: accent.withOpacity(0.2),
          labelStyle: const TextStyle(color: textPrimary, fontSize: 13),
          secondaryLabelStyle: const TextStyle(color: accent, fontSize: 13),
          side: const BorderSide(color: border),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20)),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        ),

        // ── Divider ─────────────────────────────────────────────────────────
        dividerTheme: const DividerThemeData(
          color: border,
          thickness: 1,
          space: 1,
        ),

        // ── Drawer ──────────────────────────────────────────────────────────
        drawerTheme: const DrawerThemeData(
          backgroundColor: surface,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
        ),

        // ── ListTile ────────────────────────────────────────────────────────
        listTileTheme: const ListTileThemeData(
          textColor: textPrimary,
          iconColor: textSecondary,
          tileColor: Colors.transparent,
          selectedTileColor: Color(0xFF22C55E1A),
          selectedColor: accent,
        ),

        // ── SnackBar ────────────────────────────────────────────────────────
        snackBarTheme: SnackBarThemeData(
          backgroundColor: surface,
          contentTextStyle: const TextStyle(color: textPrimary),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: const BorderSide(color: border)),
        ),

        // ── Dialog ──────────────────────────────────────────────────────────
        dialogTheme: DialogThemeData(
          backgroundColor: surface,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: border),
          ),
          titleTextStyle: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: textPrimary,
          ),
          contentTextStyle: const TextStyle(
            fontSize: 14,
            color: textSecondary,
          ),
        ),

        // ── Switch ──────────────────────────────────────────────────────────
        switchTheme: SwitchThemeData(
          thumbColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) return accent;
            return textSecondary;
          }),
          trackColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return accent.withOpacity(0.3);
            }
            return border;
          }),
        ),

        // ── FloatingActionButton ────────────────────────────────────────────
        floatingActionButtonTheme: const FloatingActionButtonThemeData(
          backgroundColor: accent,
          foregroundColor: Colors.white,
          elevation: 4,
        ),

        // ── Icon ────────────────────────────────────────────────────────────
        iconTheme: const IconThemeData(color: textSecondary),
        primaryIconTheme: const IconThemeData(color: Colors.white),

        // ── PopupMenu ───────────────────────────────────────────────────────
        popupMenuTheme: PopupMenuThemeData(
          color: surface,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: const BorderSide(color: border),
          ),
          textStyle: const TextStyle(color: textPrimary, fontSize: 14),
        ),
      );
}
