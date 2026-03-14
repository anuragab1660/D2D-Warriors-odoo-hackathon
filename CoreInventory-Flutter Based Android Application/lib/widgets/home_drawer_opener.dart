import 'package:flutter/material.dart';

/// InheritedWidget that exposes the home scaffold's openDrawer callback
/// to any child screen embedded in the HomeScreen IndexedStack.
class HomeDrawerOpener extends InheritedWidget {
  final VoidCallback openDrawer;

  const HomeDrawerOpener({
    super.key,
    required this.openDrawer,
    required super.child,
  });

  static HomeDrawerOpener? maybeOf(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<HomeDrawerOpener>();
  }

  /// Opens the home drawer if available. Safe to call from any context.
  static void open(BuildContext context) {
    maybeOf(context)?.openDrawer();
  }

  @override
  bool updateShouldNotify(HomeDrawerOpener oldWidget) =>
      openDrawer != oldWidget.openDrawer;
}
